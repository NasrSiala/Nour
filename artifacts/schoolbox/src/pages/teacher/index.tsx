import { useListClasses, useListAttendanceSessions, useListRiskAlerts, getListClassesQueryKey, getListAttendanceSessionsQueryKey, getListRiskAlertsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { ArrowRight, ClipboardCheck } from "lucide-react";
import { motion } from "framer-motion";

const DARK = "#0B2819";

const tierMeta: Record<string, { dot: string; border: string; label: string }> = {
  low:      { dot: "#10b981", border: "#d1fae5", label: "Low"      },
  medium:   { dot: "#f59e0b", border: "#fde68a", label: "Medium"   },
  high:     { dot: "#f97316", border: "#fed7aa", label: "High"     },
  critical: { dot: "#ef4444", border: "#fecaca", label: "Critical" },
};

function greet(name: string) {
  const h = new Date().getHours();
  if (h < 12) return `Good morning, ${name.split(" ")[0]}.`;
  if (h < 18) return `Good afternoon, ${name.split(" ")[0]}.`;
  return `Good evening, ${name.split(" ")[0]}.`;
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const today = new Date().toISOString().split("T")[0];
  const todayLabel = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  const { data: classes, isLoading: lc } = useListClasses({ query: { queryKey: getListClassesQueryKey() } });
  const { data: todaySessions, isLoading: ls } = useListAttendanceSessions(
    { sessionDate: today },
    { query: { queryKey: getListAttendanceSessionsQueryKey({ sessionDate: today }) } }
  );
  const { data: alerts, isLoading: la } = useListRiskAlerts(
    { acknowledged: false },
    { query: { queryKey: getListRiskAlertsQueryKey({ acknowledged: false }) } }
  );

  const myClasses = classes?.filter(c => c.homeroomTeacherId === user?.id) ?? [];
  const allAlerts = classes ? (alerts ?? []) : [];
  const unread = allAlerts.slice(0, 8);
  const criticalCount = unread.filter(a => a.tier === "critical" || a.tier === "high").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", paddingBottom: "40px" }}>

      {/* ── Page header ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}
      >
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-0.02em", color: "#111827", fontFamily: "'Sora', sans-serif", lineHeight: 1.1 }}>
            {user?.fullName ? greet(user.fullName) : "Welcome back."}
          </h1>
          <p style={{ fontSize: "13px", color: "#9ca3af", marginTop: "5px" }}>{todayLabel}</p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {[
            { label: "Take attendance", href: "/teacher/attendance" },
            { label: "View risk alerts", href: "/teacher/risk" },
            { label: "Manage content", href: "/teacher/content" },
          ].map(a => (
            <Link key={a.href} href={a.href}>
              <button
                style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "6px 12px", borderRadius: "20px", border: "1px solid #e5e7eb", background: "white", fontSize: "12px", fontWeight: 600, color: "#374151", cursor: "pointer", transition: "all 0.12s", whiteSpace: "nowrap" }}
                onMouseEnter={e => { const b = e.currentTarget; b.style.borderColor = DARK; b.style.backgroundColor = DARK; b.style.color = "white"; }}
                onMouseLeave={e => { const b = e.currentTarget; b.style.borderColor = "#e5e7eb"; b.style.backgroundColor = "white"; b.style.color = "#374151"; }}
              >
                {a.label}
              </button>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* ── Stats billboard ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", borderRadius: "16px", overflow: "hidden", border: "1px solid #e5e7eb" }}
      >
        {/* Featured — My Classes */}
        <div style={{ backgroundColor: DARK, padding: "28px 28px 24px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "20px 20px", pointerEvents: "none" }} />
          <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", color: "#4d7a62", textTransform: "uppercase", position: "relative" }}>My Classes</p>
          <p style={{ fontSize: "56px", fontWeight: 800, color: "white", fontFamily: "'Sora', sans-serif", lineHeight: 1, marginTop: "8px", position: "relative", letterSpacing: "-0.04em" }}>
            {lc ? "—" : myClasses.length}
          </p>
          <p style={{ fontSize: "12px", color: "#4d7a62", marginTop: "10px", position: "relative" }}>
            {myClasses.length === 1 ? "1 class assigned to you" : `${myClasses.length} classes assigned to you`}
          </p>
          <Link href="/teacher/classes">
            <button
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginTop: "16px", fontSize: "12px", fontWeight: 600, color: "#4ade80", background: "none", border: "none", cursor: "pointer", padding: 0, position: "relative" }}
            >
              View classes <ArrowRight style={{ width: "11px", height: "11px" }} />
            </button>
          </Link>
        </div>
        {/* Today's Sessions */}
        <div style={{ padding: "28px 22px 24px", backgroundColor: "white", borderLeft: "1px solid #f3f4f6" }}>
          <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", color: "#9ca3af", textTransform: "uppercase" }}>Today's Sessions</p>
          <p style={{ fontSize: "48px", fontWeight: 800, color: "#111827", fontFamily: "'Sora', sans-serif", lineHeight: 1, marginTop: "10px", letterSpacing: "-0.04em" }}>
            {ls ? "—" : todaySessions?.length ?? 0}
          </p>
          <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "10px" }}>Attendance sessions logged</p>
        </div>
        {/* Risk Alerts */}
        <div style={{ padding: "28px 22px 24px", backgroundColor: criticalCount > 0 ? "#fff8f7" : "white", borderLeft: "1px solid #f3f4f6" }}>
          <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", color: criticalCount > 0 ? "#ef4444" : "#9ca3af", textTransform: "uppercase" }}>
            Risk Alerts
          </p>
          <p style={{ fontSize: "48px", fontWeight: 800, color: criticalCount > 0 ? "#ef4444" : "#111827", fontFamily: "'Sora', sans-serif", lineHeight: 1, marginTop: "10px", letterSpacing: "-0.04em" }}>
            {la ? "—" : unread.length}
          </p>
          <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "10px" }}>
            {criticalCount > 0 ? `${criticalCount} high-priority` : "Pending review"}
          </p>
        </div>
      </motion.div>

      {/* ── Main grid: classes + alerts ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "16px" }}>

        {/* My Classes — schedule style */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ backgroundColor: "white", borderRadius: "16px", border: "1px solid #e5e7eb", overflow: "hidden" }}
        >
          <div style={{ padding: "20px 22px 16px", borderBottom: "1px solid #f9fafb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "#111827", fontFamily: "'Sora', sans-serif" }}>My Classes</p>
            <Link href="/teacher/classes">
              <button style={{ fontSize: "11px", fontWeight: 600, color: "#9ca3af", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                onMouseEnter={e => (e.currentTarget.style.color = DARK)}
                onMouseLeave={e => (e.currentTarget.style.color = "#9ca3af")}
              >
                All classes <ArrowRight style={{ width: "10px", height: "10px" }} />
              </button>
            </Link>
          </div>
          <div>
            {lc ? (
              <div style={{ padding: "16px" }}>
                {[1,2,3].map(i => <Skeleton key={i} className="h-14 rounded-lg mb-2" />)}
              </div>
            ) : myClasses.length === 0 ? (
              <div style={{ padding: "40px 22px", textAlign: "center", color: "#d1d5db", fontSize: "13px" }}>
                No classes assigned yet
              </div>
            ) : (
              myClasses.map((cls, i) => (
                <motion.div
                  key={cls.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.05 }}
                >
                  <Link href={`/teacher/attendance?classId=${cls.id}`}>
                    <div
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 22px", borderBottom: "1px solid #f9fafb", cursor: "pointer", transition: "background 0.12s" }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#f9fafb")}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                      data-testid={`class-card-${cls.id}`}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: DARK, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, color: "#a7f3d0", flexShrink: 0, fontFamily: "'Sora', sans-serif" }}>
                          {cls.gradeLevel}
                        </div>
                        <div>
                          <p style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>{cls.name}</p>
                          <p style={{ fontSize: "11px", color: "#9ca3af", marginTop: "1px" }}>
                            {cls.studentCount} students · Grade {cls.gradeLevel} · {cls.academicYear}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <ClipboardCheck style={{ width: "13px", height: "13px", color: "#9ca3af" }} />
                        <span style={{ fontSize: "11px", fontWeight: 600, color: "#9ca3af" }}>Attendance</span>
                        <ArrowRight style={{ width: "11px", height: "11px", color: "#d1d5db" }} />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Risk Alerts — feed style */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          style={{ backgroundColor: "white", borderRadius: "16px", border: "1px solid #e5e7eb", overflow: "hidden" }}
        >
          <div style={{ padding: "20px 22px 16px", borderBottom: "1px solid #f9fafb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <p style={{ fontSize: "14px", fontWeight: 700, color: "#111827", fontFamily: "'Sora', sans-serif" }}>Risk Alerts</p>
              {unread.length > 0 && (
                <span style={{ fontSize: "10px", fontWeight: 700, color: "#ef4444", backgroundColor: "#fef2f2", padding: "2px 7px", borderRadius: "20px" }}>
                  {unread.length} pending
                </span>
              )}
            </div>
            <Link href="/teacher/risk">
              <button style={{ fontSize: "11px", fontWeight: 600, color: "#9ca3af", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                onMouseEnter={e => (e.currentTarget.style.color = DARK)}
                onMouseLeave={e => (e.currentTarget.style.color = "#9ca3af")}
              >
                View all <ArrowRight style={{ width: "10px", height: "10px" }} />
              </button>
            </Link>
          </div>
          <div>
            {la ? (
              <div style={{ padding: "16px" }}>
                {[1,2,3].map(i => <Skeleton key={i} className="h-14 rounded-lg mb-2" />)}
              </div>
            ) : unread.length === 0 ? (
              <div style={{ padding: "40px 22px", textAlign: "center" }}>
                <p style={{ fontSize: "22px", fontWeight: 800, color: "#10b981", fontFamily: "'Sora', sans-serif" }}>0</p>
                <p style={{ fontSize: "12px", color: "#d1d5db", marginTop: "6px" }}>No pending alerts</p>
              </div>
            ) : (
              unread.map((alert, i) => {
                const tm = tierMeta[alert.tier ?? "medium"] ?? tierMeta.medium;
                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.18 + i * 0.04 }}
                    data-testid={`alert-card-${alert.id}`}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 22px 12px 18px", borderBottom: "1px solid #f9fafb", borderLeft: `3px solid ${tm.dot}`, transition: "background 0.12s" }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#fafafa")}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <div>
                        <p style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>{alert.studentName}</p>
                        <p style={{ fontSize: "11px", color: "#9ca3af", marginTop: "1px" }}>{alert.className}</p>
                      </div>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "10px", fontWeight: 700, color: tm.dot, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: tm.dot, display: "inline-block" }} />
                        {tm.label}
                      </span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
