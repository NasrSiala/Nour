import { useAuth } from "@/hooks/use-auth";
import { useListStudents, useGetStudentAttendanceSummary, getListStudentsQueryKey, getGetStudentAttendanceSummaryQueryKey } from "@workspace/api-client-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarCheck, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function StudentAttendance() {
  const { user } = useAuth();

  const { data: students } = useListStudents({}, { query: { queryKey: getListStudentsQueryKey({}) } });
  const studentRecord = students?.find(s => s.classId === user?.classId && (s.firstName + " " + s.lastName) === user?.fullName);
  const studentId = studentRecord?.id;

  const { data: summary, isLoading } = useGetStudentAttendanceSummary(
    studentId ?? 0,
    {},
    { query: { enabled: !!studentId, queryKey: getGetStudentAttendanceSummaryQueryKey(studentId ?? 0, {}) } }
  );

  const stats = [
    { label: "Présences", value: summary?.present ?? 0, total: summary?.totalSessions, color: "bg-green-500", textColor: "text-green-600", bgColor: "bg-green-50" },
    { label: "Absences", value: summary?.absent ?? 0, total: summary?.totalSessions, color: "bg-red-500", textColor: "text-red-600", bgColor: "bg-red-50" },
    { label: "Retards", value: summary?.late ?? 0, total: summary?.totalSessions, color: "bg-amber-400", textColor: "text-amber-600", bgColor: "bg-amber-50" },
    { label: "Excusés", value: summary?.excused ?? 0, total: summary?.totalSessions, color: "bg-blue-500", textColor: "text-blue-600", bgColor: "bg-blue-50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mes présences</h1>
        <p className="text-muted-foreground">Suivi de vos présences et absences</p>
      </div>

      {isLoading || !studentId ? (
        <div className="space-y-4">
          <Skeleton className="h-32 rounded-xl" />
          <div className="grid grid-cols-2 gap-3">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
        </div>
      ) : (
        <>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="overflow-hidden">
              <CardContent className="pt-0 pb-0">
                <div className="flex items-center gap-6 p-5">
                  <div className="relative w-20 h-20 shrink-0">
                    <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(var(--muted))" strokeWidth="2.5" />
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5"
                        strokeDasharray={`${(summary?.attendanceRatePct ?? 0) * 100 / 100 * 100} 100`}
                        strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold">{summary?.attendanceRatePct ?? 0}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-lg">Taux de présence</p>
                    <p className="text-sm text-muted-foreground">{summary?.totalSessions ?? 0} sessions au total</p>
                    {(summary?.consecutiveAbsences ?? 0) > 2 && (
                      <div className="flex items-center gap-1.5 mt-2 text-sm text-orange-600">
                        <AlertCircle className="h-4 w-4" />
                        {summary?.consecutiveAbsences} absences consécutives
                      </div>
                    )}
                  </div>
                </div>
                <div className="h-2 flex rounded-b-lg overflow-hidden">
                  {stats.map((s, i) => (
                    <div key={i} className={s.color} style={{ width: `${s.total ? (s.value / s.total * 100) : 0}%` }} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}>
                <Card>
                  <CardContent className="pt-4 pb-4 text-center">
                    <p className={cn("text-3xl font-bold", stat.textColor)}>{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                    {stat.total ? (
                      <p className="text-xs text-muted-foreground">{Math.round(stat.value / stat.total * 100)}%</p>
                    ) : null}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {summary?.absentDates && summary.absentDates.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Dates d'absence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {summary.absentDates.map((date, i) => (
                    <Badge key={i} variant="outline" className="text-xs text-red-600 border-red-200 bg-red-50">
                      {new Date(date + "T12:00:00").toLocaleDateString("fr-TN", { day: "numeric", month: "short" })}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
