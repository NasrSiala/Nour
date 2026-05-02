import { useGetSchoolKpis, useGetAttendanceTrend, useGetRiskByClass, useGetTopAtRiskStudents } from "@workspace/api-client-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, AlertTriangle, Activity, Bell, TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const tierStyles: Record<string, { bg: string; text: string; label: string }> = {
  critical: { bg: "bg-red-100", text: "text-red-700", label: "CRITICAL" },
  high:     { bg: "bg-orange-100", text: "text-orange-700", label: "HIGH" },
  medium:   { bg: "bg-amber-100", text: "text-amber-700", label: "MEDIUM" },
  low:      { bg: "bg-green-100", text: "text-green-700", label: "LOW" },
};

const kpiConfig = [
  {
    key: "attendanceRate30d",
    title: "Attendance Rate",
    sub: "Last 30 days",
    icon: Activity,
    format: (v: number) => `${v.toFixed(1)}%`,
    accentColor: "#10b981",
    accentBg: "from-emerald-500/10 to-emerald-500/5",
  },
  {
    key: "studentsAtRiskCount",
    title: "Students at Risk",
    sub: (kpis: Record<string, number>) => `${kpis.studentsAtRiskPct?.toFixed(1)}% of total`,
    icon: AlertTriangle,
    format: (v: number) => String(v),
    accentColor: "#ef4444",
    accentBg: "from-red-500/10 to-red-500/5",
  },
  {
    key: "contentEngagement7d",
    title: "Engagement (7d)",
    sub: "Content interactions",
    icon: Users,
    format: (v: number) => String(v),
    accentColor: "#3b82f6",
    accentBg: "from-blue-500/10 to-blue-500/5",
  },
  {
    key: "notificationsSent30d",
    title: "Notifications",
    sub: "Sent last 30 days",
    icon: Bell,
    format: (v: number) => String(v),
    accentColor: "#8b5cf6",
    accentBg: "from-violet-500/10 to-violet-500/5",
  },
];

export default function AdminDashboard() {
  const { data: kpis, isLoading: isLoadingKpis } = useGetSchoolKpis();
  const { data: trend, isLoading: isLoadingTrend } = useGetAttendanceTrend({ weeks: 12 });
  const { data: riskByClass, isLoading: isLoadingRisk } = useGetRiskByClass();
  const { data: topAtRisk, isLoading: isLoadingTopRisk } = useGetTopAtRiskStudents({ limit: 10 });

  if (isLoadingKpis || isLoadingTrend || isLoadingRisk || isLoadingTopRisk) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  const kpisData = kpis as Record<string, number> | undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Overview</h1>
        <p className="text-gray-500 text-sm mt-0.5">School performance at a glance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiConfig.map((cfg, i) => {
          const value = kpisData?.[cfg.key] ?? 0;
          const formatted = cfg.format(value);
          const sub = typeof cfg.sub === "function" ? cfg.sub(kpisData ?? {}) : cfg.sub;
          return (
            <motion.div key={cfg.key} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <Card className="overflow-hidden border-0 shadow-sm bg-white">
                <div className="h-1.5 w-full" style={{ backgroundColor: cfg.accentColor }} />
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{cfg.title}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1.5">{formatted}</p>
                      <p className="text-xs text-gray-400 mt-1">{sub}</p>
                    </div>
                    <div className="p-2.5 rounded-xl" style={{ backgroundColor: cfg.accentColor + "18" }}>
                      <cfg.icon className="h-5 w-5" style={{ color: cfg.accentColor }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-800">Attendance Trend</CardTitle>
              <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
                <TrendingUp className="h-3 w-3" /> 12 weeks
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={trend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="weekLabel" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} domain={[50, 100]} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }}
                  formatter={(v: number) => [`${v}%`, "Attendance"]}
                />
                <Line type="monotone" dataKey="rate" stroke="hsl(161 69% 37%)" strokeWidth={2.5}
                  dot={{ r: 3, fill: "hsl(161 69% 37%)", strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "hsl(161 69% 37%)", strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-800">Risk by Class</CardTitle>
              <span className="flex items-center gap-1 text-xs text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded-full">
                <TrendingDown className="h-3 w-3" /> dropout risk
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={riskByClass} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="className" type="category" axisLine={false} tickLine={false}
                  tick={{ fontSize: 11, fill: "#9ca3af" }} width={70} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }}
                />
                <Bar dataKey="riskCounts.low" name="Low" stackId="a" fill="#10b981" radius={[0,0,0,0]} />
                <Bar dataKey="riskCounts.medium" name="Medium" stackId="a" fill="#f59e0b" />
                <Bar dataKey="riskCounts.high" name="High" stackId="a" fill="#f97316" />
                <Bar dataKey="riskCounts.critical" name="Critical" stackId="a" fill="#ef4444" radius={[0,3,3,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* At-risk table */}
      <Card className="border-0 shadow-sm bg-white overflow-hidden">
        <CardHeader className="pb-3 border-b border-gray-50">
          <CardTitle className="text-base font-semibold text-gray-800">Top Students at Risk</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Student</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Class</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Risk</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Tier</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Key Factor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {topAtRisk?.map((student, idx) => {
                const ts = tierStyles[student.tier ?? "low"] ?? tierStyles.low;
                const score = Math.round(student.score * 100);
                return (
                  <tr key={student.studentId} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5 text-gray-400 text-xs font-mono">{idx + 1}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                          {student.studentName?.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900">{student.studentName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">{student.className}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full" style={{
                            width: `${score}%`,
                            backgroundColor: score > 80 ? "#ef4444" : score > 60 ? "#f97316" : score > 30 ? "#f59e0b" : "#10b981"
                          }} />
                        </div>
                        <span className="text-xs font-mono text-gray-600">{score}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${ts.bg} ${ts.text}`}>
                        {ts.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs max-w-xs truncate">{student.topExplanation}</td>
                  </tr>
                );
              })}
              {topAtRisk?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-400">
                    No students currently at risk.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
