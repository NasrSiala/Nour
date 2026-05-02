import { useState } from "react";
import { useListNotifications, useSendNotification, useListStudents, getListNotificationsQueryKey, getListStudentsQueryKey } from "@workspace/api-client-react";

type SendNotificationBody = {
  templateKey: "absence_alert" | "risk_alert" | "quiz_failure";
  lang: "fr" | "ar";
  customMessage?: string | null;
};
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, Send, CheckCircle2, Clock, XCircle, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const statusConfig = {
  pending: { label: "Pending", icon: Clock, color: "bg-amber-100 text-amber-800" },
  sent: { label: "Sent", icon: CheckCircle2, color: "bg-green-100 text-green-800" },
  failed: { label: "Failed", icon: XCircle, color: "bg-red-100 text-red-800" },
};

type TemplateKey = SendNotificationBody["templateKey"];
type Lang = SendNotificationBody["lang"];

const templateOptions: { value: TemplateKey; label: string }[] = [
  { value: "absence_alert", label: "Absence Alert" },
  { value: "risk_alert", label: "Risk Warning" },
  { value: "quiz_failure", label: "Quiz Failure" },
];

const langOptions: { value: Lang; label: string }[] = [
  { value: "fr", label: "French (Français)" },
  { value: "ar", label: "Arabic (العربية)" },
];

function NotificationRow({ n, index }: { n: { id: number; studentName?: string | null; templateKey: string; lang: string; status: string; sentAt?: string | null; createdAt: string; retries?: number | null }; index: number }) {
  const cfg = statusConfig[n.status as keyof typeof statusConfig] ?? statusConfig.pending;
  const Icon = cfg.icon;
  const date = new Date(n.createdAt).toLocaleDateString("fr-TN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  return (
    <motion.tr
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      className="hover:bg-gray-50/50 transition-colors"
    >
      <td className="px-4 py-3 font-medium text-gray-900 text-sm">{n.studentName ?? "—"}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{templateOptions.find(t => t.value === n.templateKey)?.label ?? n.templateKey}</td>
      <td className="px-4 py-3 text-xs text-gray-500 uppercase">{n.lang}</td>
      <td className="px-4 py-3">
        <span className={cn("inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium", cfg.color)}>
          <Icon className="h-3 w-3" />
          {cfg.label}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-gray-400">{date}</td>
    </motion.tr>
  );
}

export default function AdminNotifications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey | "">("");
  const [selectedLang, setSelectedLang] = useState<Lang>("fr");
  const [isSending, setIsSending] = useState(false);

  const { data: notifications, isLoading } = useListNotifications(
    filterStatus !== "all" ? { status: filterStatus as "pending" | "sent" | "failed" } : {},
    { query: { queryKey: getListNotificationsQueryKey(filterStatus !== "all" ? { status: filterStatus as "pending" | "sent" | "failed" } : {}) } }
  );

  const { data: students } = useListStudents({ isActive: true }, { query: { queryKey: getListStudentsQueryKey({ isActive: true }) } });

  const sendMutation = useSendNotification();

  const sentCount = notifications?.filter(n => n.status === "sent").length ?? 0;
  const pendingCount = notifications?.filter(n => n.status === "pending").length ?? 0;
  const failedCount = notifications?.filter(n => n.status === "failed").length ?? 0;

  const handleSend = async () => {
    if (!selectedStudentId || !selectedTemplate) {
      toast({ title: "Please select a student and template", variant: "destructive" });
      return;
    }
    setIsSending(true);
    try {
      await sendMutation.mutateAsync({ studentId: Number(selectedStudentId), data: { templateKey: selectedTemplate, lang: selectedLang } });
      queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey({}) });
      queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey({ status: "pending" }) });
      toast({ title: "Notification queued successfully" });
      setSelectedStudentId("");
      setSelectedTemplate("");
    } catch {
      toast({ title: "Failed to send notification", variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Parent Notifications</h1>
        <p className="text-muted-foreground">Manage and send SMS/WhatsApp notifications to parents</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Sent", count: sentCount, icon: CheckCircle2, color: "text-green-600 bg-green-50" },
          { label: "Pending", count: pendingCount, icon: Clock, color: "text-amber-600 bg-amber-50" },
          { label: "Failed", count: failedCount, icon: XCircle, color: "text-red-600 bg-red-50" },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="pt-5 pb-5">
              <div className={cn("flex items-center gap-3 rounded-xl p-3", stat.color)}>
                <stat.icon className="h-6 w-6" />
                <div>
                  <p className="text-2xl font-bold">{stat.count}</p>
                  <p className="text-sm font-medium">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Compose */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4 text-primary" />
            Send Notification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-1.5">
              <Label>Student</Label>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger data-testid="select-student">
                  <SelectValue placeholder="Choose student…" />
                </SelectTrigger>
                <SelectContent>
                  {students?.map(s => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.firstName} {s.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Template</Label>
              <Select value={selectedTemplate} onValueChange={v => setSelectedTemplate(v as TemplateKey)}>
                <SelectTrigger data-testid="select-template">
                  <SelectValue placeholder="Choose template…" />
                </SelectTrigger>
                <SelectContent>
                  {templateOptions.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Language</Label>
              <Select value={selectedLang} onValueChange={v => setSelectedLang(v as Lang)}>
                <SelectTrigger data-testid="select-lang">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {langOptions.map(l => (
                    <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleSend} disabled={isSending || !selectedStudentId || !selectedTemplate} className="gap-2 w-full" data-testid="button-send">
              <Send className="h-4 w-4" />
              {isSending ? "Sending…" : "Send Notification"}
            </Button>
          </div>

          <AnimatePresence>
            {selectedStudentId && selectedTemplate && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-4 pt-4 border-t">
                <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                  <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-500 flex-shrink-0" />
                  <span>
                    A <strong>{templateOptions.find(t => t.value === selectedTemplate)?.label}</strong> notification in{" "}
                    <strong>{langOptions.find(l => l.value === selectedLang)?.label}</strong> will be queued for{" "}
                    <strong>{students?.find(s => String(s.id) === selectedStudentId)?.firstName} {students?.find(s => String(s.id) === selectedStudentId)?.lastName}</strong>'s parent.
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Notification Log */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Notification Log</CardTitle>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Template</th>
                    <th className="px-4 py-3">Lang</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {notifications?.map((n, i) => (
                    <NotificationRow key={n.id} n={n} index={i} />
                  ))}
                  {notifications?.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                        No notifications found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
