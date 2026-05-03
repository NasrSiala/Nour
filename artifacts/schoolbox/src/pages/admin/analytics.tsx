import { useGetAttendanceTrend, useGetRiskByClass, useGetTopAtRiskStudents, useGetContentEngagement } from "@workspace/api-client-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const tierColor: Record<string, string> = {
  low: "bg-green-100 text-green-800",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

export default function AdminAnalytics() {
  const { t } = useTranslation();
  const { data: trend, isLoading: loadingTrend } = useGetAttendanceTrend({ weeks: 16 });
  const { data: riskByClass, isLoading: loadingRisk } = useGetRiskByClass();
  const { data: topAtRisk, isLoading: loadingTop } = useGetTopAtRiskStudents({ limit: 20 });
  const { data: engagement, isLoading: loadingEngagement } = useGetContentEngagement();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="text-inline-start">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">{t("analyticsTitle")}</h1>
        <p className="text-muted-foreground">{t("analyticsSubtitle")}</p>
      </div>

      {/* Attendance Trend */}
      <Card>
        <CardHeader className="text-inline-start">
          <CardTitle>{t("attendanceTrend16w")}</CardTitle>
        </CardHeader>
        <CardContent className="h-[280px]">
          {loadingTrend ? <Skeleton className="h-full rounded-xl" /> : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="weekLabel" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} interval={1} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                <Tooltip formatter={(v: number) => [`${v.toFixed(1)}%`, t("attendance")]} />
                <Legend />
                <Line type="monotone" dataKey="rate" name="Attendance %" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3, fill: "hsl(var(--primary))" }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="absent" name="Absent" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk by Class */}
        <Card>
          <CardHeader className="text-inline-start">
            <CardTitle>{t("riskDistributionByClass")}</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            {loadingRisk ? <Skeleton className="h-full rounded-xl" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskByClass} layout="vertical" margin={{ left: 48, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="className" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} width={60} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="riskCounts.low" name={t("low")} stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="riskCounts.medium" name={t("medium")} stackId="a" fill="#f59e0b" />
                  <Bar dataKey="riskCounts.high" name={t("high")} stackId="a" fill="#f97316" />
                  <Bar dataKey="riskCounts.critical" name={t("critical")} stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Content Engagement Radar */}
        <Card>
          <CardHeader className="text-inline-start">
            <CardTitle>{t("contentEngagementBySubject")}</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            {loadingEngagement ? <Skeleton className="h-full rounded-xl" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={engagement?.slice(0, 8)}>
                  <PolarGrid stroke="#f0f0f0" />
                  <PolarAngleAxis dataKey="subjectName" tick={{ fontSize: 10 }} />
                  <Radar name={t("student")} dataKey="uniqueStudents" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
                  <Radar name={t("contentInteractions")} dataKey="totalViews" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Class Risk Summary Cards */}
      {!loadingRisk && riskByClass && (
        <div className="text-inline-start">
          <h2 className="text-lg font-semibold mb-3">{t("classRiskSummary")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {riskByClass.map(cls => {
              const total = cls.studentCount;
              const atRisk = (cls.riskCounts.high ?? 0) + (cls.riskCounts.critical ?? 0);
              const pct = total > 0 ? Math.round(atRisk / total * 100) : 0;
              return (
                <Card key={cls.classId} className={cn("border-s-4", pct >= 30 ? "border-s-red-500" : pct >= 15 ? "border-s-orange-400" : "border-s-green-500")}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold">{cls.className}</p>
                        <p className="text-xs text-muted-foreground">{cls.teacherName ?? t("noTeacher")}</p>
                      </div>
                      <span className="text-xs font-bold text-muted-foreground">{total} {t("studentCount")}</span>
                    </div>
                    <div className="flex gap-1.5 flex-wrap mt-3">
                      {(["low", "medium", "high", "critical"] as const).map(tier => (
                        <span key={tier} className={cn("text-xs px-2 py-0.5 rounded-full font-medium", tierColor[tier])}>
                          {cls.riskCounts[tier] ?? 0} {t(tier)}
                        </span>
                      ))}
                    </div>
                    <div className="mt-2 pt-2 border-t flex justify-between text-xs text-muted-foreground">
                      <span>{t("avgRiskScore")}</span>
                      <span className="font-semibold">{(cls.avgRiskScore * 100).toFixed(0)}/100</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Top At-Risk Table */}
      <Card>
        <CardHeader className="text-inline-start">
          <CardTitle>{t("topAtRiskStudents20")}</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingTop ? (
            <div className="space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-inline-start">
                <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-inline-start">#</th>
                    <th className="px-4 py-3 text-inline-start">{t("student")}</th>
                    <th className="px-4 py-3 text-inline-start">{t("class")}</th>
                    <th className="px-4 py-3 text-inline-start">{t("status")}</th>
                    <th className="px-4 py-3 text-inline-start">{t("tier")}</th>
                    <th className="px-4 py-3 text-inline-start">{t("consecutiveAbsences")}</th>
                    <th className="px-4 py-3 text-inline-start">{t("keyFactor")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {topAtRisk?.map((s, i) => (
                    <tr key={s.studentId} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{s.studentName}</td>
                      <td className="px-4 py-3 text-gray-600">{s.className}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                            <div className={cn("h-full rounded-full", s.score >= 0.8 ? "bg-red-500" : s.score >= 0.6 ? "bg-orange-500" : s.score >= 0.3 ? "bg-amber-400" : "bg-green-500")} style={{ width: `${Math.round(s.score * 100)}%` }} />
                          </div>
                          <span className="text-xs font-mono">{(s.score * 100).toFixed(0)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={cn("text-xs border", tierColor[s.tier])} variant="outline">
                          {t(s.tier).toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">{s.consecutiveAbsences}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs max-w-[220px] truncate">{s.topExplanation}</td>
                    </tr>
                  ))}
                  {topAtRisk?.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">{t("noStudentsAtRisk")}</td></tr>
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
