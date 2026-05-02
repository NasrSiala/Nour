import { useAuth } from "@/hooks/use-auth";
import {
  useListSubjects,
  useGetStudentAttendanceSummary,
  useListStudents,
  getListSubjectsQueryKey,
  getGetStudentAttendanceSummaryQueryKey,
  getListStudentsQueryKey,
} from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  BookOpen,
  CalendarCheck,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";

const subjectGradients = [
  "from-emerald-500 to-teal-600",
  "from-blue-500 to-indigo-600",
  "from-violet-500 to-purple-600",
  "from-orange-500 to-amber-600",
  "from-pink-500 to-rose-600",
  "from-cyan-500 to-sky-600",
];

const attendanceStatConfig = [
  { key: "present" as const, label: "Présent", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  { key: "absent" as const, label: "Absent", icon: XCircle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
  { key: "late" as const, label: "Retard", icon: Clock, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  { key: "excused" as const, label: "Excusé", icon: Shield, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
];

export default function StudentDashboard() {
  const { user } = useAuth();

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

  const classSubjects = subjects ?? [];
  const rate = summary?.attendanceRatePct ?? 0;
  const rateColor = rate >= 85 ? "text-emerald-600" : rate >= 70 ? "text-amber-600" : "text-red-600";
  const rateBg = rate >= 85 ? "from-emerald-500 to-teal-600" : rate >= 70 ? "from-amber-500 to-orange-600" : "from-red-500 to-rose-600";

  const initials = user?.fullName
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "??";

  return (
    <div className="space-y-6 pb-8">
      {/* Welcome hero */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a3d25] via-[#0f5535] to-[#1a7a52] p-7 text-white shadow-xl"
      >
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="relative flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shrink-0">
            <span className="text-xl font-bold">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-yellow-300" />
              <span className="text-white/70 text-sm">Bienvenue de retour</span>
            </div>
            <h1 className="text-2xl font-bold truncate">{user?.fullName}</h1>
            <p className="text-white/60 text-sm mt-0.5 flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5" />
              Élève · Espace personnel
            </p>
          </div>
          {summary && (
            <div className="shrink-0 text-center">
              <div className={`text-3xl font-black ${rate >= 85 ? "text-emerald-300" : rate >= 70 ? "text-amber-300" : "text-red-300"}`}>
                {rate}%
              </div>
              <p className="text-white/60 text-xs">Présence</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Attendance card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-border bg-white overflow-hidden shadow-sm"
      >
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <CalendarCheck className="h-4 w-4 text-primary" />
            </div>
            <h2 className="font-semibold text-sm">Mes présences</h2>
          </div>
          <Link href="/student/attendance">
            <Button variant="ghost" size="sm" className="text-xs gap-1 text-primary">
              Voir détails
              <ChevronRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
        <div className="p-5">
          {loadingSummary || !studentId ? (
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {attendanceStatConfig.map((cfg, i) => {
                  const StatIcon = cfg.icon;
                  const val = summary?.[cfg.key] ?? 0;
                  return (
                    <motion.div
                      key={cfg.key}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.06 }}
                      className={`rounded-xl p-3 border ${cfg.bg} ${cfg.border} text-center`}
                    >
                      <StatIcon className={`h-5 w-5 mx-auto mb-1 ${cfg.color}`} />
                      <p className={`text-2xl font-black ${cfg.color}`}>{val}</p>
                      <p className={`text-xs font-medium mt-0.5 ${cfg.color} opacity-80`}>{cfg.label}</p>
                    </motion.div>
                  );
                })}
              </div>

              {summary && (
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Taux de présence global</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${rate}%` }}
                        transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
                        className={`h-full rounded-full bg-gradient-to-r ${rateBg}`}
                      />
                    </div>
                    <span className={`text-sm font-bold ${rateColor}`}>{rate}%</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>

      {/* Subjects section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            <h2 className="font-semibold text-sm">Mes matières</h2>
          </div>
          <Link href="/student/subjects">
            <Button variant="ghost" size="sm" className="text-xs gap-1 text-primary">
              Voir tout
              <ChevronRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>

        {loadingSubjects ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {classSubjects.slice(0, 6).map((subject, i) => {
              const grad = subjectGradients[subject.id % subjectGradients.length];
              return (
                <motion.div
                  key={subject.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                >
                  <Link href={`/student/subjects/${subject.id}`}>
                    <div className="group flex items-center gap-4 p-4 rounded-2xl border border-border bg-white hover:shadow-md hover:border-primary/20 transition-all cursor-pointer overflow-hidden relative">
                      <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${grad}`} />
                      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${grad} shadow-sm shrink-0`}>
                        <BookOpen className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                          {subject.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{subject.code}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="secondary" className="text-xs">{subject.lessonCount}</Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
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
