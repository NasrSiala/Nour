import { useState } from "react";
import {
  useListClasses, useGetClassStudents, useCreateAttendanceSession,
  useRecordAttendance, useLockAttendanceSession, useListAttendanceSessions,
  getListClassesQueryKey, getGetClassStudentsQueryKey, getListAttendanceSessionsQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Lock, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const DARK = "#0B2819";

type AttendanceStatus = "present" | "absent" | "late" | "excused";
type Phase = "setup" | "recording" | "reviewing" | "locked";

const STATUS: Record<AttendanceStatus, { label: string; activeColor: string; activeBg: string; activeBorder: string }> = {
  present: { label: "Present",  activeColor: "#10b981", activeBg: "#f0fdf4", activeBorder: "#10b981" },
  absent:  { label: "Absent",   activeColor: "#ef4444", activeBg: "#fef2f2", activeBorder: "#ef4444" },
  late:    { label: "Late",     activeColor: "#f59e0b", activeBg: "#fffbeb", activeBorder: "#f59e0b" },
  excused: { label: "Excused",  activeColor: "#3b82f6", activeBg: "#eff6ff", activeBorder: "#3b82f6" },
};

const STATUS_ORDER: AttendanceStatus[] = ["present", "absent", "late", "excused"];

function count(statuses: Record<number, AttendanceStatus>, s: AttendanceStatus) {
  return Object.values(statuses).filter(v => v === s).length;
}

function Pill({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ fontSize: "11px", fontWeight: 600, padding: "5px 11px", borderRadius: "20px", border: "1px solid #e5e7eb", backgroundColor: "white", color: "#374151", cursor: "pointer", transition: "all 0.12s" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = DARK; e.currentTarget.style.backgroundColor = DARK; e.currentTarget.style.color = "white"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.backgroundColor = "white"; e.currentTarget.style.color = "#374151"; }}
    >
      {label}
    </button>
  );
}

export default function AttendancePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<Phase>("setup");
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(1);
  const [sessionDate] = useState(new Date().toISOString().split("T")[0]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [statuses, setStatuses] = useState<Record<number, AttendanceStatus>>({});

  const { data: classes } = useListClasses({ query: { queryKey: getListClassesQueryKey() } });
  const myClasses = classes?.filter(c => c.homeroomTeacherId === user?.id) ?? [];
  const selectedClass = myClasses.find(c => c.id === selectedClassId);

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

  const existingSession = existingSessions?.find(s => s.period === selectedPeriod);
  const todaySessionCount = existingSessions?.length ?? 0;
  const dateLabel = new Date(sessionDate + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  const handleStartSession = async () => {
    if (!selectedClassId) return;
    try {
      const session = await createSession.mutateAsync({ data: { classId: selectedClassId, sessionDate, period: selectedPeriod } });
      setActiveSessionId(session.id);
      const initial: Record<number, AttendanceStatus> = {};
      students?.forEach(s => { initial[s.id] = "present"; });
      setStatuses(initial);
      setPhase("recording");
    } catch {
      toast({ title: "Could not start session", variant: "destructive" });
    }
  };

  const handleConfirmLock = async () => {
    if (!activeSessionId) return;
    try {
      const records = Object.entries(statuses).map(([sid, status]) => ({ studentId: Number(sid), status }));
      await recordAttendance.mutateAsync({ id: activeSessionId, data: { records } });
      await lockSession.mutateAsync({ id: activeSessionId });
      queryClient.invalidateQueries({ queryKey: getListAttendanceSessionsQueryKey({ classId: selectedClassId ?? undefined }) });
      setPhase("locked");
    } catch {
      toast({ title: "Could not save session", variant: "destructive" });
    }
  };

  const markAll = (s: AttendanceStatus) => {
    const updated: Record<number, AttendanceStatus> = {};
    students?.forEach(st => { updated[st.id] = s; });
    setStatuses(updated);
  };

  const setStatus = (studentId: number, s: AttendanceStatus) =>
    setStatuses(prev => ({ ...prev, [studentId]: s }));

  const presentCount  = count(statuses, "present");
  const absentCount   = count(statuses, "absent");
  const lateCount     = count(statuses, "late");
  const excusedCount  = count(statuses, "excused");
  const nonPresent    = students?.filter(s => statuses[s.id] && statuses[s.id] !== "present") ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", paddingBottom: "40px" }}>

      {/* ── Page header ── */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-0.02em", color: "#111827", fontFamily: "'Sora', sans-serif", lineHeight: 1.1 }}>
            Attendance
          </h1>
          <p style={{ fontSize: "13px", color: "#9ca3af", marginTop: "5px" }}>
            {dateLabel}
            {todaySessionCount > 0 && (
              <span style={{ marginLeft: "10px", fontSize: "11px", fontWeight: 600, color: "#4d7a62", backgroundColor: "#f0fdf4", padding: "2px 8px", borderRadius: "20px" }}>
                {todaySessionCount} session{todaySessionCount > 1 ? "s" : ""} logged today
              </span>
            )}
          </p>
        </div>
      </div>

      {/* ── Session setup bar ── */}
      <div style={{ backgroundColor: "white", borderRadius: "14px", border: "1px solid #e5e7eb", padding: "18px 22px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "5px", minWidth: "160px", flex: 1 }}>
          <label style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", color: "#9ca3af", textTransform: "uppercase" }}>Class</label>
          <Select
            disabled={phase === "recording" || phase === "reviewing"}
            onValueChange={v => { setSelectedClassId(Number(v)); setActiveSessionId(null); setStatuses({}); setPhase("setup"); }}
          >
            <SelectTrigger data-testid="select-class" style={{ height: "36px", fontSize: "13px", fontWeight: 600 }}>
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {myClasses.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "120px" }}>
          <label style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", color: "#9ca3af", textTransform: "uppercase" }}>Period</label>
          <Select
            disabled={phase === "recording" || phase === "reviewing"}
            value={String(selectedPeriod)}
            onValueChange={v => setSelectedPeriod(Number(v))}
          >
            <SelectTrigger data-testid="select-period" style={{ height: "36px", fontSize: "13px", fontWeight: 600 }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1,2,3,4,5,6,7,8].map(p => <SelectItem key={p} value={String(p)}>Period {p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Divider */}
        <div style={{ width: "1px", height: "36px", backgroundColor: "#f3f4f6", flexShrink: 0 }} />

        {/* Action area */}
        {phase === "setup" && (
          existingSession ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#9ca3af", fontWeight: 500 }}>
              <Lock style={{ width: "13px", height: "13px", color: "#10b981" }} />
              <span style={{ color: "#374151", fontWeight: 600 }}>Already recorded</span>
              <span>— {existingSession.presentCount} present</span>
            </div>
          ) : (
            <button
              onClick={handleStartSession}
              disabled={!selectedClassId || createSession.isPending}
              data-testid="button-start-session"
              style={{
                display: "inline-flex", alignItems: "center", gap: "7px",
                padding: "9px 18px", borderRadius: "8px",
                backgroundColor: selectedClassId ? DARK : "#f3f4f6",
                color: selectedClassId ? "white" : "#9ca3af",
                border: "none", fontSize: "13px", fontWeight: 700,
                cursor: selectedClassId ? "pointer" : "not-allowed",
                transition: "all 0.12s", fontFamily: "'Sora', sans-serif",
              }}
            >
              {createSession.isPending ? "Starting…" : "Start session"}
              <ArrowRight style={{ width: "13px", height: "13px" }} />
            </button>
          )
        )}

        {(phase === "recording") && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em" }}>Mark all:</span>
            {STATUS_ORDER.map(s => (
              <Pill key={s} label={STATUS[s].label} onClick={() => markAll(s)} />
            ))}
          </div>
        )}

        {phase === "reviewing" && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#9ca3af" }}>
            <span style={{ fontWeight: 600, color: "#374151" }}>Review before locking</span>
          </div>
        )}
      </div>

      {/* ── Roster ── */}
      <AnimatePresence mode="wait">
        {phase === "recording" && (
          <motion.div
            key="roster"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ backgroundColor: "white", borderRadius: "16px", border: "1px solid #e5e7eb", overflow: "hidden" }}
          >
            {/* Roster header */}
            <div style={{ padding: "18px 22px 16px", borderBottom: "1px solid #f9fafb", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
              <div>
                <p style={{ fontSize: "14px", fontWeight: 700, color: "#111827", fontFamily: "'Sora', sans-serif" }}>
                  Period {selectedPeriod} — {selectedClass?.name}
                </p>
                <p style={{ fontSize: "11px", color: "#9ca3af", marginTop: "3px" }}>
                  {students?.length ?? 0} students on roster
                </p>
              </div>
              {/* Live count chips */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                {STATUS_ORDER.map(s => {
                  const n = count(statuses, s);
                  if (n === 0 && s !== "present") return null;
                  return (
                    <span key={s} style={{ fontSize: "11px", fontWeight: 700, color: STATUS[s].activeColor, backgroundColor: STATUS[s].activeBg, border: `1px solid ${STATUS[s].activeBorder}`, padding: "3px 9px", borderRadius: "20px" }}>
                      {n} {STATUS[s].label}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Student rows */}
            {loadingStudents ? (
              <div style={{ padding: "16px" }}>
                {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 rounded-lg mb-2" />)}
              </div>
            ) : (
              <div>
                {students?.map((student, i) => {
                  const currentStatus = statuses[student.id] ?? "present";
                  return (
                    <motion.div
                      key={student.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.018 }}
                      data-testid={`student-row-${student.id}`}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 22px", borderBottom: i < (students.length - 1) ? "1px solid #f9fafb" : "none", transition: "background 0.1s" }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#fafafa")}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      {/* Left: number + avatar + name */}
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontSize: "11px", fontFamily: "monospace", color: "#d1d5db", width: "18px", textAlign: "right", flexShrink: 0 }}>{i + 1}</span>
                        <div style={{ width: "30px", height: "30px", borderRadius: "50%", backgroundColor: DARK, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800, color: "#a7f3d0", flexShrink: 0, fontFamily: "'Sora', sans-serif" }}>
                          {student.firstName[0]}{student.lastName[0]}
                        </div>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>
                          {student.firstName} {student.lastName}
                        </span>
                      </div>

                      {/* Right: status pills */}
                      <div style={{ display: "flex", gap: "5px", flexShrink: 0 }}>
                        {STATUS_ORDER.map(s => {
                          const cfg = STATUS[s];
                          const active = currentStatus === s;
                          return (
                            <button
                              key={s}
                              data-testid={`status-${s}-${student.id}`}
                              onClick={() => setStatus(student.id, s)}
                              style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                padding: "5px 11px",
                                borderRadius: "20px",
                                border: active ? `1.5px solid ${cfg.activeBorder}` : "1.5px solid #f0f0f0",
                                backgroundColor: active ? cfg.activeBg : "transparent",
                                color: active ? cfg.activeColor : "#d1d5db",
                                cursor: "pointer",
                                transition: "all 0.1s",
                                letterSpacing: "0.02em",
                              }}
                            >
                              {cfg.label}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Roster footer */}
            <div style={{ padding: "16px 22px", borderTop: "1px solid #f9fafb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ fontSize: "11px", color: "#d1d5db" }}>
                All students default to <strong style={{ color: "#10b981" }}>Present</strong> — adjust as needed
              </p>
              <button
                onClick={() => setPhase("reviewing")}
                style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "9px 18px", borderRadius: "8px", backgroundColor: DARK, color: "white", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "'Sora', sans-serif" }}
              >
                Review & save <ArrowRight style={{ width: "13px", height: "13px" }} />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Review confirmation panel ── */}
        {phase === "reviewing" && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {/* Summary billboard */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", borderRadius: "16px", overflow: "hidden", border: "1px solid #e5e7eb", marginBottom: "16px" }}>
              {STATUS_ORDER.map((s, i) => {
                const n = count(statuses, s);
                const cfg = STATUS[s];
                const featured = s === "present";
                return (
                  <div
                    key={s}
                    style={{
                      padding: "24px 20px 20px",
                      backgroundColor: featured ? DARK : "white",
                      borderLeft: i > 0 ? "1px solid #f3f4f6" : "none",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {featured && (
                      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "18px 18px", pointerEvents: "none" }} />
                    )}
                    <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: featured ? "#4d7a62" : "#9ca3af", position: "relative" }}>
                      {cfg.label}
                    </p>
                    <p style={{ fontSize: "42px", fontWeight: 800, fontFamily: "'Sora', sans-serif", lineHeight: 1, marginTop: "8px", letterSpacing: "-0.03em", color: featured ? "white" : cfg.activeColor, position: "relative" }}>
                      {n}
                    </p>
                    <p style={{ fontSize: "11px", color: featured ? "#4d7a62" : "#d1d5db", marginTop: "8px", position: "relative" }}>
                      {n === 1 ? "student" : "students"}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Non-present students list */}
            {nonPresent.length > 0 && (
              <div style={{ backgroundColor: "white", borderRadius: "16px", border: "1px solid #e5e7eb", overflow: "hidden", marginBottom: "16px" }}>
                <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid #f9fafb" }}>
                  <p style={{ fontSize: "14px", fontWeight: 700, color: "#111827", fontFamily: "'Sora', sans-serif" }}>
                    Students not marked present
                  </p>
                  <p style={{ fontSize: "11px", color: "#9ca3af", marginTop: "3px" }}>
                    These {nonPresent.length} student{nonPresent.length > 1 ? "s" : ""} will be flagged in the record
                  </p>
                </div>
                {nonPresent.map((student, i) => {
                  const s = statuses[student.id];
                  const cfg = STATUS[s];
                  return (
                    <div
                      key={student.id}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 22px", borderBottom: i < nonPresent.length - 1 ? "1px solid #f9fafb" : "none" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: DARK, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800, color: "#a7f3d0", flexShrink: 0, fontFamily: "'Sora', sans-serif" }}>
                          {student.firstName[0]}{student.lastName[0]}
                        </div>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>
                          {student.firstName} {student.lastName}
                        </span>
                      </div>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: cfg.activeColor, backgroundColor: cfg.activeBg, border: `1px solid ${cfg.activeBorder}`, padding: "3px 9px", borderRadius: "20px" }}>
                        {cfg.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Confirm/back bar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "white", borderRadius: "14px", border: "1px solid #e5e7eb", padding: "16px 22px" }}>
              <button
                onClick={() => setPhase("recording")}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: "#6b7280", backgroundColor: "transparent", border: "1px solid #e5e7eb", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", transition: "all 0.12s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#374151"; e.currentTarget.style.color = "#374151"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.color = "#6b7280"; }}
              >
                <ArrowLeft style={{ width: "13px", height: "13px" }} />
                Back to roster
              </button>
              <button
                onClick={handleConfirmLock}
                disabled={lockSession.isPending || recordAttendance.isPending}
                data-testid="button-lock-session"
                style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "9px 20px", borderRadius: "8px", backgroundColor: DARK, color: "white", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "'Sora', sans-serif", opacity: lockSession.isPending ? 0.6 : 1 }}
              >
                <Lock style={{ width: "13px", height: "13px" }} />
                {lockSession.isPending ? "Saving…" : "Confirm & lock session"}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Locked success ── */}
        {phase === "locked" && (
          <motion.div
            key="locked"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ backgroundColor: "white", borderRadius: "16px", border: "1px solid #e5e7eb", padding: "56px 32px", textAlign: "center" }}
          >
            <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "#f0fdf4", border: "2px solid #10b981", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <CheckCircle2 style={{ width: "26px", height: "26px", color: "#10b981" }} />
            </div>
            <p style={{ fontSize: "20px", fontWeight: 800, color: "#111827", fontFamily: "'Sora', sans-serif", letterSpacing: "-0.02em" }}>
              Session locked
            </p>
            <p style={{ fontSize: "13px", color: "#9ca3af", marginTop: "8px" }}>
              Period {selectedPeriod} · {selectedClass?.name}
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "20px", flexWrap: "wrap" }}>
              {STATUS_ORDER.map(s => {
                const n = count(statuses, s);
                if (n === 0) return null;
                const cfg = STATUS[s];
                return (
                  <span key={s} style={{ fontSize: "12px", fontWeight: 700, color: cfg.activeColor, backgroundColor: cfg.activeBg, border: `1px solid ${cfg.activeBorder}`, padding: "4px 12px", borderRadius: "20px" }}>
                    {n} {cfg.label}
                  </span>
                );
              })}
            </div>
            <button
              onClick={() => { setPhase("setup"); setActiveSessionId(null); setStatuses({}); }}
              style={{ marginTop: "28px", display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: "#6b7280", backgroundColor: "transparent", border: "1px solid #e5e7eb", padding: "8px 18px", borderRadius: "8px", cursor: "pointer" }}
            >
              Take another session
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
