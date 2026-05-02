import { useState } from "react";
import { useGetSchoolKpis, useGetAttendanceTrend, useGetRiskByClass, useGetTopAtRiskStudents } from "@workspace/api-client-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Users, ArrowRight, GraduationCap, BookOpen, ShieldCheck, Bell, ArrowUpRight, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const DARK = "#0B2819";

const tierMeta: Record<string, { dot: string; label: string; rowBg: string }> = {
  critical: { dot: "#ef4444", label: "Critical",  rowBg: "#fef2f2" },
  high:     { dot: "#f97316", label: "High",      rowBg: "#fff7ed" },
  medium:   { dot: "#f59e0b", label: "Medium",    rowBg: "#fffbeb" },
  low:      { dot: "#10b981", label: "Low",       rowBg: "transparent" },
};

const quickActions = [
  { label: "New class",         href: "/admin/classes",       icon: GraduationCap },
  { label: "New subject",       href: "/admin/subjects",      icon: BookOpen },
  { label: "New user",          href: "/admin/users",         icon: ShieldCheck },
  { label: "Send notification", href: "/admin/notifications", icon: Bell },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: "#9ca3af", textTransform: "uppercase", marginBottom: "14px" }}>
      {children}
    </p>
  );
}

export default function AdminDashboard() {
  const { data: kpis, isLoading: lk } = useGetSchoolKpis();
  const { data: trend, isLoading: lt } = useGetAttendanceTrend({ weeks: 12 });
  const { data: riskByClass, isLoading: lr } = useGetRiskByClass();
  const { data: topAtRisk, isLoading: ltr } = useGetTopAtRiskStudents({ limit: 10 });
  const loading = lk || lt || lr || ltr;
  const [refreshingRisk, setRefreshingRisk] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleRefreshRisk = async () => {
    setRefreshingRisk(true);
    try {
      const token = localStorage.getItem("schoolbox_token");
      const res = await fetch(`${BASE}/api/risk/run-now`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json() as { studentsScored: number; alertsCreated: number };
      queryClient.invalidateQueries();
      toast({ title: "Scan de risque terminé", description: `${data.studentsScored} élèves analysés · ${data.alertsCreated} alertes créées` });
    } catch {
      toast({ title: "Erreur lors du scan", variant: "destructive" });
    } finally {
      setRefreshingRisk(false);
    }
  };

  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <Skeleton className="h-8 w-52 rounded-lg" />
        <Skeleton className="h-36 rounded-2xl" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  const d = kpis as Record<string, number> | undefined;
  const attendance = d?.attendanceRate30d ?? 0;
  const atRisk = d?.studentsAtRiskCount ?? 0;
  const atRiskPct = d?.studentsAtRiskPct ?? 0;
  const engagement = d?.contentEngagement7d ?? 0;
  const notifications = d?.notificationsSent30d ?? 0;

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
            School Overview
          </h1>
          <p style={{ fontSize: "13px", color: "#9ca3af", marginTop: "5px" }}>{today}</p>
        </div>

        {/* Quick-action pill row */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          {quickActions.map((a) => (
            <Link key={a.href} href={a.href}>
              <button
                style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  padding: "6px 12px", borderRadius: "20px",
                  border: "1px solid #e5e7eb", background: "white",
                  fontSize: "12px", fontWeight: 600, color: "#374151",
                  cursor: "pointer", transition: "all 0.12s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={e => {
                  const b = e.currentTarget;
                  b.style.borderColor = DARK;
                  b.style.backgroundColor = DARK;
                  b.style.color = "white";
                }}
                onMouseLeave={e => {
                  const b = e.currentTarget;
                  b.style.borderColor = "#e5e7eb";
                  b.style.backgroundColor = "white";
                  b.style.color = "#374151";
                }}
              >
                <a.icon style={{ width: "11px", height: "11px" }} />
                {a.label}
              </button>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* ── KPI Billboard ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
          borderRadius: "16px",
          overflow: "hidden",
          border: "1px solid #e5e7eb",
        }}
      >
        {/* Featured metric — dark */}
        <div style={{ backgroundColor: DARK, padding: "28px 28px 24px", position: "relative", overflow: "hidden" }}>
          {/* Dot texture */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "20px 20px", pointerEvents: "none" }} />
          <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", color: "#4d7a62", textTransform: "uppercase", position: "relative" }}>
            Attendance Rate
          </p>
          <p style={{ fontSize: "52px", fontWeight: 800, color: "white", fontFamily: "'Sora', sans-serif", lineHeight: 1, marginTop: "8px", position: "relative", letterSpacing: "-0.03em" }}>
            {attendance.toFixed(1)}<span style={{ fontSize: "28px", color: "#4ade80", marginLeft: "2px" }}>%</span>
          </p>
          <p style={{ fontSize: "12px", color: "#4d7a62", marginTop: "10px", position: "relative" }}>
            30-day moving average
          </p>
          <div style={{ position: "relative", marginTop: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "#4ade80", backgroundColor: "rgba(74,222,128,0.1)", padding: "3px 8px", borderRadius: "20px" }}>
              <ArrowUpRight style={{ width: "10px", height: "10px" }} />
              On track
            </span>
          </div>
        </div>

        {/* Supporting metrics */}
        {[
          { label: "Students at Risk", value: String(atRisk), sub: `${atRiskPct.toFixed(1)}% of enrolment`, alert: atRisk > 10 },
          { label: "Engagement (7d)", value: String(engagement), sub: "Content interactions", alert: false },
          { label: "Notifications", value: String(notifications), sub: "Sent this month", alert: false },
        ].map((m, i) => (
          <div
            key={m.label}
            style={{
              padding: "28px 22px 24px",
              backgroundColor: "white",
              borderLeft: "1px solid #f3f4f6",
            }}
          >
            <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", color: m.alert ? "#ef4444" : "#9ca3af", textTransform: "uppercase" }}>
              {m.label}
            </p>
            <p style={{
              fontSize: i === 0 ? "44px" : "40px",
              fontWeight: 800,
              color: m.alert ? "#ef4444" : "#111827",
              fontFamily: "'Sora', sans-serif",
              lineHeight: 1,
              marginTop: "10px",
              letterSpacing: "-0.03em",
            }}>
              {m.value}
            </p>
            <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "10px" }}>{m.sub}</p>
          </div>
        ))}
      </motion.div>

      {/* ── Charts ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

        {/* Attendance trend */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          style={{ backgroundColor: "white", borderRadius: "16px", border: "1px solid #e5e7eb", overflow: "hidden" }}
        >
          <div style={{ padding: "22px 24px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: "14px", fontWeight: 700, color: "#111827", fontFamily: "'Sora', sans-serif" }}>Attendance Trend</p>
              <p style={{ fontSize: "11px", color: "#9ca3af", marginTop: "3px" }}>12-week rolling — % present per week</p>
            </div>
            <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", color: "#4d7a62", backgroundColor: "#f0fdf4", padding: "4px 9px", borderRadius: "20px", textTransform: "uppercase" }}>
              Weekly
            </span>
          </div>
          <div style={{ padding: "8px 8px 16px" }}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trend} margin={{ top: 10, right: 12, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="weekLabel" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#d1d5db" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#d1d5db" }} domain={[50, 100]} />
                <Tooltip
                  contentStyle={{ borderRadius: "10px", border: "1px solid #f3f4f6", boxShadow: "0 8px 24px rgba(0,0,0,0.08)", fontSize: "12px", fontFamily: "'Inter', sans-serif" }}
                  formatter={(v: number) => [`${v}%`, "Attendance"]}
                />
                <Line
                  type="monotone" dataKey="rate" stroke="#0B2819" strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "#0B2819", strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Risk by class */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.17 }}
          style={{ backgroundColor: "white", borderRadius: "16px", border: "1px solid #e5e7eb", overflow: "hidden" }}
        >
          <div style={{ padding: "22px 24px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: "14px", fontWeight: 700, color: "#111827", fontFamily: "'Sora', sans-serif" }}>Dropout Risk by Class</p>
              <p style={{ fontSize: "11px", color: "#9ca3af", marginTop: "3px" }}>Stacked by risk tier — low to critical</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {[["#10b981", "Low"], ["#f59e0b", "Med"], ["#ef4444", "Crit"]].map(([color, label]) => (
                <span key={label} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", color: "#9ca3af", fontWeight: 600 }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: color, display: "inline-block" }} />
                  {label}
                </span>
              ))}
            </div>
          </div>
          <div style={{ padding: "8px 8px 16px" }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={riskByClass} layout="vertical" margin={{ top: 10, right: 12, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" horizontal={false} stroke="#f3f4f6" />
                <XAxis type="number" hide />
                <YAxis dataKey="className" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#d1d5db" }} width={62} />
                <Tooltip
                  contentStyle={{ borderRadius: "10px", border: "1px solid #f3f4f6", boxShadow: "0 8px 24px rgba(0,0,0,0.08)", fontSize: "12px" }}
                />
                <Bar dataKey="riskCounts.low" name="Low" stackId="a" fill="#10b981" />
                <Bar dataKey="riskCounts.medium" name="Medium" stackId="a" fill="#f59e0b" />
                <Bar dataKey="riskCounts.high" name="High" stackId="a" fill="#f97316" />
                <Bar dataKey="riskCounts.critical" name="Critical" stackId="a" fill="#ef4444" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* ── At-risk briefing table ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
        style={{ backgroundColor: "white", borderRadius: "16px", border: "1px solid #e5e7eb", overflow: "hidden" }}
      >
        {/* Table header — editorial */}
        <div style={{ padding: "22px 24px 18px", borderBottom: "1px solid #f9fafb", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
            <span style={{ fontSize: "28px", fontWeight: 800, color: "#ef4444", fontFamily: "'Sora', sans-serif", lineHeight: 1, letterSpacing: "-0.03em" }}>
              {topAtRisk?.filter(s => (s.tier ?? "low") !== "low").length ?? 0}
            </span>
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#111827", fontFamily: "'Sora', sans-serif" }}>
              students flagged for dropout risk
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={handleRefreshRisk}
              disabled={refreshingRisk}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 600, color: refreshingRisk ? "#9ca3af" : "#6b7280", background: "none", border: "1px solid #e5e7eb", padding: "6px 12px", borderRadius: "8px", cursor: refreshingRisk ? "not-allowed" : "pointer", transition: "all 0.12s" }}
              onMouseEnter={e => { if (!refreshingRisk) { e.currentTarget.style.borderColor = "#10b981"; e.currentTarget.style.color = "#10b981"; }}}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.color = "#6b7280"; }}
            >
              <RefreshCw style={{ width: "11px", height: "11px", animation: refreshingRisk ? "spin 1s linear infinite" : "none" }} />
              {refreshingRisk ? "Scan en cours…" : "Actualiser scores"}
            </button>
            <Link href="/admin/analytics">
              <button
                style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 600, color: "#6b7280", background: "none", border: "1px solid #e5e7eb", padding: "6px 12px", borderRadius: "8px", cursor: "pointer", transition: "all 0.12s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = DARK; e.currentTarget.style.color = DARK; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.color = "#6b7280"; }}
              >
                Full analytics <ArrowRight style={{ width: "11px", height: "11px" }} />
              </button>
            </Link>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                {["#", "Student", "Class", "Risk score", "Tier", "Key factor"].map(h => (
                  <th key={h} style={{ padding: "10px 20px", textAlign: "left", fontSize: "10px", fontWeight: 700, color: "#d1d5db", letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topAtRisk?.map((student, idx) => {
                const tier = student.tier ?? "low";
                const tm = tierMeta[tier] ?? tierMeta.low;
                const score = Math.round(student.score * 100);
                const initial = student.studentName?.charAt(0) ?? "?";
                return (
                  <tr
                    key={student.studentId}
                    style={{ borderBottom: "1px solid #f9fafb", backgroundColor: idx % 2 === 0 ? "white" : "#fafafa", transition: "background 0.1s" }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = tm.rowBg || "#f9fafb")}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = idx % 2 === 0 ? "white" : "#fafafa")}
                  >
                    <td style={{ padding: "12px 20px", color: "#d1d5db", fontSize: "11px", fontFamily: "monospace", fontWeight: 500 }}>{idx + 1}</td>
                    <td style={{ padding: "12px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: DARK, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "#a7f3d0", flexShrink: 0, fontFamily: "'Sora', sans-serif" }}>
                          {initial}
                        </div>
                        <span style={{ fontWeight: 600, color: "#111827" }}>{student.studentName}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 20px", color: "#6b7280", fontSize: "12px" }}>{student.className}</td>
                    <td style={{ padding: "12px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "48px", height: "3px", backgroundColor: "#f3f4f6", borderRadius: "4px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${score}%`, backgroundColor: tm.dot, borderRadius: "4px", transition: "width 0.5s" }} />
                        </div>
                        <span style={{ fontSize: "12px", fontFamily: "monospace", fontWeight: 700, color: tm.dot }}>{score}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 20px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: 700, color: tm.dot }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: tm.dot, display: "inline-block", flexShrink: 0 }} />
                        {tm.label.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: "12px 20px", color: "#9ca3af", fontSize: "11px", maxWidth: "280px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {student.topExplanation}
                    </td>
                  </tr>
                );
              })}
              {topAtRisk?.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: "48px 20px", textAlign: "center", color: "#d1d5db", fontSize: "13px" }}>
                    No students currently at risk.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        <div style={{ padding: "14px 24px", borderTop: "1px solid #f9fafb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: "11px", color: "#d1d5db" }}>
            Showing top {topAtRisk?.length ?? 0} students · Updated in real-time
          </p>
          <Link href="/admin/users">
            <button
              style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: 600, color: "#9ca3af", background: "none", border: "none", cursor: "pointer", transition: "color 0.12s" }}
              onMouseEnter={e => (e.currentTarget.style.color = DARK)}
              onMouseLeave={e => (e.currentTarget.style.color = "#9ca3af")}
            >
              <Users style={{ width: "11px", height: "11px" }} />
              Manage user accounts
            </button>
          </Link>
        </div>
      </motion.div>

    </div>
  );
}
