import { useAuth } from "@/hooks/use-auth";
import {
  useListSubjects,
  useGetStudentAttendanceSummary,
  useListStudents,
  getListSubjectsQueryKey,
  getGetStudentAttendanceSummaryQueryKey,
  getListStudentsQueryKey,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { ArrowRight, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const DARK = "#0B2819";

const subjectAccents = ["#10b981","#3b82f6","#8b5cf6","#f59e0b","#ef4444","#06b6d4"];

function attendanceColor(rate: number) {
  if (rate >= 85) return "#10b981";
  if (rate >= 70) return "#f59e0b";
  return "#ef4444";
}

function attendanceLabel(rate: number, t: any) {
  if (rate >= 90) return t("excellent");
  if (rate >= 80) return t("good");
  if (rate >= 70) return t("needsAttention");
  return t("atRisk");
}

export default function StudentDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const todayLabel = new Date().toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" });

  const { data: students } = useListStudents({}, { query: { queryKey: getListStudentsQueryKey({}) } });
  const studentRecord = students?.find(
    s => s.classId === user?.classId && (s.firstName + " " + s.lastName) === user?.fullName
  );
  const studentId = studentRecord?.id;

  const { data: subjects, isLoading: loadingSubjects } = useListSubjects(
    { gradeLevel: undefined },
    { query: { queryKey: getListSubjectsQueryKey({}) } }
  );

  const { data: summary, isLoading: loadingSummary } = useGetStudentAttendanceSummary(
    studentId ?? 0,
    {},
    { query: { enabled: !!studentId, queryKey: getGetStudentAttendanceSummaryQueryKey(studentId ?? 0, {}) } }
  );

  const classSubjects = (subjects ?? []).slice(0, 6);
  const rate = summary?.attendanceRatePct ?? 0;
  const rateColor = attendanceColor(rate);

  const firstName = user?.fullName?.split(" ")[0] ?? t("welcomeBack");

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
            {t("bonjour", { name: firstName })}
          </h1>
          <p style={{ fontSize: "13px", color: "#9ca3af", marginTop: "5px" }}>{todayLabel}</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {[
            { label: t("mySubjects"), href: "/student/subjects" },
            { label: t("attendanceRecord"), href: "/student/attendance" },
          ].map(a => (
            <Link key={a.href} href={a.href}>
              <button
                style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "6px 12px", borderRadius: "20px", border: "1px solid #e5e7eb", background: "white", fontSize: "12px", fontWeight: 600, color: "#374151", cursor: "pointer", transition: "all 0.12s" }}
                onMouseEnter={e => { const b = e.currentTarget; b.style.borderColor = DARK; b.style.backgroundColor = DARK; b.style.color = "white"; }}
                onMouseLeave={e => { const b = e.currentTarget; b.style.borderColor = "#e5e7eb"; b.style.backgroundColor = "white"; b.style.color = "#374151"; }}
              >
                {a.label}
              </button>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* ── Attendance billboard ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr 1fr", borderRadius: "16px", overflow: "hidden", border: "1px solid #e5e7eb" }}
      >
        {/* Featured — Overall rate */}
        <div style={{ backgroundColor: DARK, padding: "26px 26px 22px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "20px 20px", pointerEvents: "none" }} />
          <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", color: "#4d7a62", textTransform: "uppercase", position: "relative" }}>
            {t("attendanceRate")}
          </p>
          {loadingSummary || !studentId ? (
            <Skeleton className="h-12 w-28 mt-2 rounded-lg" style={{ background: "rgba(255,255,255,0.1)" }} />
          ) : (
            <>
              <p style={{ fontSize: "52px", fontWeight: 800, fontFamily: "'Sora', sans-serif", lineHeight: 1, marginTop: "8px", position: "relative", letterSpacing: "-0.03em", color: rateColor }}>
                {rate}<span style={{ fontSize: "24px", color: "#4d7a62", marginLeft: "1px" }}>%</span>
              </p>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "#4d7a62", marginTop: "10px", position: "relative", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                {attendanceLabel(rate, t)}
              </p>
            </>
          )}
          <Link href="/student/attendance">
            <button style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginTop: "14px", fontSize: "12px", fontWeight: 600, color: "#4ade80", background: "none", border: "none", cursor: "pointer", padding: 0, position: "relative" }}>
              {t("fullRecord")} <ArrowRight style={{ width: "11px", height: "11px" }} />
            </button>
          </Link>
        </div>

        {/* Present */}
        <div style={{ padding: "26px 18px 22px", backgroundColor: "white", borderLeft: "1px solid #f3f4f6" }}>
          <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", color: "#9ca3af", textTransform: "uppercase" }}>{t("present")}</p>
          {loadingSummary || !studentId ? (
            <Skeleton className="h-10 w-12 mt-3 rounded-lg" />
          ) : (
            <p style={{ fontSize: "40px", fontWeight: 800, color: "#10b981", fontFamily: "'Sora', sans-serif", lineHeight: 1, marginTop: "10px", letterSpacing: "-0.03em" }}>
              {summary?.present ?? 0}
            </p>
          )}
          <p style={{ fontSize: "11px", color: "#d1d5db", marginTop: "8px" }}>{t("days")}</p>
        </div>

        {/* Absent */}
        <div style={{ padding: "26px 18px 22px", backgroundColor: "white", borderLeft: "1px solid #f3f4f6" }}>
          <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", color: "#9ca3af", textTransform: "uppercase" }}>{t("absent")}</p>
          {loadingSummary || !studentId ? (
            <Skeleton className="h-10 w-12 mt-3 rounded-lg" />
          ) : (
            <p style={{ fontSize: "40px", fontWeight: 800, color: (summary?.absent ?? 0) > 5 ? "#ef4444" : "#374151", fontFamily: "'Sora', sans-serif", lineHeight: 1, marginTop: "10px", letterSpacing: "-0.03em" }}>
              {summary?.absent ?? 0}
            </p>
          )}
          <p style={{ fontSize: "11px", color: "#d1d5db", marginTop: "8px" }}>{t("days")}</p>
        </div>

        {/* Late */}
        <div style={{ padding: "26px 18px 22px", backgroundColor: "white", borderLeft: "1px solid #f3f4f6" }}>
          <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", color: "#9ca3af", textTransform: "uppercase" }}>{t("late")}</p>
          {loadingSummary || !studentId ? (
            <Skeleton className="h-10 w-12 mt-3 rounded-lg" />
          ) : (
            <p style={{ fontSize: "40px", fontWeight: 800, color: (summary?.late ?? 0) > 3 ? "#f59e0b" : "#374151", fontFamily: "'Sora', sans-serif", lineHeight: 1, marginTop: "10px", letterSpacing: "-0.03em" }}>
              {summary?.late ?? 0}
            </p>
          )}
          <p style={{ fontSize: "11px", color: "#d1d5db", marginTop: "8px" }}>{t("days")}</p>
        </div>

        {/* Excused */}
        <div style={{ padding: "26px 18px 22px", backgroundColor: "white", borderLeft: "1px solid #f3f4f6" }}>
          <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", color: "#9ca3af", textTransform: "uppercase" }}>{t("excused")}</p>
          {loadingSummary || !studentId ? (
            <Skeleton className="h-10 w-12 mt-3 rounded-lg" />
          ) : (
            <p style={{ fontSize: "40px", fontWeight: 800, color: "#374151", fontFamily: "'Sora', sans-serif", lineHeight: 1, marginTop: "10px", letterSpacing: "-0.03em" }}>
              {summary?.excused ?? 0}
            </p>
          )}
          <p style={{ fontSize: "11px", color: "#d1d5db", marginTop: "8px" }}>{t("days")}</p>
        </div>
      </motion.div>

      {/* ── Subjects ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        style={{ backgroundColor: "white", borderRadius: "16px", border: "1px solid #e5e7eb", overflow: "hidden" }}
      >
        <div style={{ padding: "20px 22px 16px", borderBottom: "1px solid #f9fafb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: "14px", fontWeight: 700, color: "#111827", fontFamily: "'Sora', sans-serif" }}>{t("mySubjects")}</p>
          <Link href="/student/subjects">
            <button
              style={{ fontSize: "11px", fontWeight: 600, color: "#9ca3af", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
              onMouseEnter={e => (e.currentTarget.style.color = DARK)}
              onMouseLeave={e => (e.currentTarget.style.color = "#9ca3af")}
            >
              {t("allSubjects")} <ArrowRight style={{ width: "10px", height: "10px" }} />
            </button>
          </Link>
        </div>

        {loadingSubjects ? (
          <div style={{ padding: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        ) : classSubjects.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#d1d5db", fontSize: "13px" }}>
            {t("noSubjectsAssigned")}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0" }}>
            {classSubjects.map((subject, i) => {
              const accent = subjectAccents[i % subjectAccents.length];
              const isLast = i >= classSubjects.length - 2;
              return (
                <motion.div
                  key={subject.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.16 + i * 0.04 }}
                >
                  <Link href={`/student/subjects/${subject.id}`}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        padding: "16px 22px",
                        borderBottom: isLast ? "none" : "1px solid #f9fafb",
                        borderRight: i % 2 === 0 ? "1px solid #f9fafb" : "none",
                        cursor: "pointer",
                        transition: "background 0.12s",
                        borderLeft: `3px solid ${accent}`,
                      }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#fafafa")}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "13px", fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {subject.name}
                        </p>
                        <p style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px", fontFamily: "monospace" }}>
                          {subject.code}
                        </p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <BookOpen style={{ width: "11px", height: "11px", color: "#d1d5db" }} />
                          <span style={{ fontSize: "11px", fontWeight: 600, color: "#9ca3af" }}>{subject.lessonCount}</span>
                        </div>
                        <ArrowRight style={{ width: "11px", height: "11px", color: "#d1d5db" }} />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

    </div>
  );
}
