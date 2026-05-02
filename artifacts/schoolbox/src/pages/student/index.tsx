import { useAuth } from "@/hooks/use-auth";
import { useListSubjects, useGetStudentAttendanceSummary, useListStudents, getListSubjectsQueryKey, getGetStudentAttendanceSummaryQueryKey, getListStudentsQueryKey } from "@workspace/api-client-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { BookOpen, CalendarCheck, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function StudentDashboard() {
  const { user } = useAuth();

  const { data: students } = useListStudents({}, { query: { queryKey: getListStudentsQueryKey({}) } });
  const studentRecord = students?.find(s => s.classId === user?.classId && (s.firstName + " " + s.lastName) === user?.fullName);
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

  const classSubjects = subjects?.filter(s => user?.classId) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mon espace</h1>
        <p className="text-muted-foreground">Bienvenue, {user?.fullName}</p>
      </div>

      {/* Attendance Summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-primary" />
            Mes présences
          </CardTitle>
          <Link href="/student/attendance">
            <span className="text-xs text-primary hover:underline cursor-pointer">Voir détails</span>
          </Link>
        </CardHeader>
        <CardContent>
          {loadingSummary || !studentId ? (
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Présent", value: summary?.present ?? 0, color: "text-green-600 bg-green-50" },
                { label: "Absent", value: summary?.absent ?? 0, color: "text-red-600 bg-red-50" },
                { label: "Retard", value: summary?.late ?? 0, color: "text-amber-600 bg-amber-50" },
                { label: "Excusé", value: summary?.excused ?? 0, color: "text-blue-600 bg-blue-50" },
              ].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
                  <div className={`rounded-lg p-3 text-center ${item.color}`}>
                    <p className="text-2xl font-bold">{item.value}</p>
                    <p className="text-xs font-medium mt-0.5">{item.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          {summary && (
            <div className="mt-3 pt-3 border-t flex justify-between text-sm">
              <span className="text-muted-foreground">Taux de présence</span>
              <span className="font-semibold">{summary.attendanceRatePct}%</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subjects */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            Mes matières
          </h2>
          <Link href="/student/subjects">
            <span className="text-xs text-primary hover:underline cursor-pointer">Voir tout</span>
          </Link>
        </div>
        {loadingSubjects ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {classSubjects.slice(0, 6).map((subject, i) => (
              <motion.div key={subject.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link href={`/student/subjects/${subject.id}`}>
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" data-testid={`subject-card-${subject.id}`}>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm">{subject.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{subject.code}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">{subject.lessonCount} cours</Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
