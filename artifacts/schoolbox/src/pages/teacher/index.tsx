import { useListClasses, useListAttendanceSessions, useListRiskAlerts, getListClassesQueryKey, getListAttendanceSessionsQueryKey, getListRiskAlertsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Users, CalendarCheck, AlertTriangle, ChevronRight, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

const tierColor: Record<string, string> = {
  low: "bg-green-100 text-green-800 border-green-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  critical: "bg-red-100 text-red-800 border-red-200",
};

export default function TeacherDashboard() {
  const { user } = useAuth();
  const today = new Date().toISOString().split("T")[0];

  const { data: classes, isLoading: loadingClasses } = useListClasses({ query: { queryKey: getListClassesQueryKey() } });
  const { data: todaySessions, isLoading: loadingSessions } = useListAttendanceSessions(
    { sessionDate: today },
    { query: { queryKey: getListAttendanceSessionsQueryKey({ sessionDate: today }) } }
  );
  const { data: alerts, isLoading: loadingAlerts } = useListRiskAlerts(
    { acknowledged: false },
    { query: { queryKey: getListRiskAlertsQueryKey({ acknowledged: false }) } }
  );

  const myClasses = classes?.filter(c => c.homeroomTeacherId === user?.id) ?? [];
  const unacknowledgedAlerts = alerts?.slice(0, 5) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground">Bienvenue, {user?.fullName}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Mes classes", value: loadingClasses ? "—" : myClasses.length, icon: BookOpen, color: "text-primary" },
          { label: "Sessions aujourd'hui", value: loadingSessions ? "—" : todaySessions?.length ?? 0, icon: CalendarCheck, color: "text-blue-500" },
          { label: "Alertes en attente", value: loadingAlerts ? "—" : unacknowledgedAlerts.length, icon: AlertTriangle, color: "text-orange-500" },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Mes classes</CardTitle>
            <Link href="/teacher/classes">
              <Button variant="ghost" size="sm" className="text-xs gap-1">Voir tout <ChevronRight className="h-3 w-3" /></Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {loadingClasses ? (
              [1, 2, 3].map(i => <Skeleton key={i} className="h-14 rounded-lg" />)
            ) : myClasses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Aucune classe assignée</p>
            ) : (
              myClasses.map((cls, i) => (
                <motion.div key={cls.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <Link href={`/teacher/attendance?classId=${cls.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors" data-testid={`class-card-${cls.id}`}>
                      <div>
                        <p className="font-medium text-sm">{cls.name}</p>
                        <p className="text-xs text-muted-foreground">{cls.studentCount} élèves · Grade {cls.gradeLevel}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                </motion.div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Alertes de risque</CardTitle>
            <Link href="/teacher/risk">
              <Button variant="ghost" size="sm" className="text-xs gap-1">Voir tout <ChevronRight className="h-3 w-3" /></Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {loadingAlerts ? (
              [1, 2, 3].map(i => <Skeleton key={i} className="h-14 rounded-lg" />)
            ) : unacknowledgedAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Aucune alerte en attente</p>
            ) : (
              unacknowledgedAlerts.map((alert, i) => (
                <motion.div key={alert.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <div className="flex items-center justify-between p-3 rounded-lg border" data-testid={`alert-card-${alert.id}`}>
                    <div>
                      <p className="font-medium text-sm">{alert.studentName}</p>
                      <p className="text-xs text-muted-foreground">{alert.className}</p>
                    </div>
                    <Badge className={`text-xs border ${tierColor[alert.tier ?? "medium"]}`}>{alert.tier}</Badge>
                  </div>
                </motion.div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
