import { useState } from "react";
import { useListClasses, useGetClassStudents, useCreateAttendanceSession, useRecordAttendance, useLockAttendanceSession, useListAttendanceSessions, getListClassesQueryKey, getGetClassStudentsQueryKey, getListAttendanceSessionsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, XCircle, Clock, FileText, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type AttendanceStatus = "present" | "absent" | "late" | "excused";

const statusConfig: Record<AttendanceStatus, { label: string; icon: typeof CheckCircle2; color: string; bg: string }> = {
  present: { label: "Présent", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50 border-green-300 hover:bg-green-100" },
  absent: { label: "Absent", icon: XCircle, color: "text-red-600", bg: "bg-red-50 border-red-300 hover:bg-red-100" },
  late: { label: "Retard", icon: Clock, color: "text-amber-600", bg: "bg-amber-50 border-amber-300 hover:bg-amber-100" },
  excused: { label: "Excusé", icon: FileText, color: "text-blue-600", bg: "bg-blue-50 border-blue-300 hover:bg-blue-100" },
};

export default function AttendancePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(1);
  const [sessionDate] = useState(new Date().toISOString().split("T")[0]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [statuses, setStatuses] = useState<Record<number, AttendanceStatus>>({});
  const [isLocked, setIsLocked] = useState(false);

  const { data: classes } = useListClasses({ query: { queryKey: getListClassesQueryKey() } });
  const myClasses = classes?.filter(c => c.homeroomTeacherId === user?.id) ?? [];

  const { data: students, isLoading: loadingStudents } = useGetClassStudents(
    selectedClassId ?? 0,
    { query: { enabled: !!selectedClassId, queryKey: getGetClassStudentsQueryKey(selectedClassId ?? 0) } }
  );

  const { data: existingSessions } = useListAttendanceSessions(
    { classId: selectedClassId ?? undefined, sessionDate },
    { query: { enabled: !!selectedClassId, queryKey: getListAttendanceSessionsQueryKey({ classId: selectedClassId ?? undefined, sessionDate }) } }
  );

  const createSession = useCreateAttendanceSession();
  const recordAttendance = useRecordAttendance();
  const lockSession = useLockAttendanceSession();

  const handleStartSession = async () => {
    if (!selectedClassId) return;
    try {
      const session = await createSession.mutateAsync({
        data: { classId: selectedClassId, sessionDate, period: selectedPeriod }
      });
      setActiveSessionId(session.id);
      setIsLocked(false);
      const initial: Record<number, AttendanceStatus> = {};
      students?.forEach(s => { initial[s.id] = "present"; });
      setStatuses(initial);
      toast({ title: "Session démarrée" });
    } catch {
      toast({ title: "Erreur lors de la création de la session", variant: "destructive" });
    }
  };

  const handleSaveAndLock = async () => {
    if (!activeSessionId) return;
    try {
      const records = Object.entries(statuses).map(([sid, status]) => ({
        studentId: Number(sid),
        status,
      }));
      await recordAttendance.mutateAsync({ id: activeSessionId, data: { records } });
      await lockSession.mutateAsync({ id: activeSessionId });
      setIsLocked(true);
      queryClient.invalidateQueries({ queryKey: getListAttendanceSessionsQueryKey({ classId: selectedClassId ?? undefined }) });
      toast({ title: "Session verrouillée et enregistrée" });
    } catch {
      toast({ title: "Erreur lors de l'enregistrement", variant: "destructive" });
    }
  };

  const existingSession = existingSessions?.find(s => s.period === selectedPeriod);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Saisie des présences</h1>
        <p className="text-muted-foreground">Date : {new Date(sessionDate + "T12:00:00").toLocaleDateString("fr-TN", { weekday: "long", day: "numeric", month: "long" })}</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Configuration de la session</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Classe</Label>
            <Select onValueChange={v => { setSelectedClassId(Number(v)); setActiveSessionId(null); setStatuses({}); }}>
              <SelectTrigger data-testid="select-class"><SelectValue placeholder="Choisir une classe" /></SelectTrigger>
              <SelectContent>
                {myClasses.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Période</Label>
            <Select value={String(selectedPeriod)} onValueChange={v => setSelectedPeriod(Number(v))}>
              <SelectTrigger data-testid="select-period"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(p => <SelectItem key={p} value={String(p)}>Période {p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            {existingSession ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="h-4 w-4" />
                Session déjà enregistrée ({existingSession.presentCount} présents)
              </div>
            ) : (
              <Button onClick={handleStartSession} disabled={!selectedClassId || !!activeSessionId || createSession.isPending} className="w-full" data-testid="button-start-session">
                {activeSessionId ? "Session en cours" : "Démarrer la session"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <AnimatePresence>
        {activeSessionId && !isLocked && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Feuille de présence</CardTitle>
                <div className="flex gap-2 text-xs">
                  {(["present", "absent", "late", "excused"] as AttendanceStatus[]).map(s => (
                    <span key={s} className={cn("px-2 py-0.5 rounded border font-medium", statusConfig[s].bg, statusConfig[s].color)}>
                      {Object.values(statuses).filter(v => v === s).length} {statusConfig[s].label}
                    </span>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                {loadingStudents ? (
                  <div className="space-y-2">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
                ) : (
                  <div className="space-y-2">
                    {students?.map((student, i) => (
                      <motion.div key={student.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                        className="flex items-center justify-between py-2.5 px-3 rounded-lg border bg-card" data-testid={`student-row-${student.id}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                            {student.firstName[0]}{student.lastName[0]}
                          </div>
                          <span className="text-sm font-medium">{student.firstName} {student.lastName}</span>
                        </div>
                        <div className="flex gap-1">
                          {(["present", "absent", "late", "excused"] as AttendanceStatus[]).map(s => {
                            const cfg = statusConfig[s];
                            const Icon = cfg.icon;
                            const isActive = statuses[student.id] === s;
                            return (
                              <button key={s} onClick={() => setStatuses(prev => ({ ...prev, [student.id]: s }))}
                                className={cn("flex items-center gap-1 px-2 py-1 rounded border text-xs font-medium transition-all", isActive ? cn(cfg.bg, cfg.color) : "border-transparent text-muted-foreground hover:border-border")}
                                data-testid={`status-${s}-${student.id}`}>
                                <Icon className="h-3 w-3" />
                                <span className="hidden sm:inline">{cfg.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="justify-end gap-2 border-t pt-4">
                <Button onClick={handleSaveAndLock} disabled={lockSession.isPending || recordAttendance.isPending} className="gap-2" data-testid="button-lock-session">
                  <Lock className="h-4 w-4" />
                  {lockSession.isPending ? "Enregistrement..." : "Verrouiller la session"}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}
        {isLocked && (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="border-green-300 bg-green-50">
              <CardContent className="pt-6 text-center">
                <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto mb-2" />
                <p className="font-semibold text-green-800">Session verrouillée avec succès</p>
                <p className="text-sm text-green-700 mt-1">
                  {Object.values(statuses).filter(s => s === "present").length} présents ·{" "}
                  {Object.values(statuses).filter(s => s === "absent").length} absents
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
