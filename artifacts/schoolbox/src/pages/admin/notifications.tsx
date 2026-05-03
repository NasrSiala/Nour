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
import { useTranslation } from "react-i18next";

function NotificationRow({ n, index }: { n: { id: number; studentName?: string | null; templateKey: string; lang: string; status: string; sentAt?: string | null; createdAt: string; retries?: number | null }; index: number }) {
  const { t } = useTranslation();
  const statusConfig = {
    pending: { label: t("pending"), icon: Clock, color: "bg-amber-100 text-amber-800" },
    sent: { label: t("sent"), icon: CheckCircle2, color: "bg-green-100 text-green-800" },
    failed: { label: t("failed"), icon: XCircle, color: "bg-red-100 text-red-800" },
  };
  const cfg = statusConfig[n.status as keyof typeof statusConfig] ?? statusConfig.pending;
  const Icon = cfg.icon;
  const date = new Date(n.createdAt).toLocaleDateString("ar-EG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  return (
    <motion.tr
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      className="hover:bg-gray-50/50 transition-colors"
    >
      <td className="px-4 py-3 font-medium text-gray-900 text-sm">{n.studentName ?? "—"}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{t(n.templateKey)}</td>
      <td className="px-4 py-3 text-xs text-gray-500 uppercase">{n.lang === "ar" ? t("arabic") : t("french")}</td>
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
  const { t } = useTranslation();
  const templateOptions: { value: TemplateKey; label: string }[] = [
    { value: "absence_alert", label: t("absence_alert") },
    { value: "risk_alert", label: t("risk_alert") },
    { value: "quiz_failure", label: t("quiz_failure") },
  ];

  const langOptions: { value: Lang; label: string }[] = [
    { value: "fr", label: t("french") },
    { value: "ar", label: t("arabic") },
  ];

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
      toast({ title: t("pleaseSelectStudentAndTemplate"), variant: "destructive" });
      return;
    }
    setIsSending(true);
    try {
      await sendMutation.mutateAsync({ studentId: Number(selectedStudentId), data: { templateKey: selectedTemplate, lang: selectedLang } });
      queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey({}) });
      queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey({ status: "pending" }) });
      toast({ title: t("notificationQueued") });
      setSelectedStudentId("");
      setSelectedTemplate("");
    } catch {
      toast({ title: t("scanError"), variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="text-inline-start">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">{t("parentNotifications")}</h1>
        <p className="text-muted-foreground">{t("manageNotificationsSubtitle")}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: t("sent"), count: sentCount, icon: CheckCircle2, color: "text-green-600 bg-green-50" },
          { label: t("pending"), count: pendingCount, icon: Clock, color: "text-amber-600 bg-amber-50" },
          { label: t("failed"), count: failedCount, icon: XCircle, color: "text-red-600 bg-red-50" },
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
          <CardTitle className="flex items-center gap-2 text-base text-inline-start">
            <Bell className="h-4 w-4 text-primary" />
            {t("sendNotification")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end text-inline-start">
            <div className="space-y-1.5">
              <Label>{t("student")}</Label>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger data-testid="select-student">
                  <SelectValue placeholder={t("chooseStudent")} />
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
              <Label>{t("template")}</Label>
              <Select value={selectedTemplate} onValueChange={v => setSelectedTemplate(v as TemplateKey)}>
                <SelectTrigger data-testid="select-template">
                  <SelectValue placeholder={t("chooseTemplate")} />
                </SelectTrigger>
                <SelectContent>
                  {templateOptions.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{t("language")}</Label>
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
              {isSending ? t("sending") : t("sendNotification")}
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
        <CardHeader className="flex flex-row items-center justify-between pb-3 text-inline-start">
          <CardTitle className="text-base">{t("notificationLog")}</CardTitle>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("all")}</SelectItem>
              <SelectItem value="sent">{t("sent")}</SelectItem>
              <SelectItem value="pending">{t("pending")}</SelectItem>
              <SelectItem value="failed">{t("failed")}</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-inline-start">
                <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-inline-start">{t("student")}</th>
                    <th className="px-4 py-3 text-inline-start">{t("template")}</th>
                    <th className="px-4 py-3 text-inline-start">{t("language")}</th>
                    <th className="px-4 py-3 text-inline-start">{t("status")}</th>
                    <th className="px-4 py-3 text-inline-start">{t("date")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {notifications?.map((n, i) => (
                    <NotificationRow key={n.id} n={n} index={i} />
                  ))}
                  {notifications?.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                        {t("noData")}
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
