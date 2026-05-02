import { useGetSchoolKpis, useGetAttendanceTrend, useGetRiskByClass, useGetTopAtRiskStudents } from "@workspace/api-client-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Users, AlertTriangle, Activity, Bell } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboard() {
  const { data: kpis, isLoading: isLoadingKpis } = useGetSchoolKpis();
  const { data: trend, isLoading: isLoadingTrend } = useGetAttendanceTrend({ weeks: 12 });
  const { data: riskByClass, isLoading: isLoadingRisk } = useGetRiskByClass();
  const { data: topAtRisk, isLoading: isLoadingTopRisk } = useGetTopAtRiskStudents({ limit: 10 });

  if (isLoadingKpis || isLoadingTrend || isLoadingRisk || isLoadingTopRisk) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[400px] rounded-xl" />
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
      </div>
    );
  }

  const kpiCards = [
    { title: "Attendance Rate (30d)", value: `${kpis?.attendanceRate30d.toFixed(1)}%`, icon: Activity, color: "text-blue-500" },
    { title: "Students at Risk", value: kpis?.studentsAtRiskCount, sub: `${kpis?.studentsAtRiskPct.toFixed(1)}% of total`, icon: AlertTriangle, color: "text-red-500" },
    { title: "Content Engagement (7d)", value: kpis?.contentEngagement7d, icon: Users, color: "text-green-500" },
    { title: "Notifications Sent", value: kpis?.notificationsSent30d, icon: Bell, color: "text-purple-500" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, i) => (
          <Card key={i} className="border-l-4" style={{ borderLeftColor: `var(--color-${card.color.split('-')[1]}-500)` }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">{card.title}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              {card.sub && <p className="text-xs text-gray-500 mt-1">{card.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Trend (12 Weeks)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="weekLabel" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="rate" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Attendance %" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk Distribution by Class</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskByClass} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="className" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} width={80} />
                <Tooltip />
                <Legend />
                <Bar dataKey="riskCounts.low" name="Low" stackId="a" fill="#10b981" />
                <Bar dataKey="riskCounts.medium" name="Medium" stackId="a" fill="#f59e0b" />
                <Bar dataKey="riskCounts.high" name="High" stackId="a" fill="#f97316" />
                <Bar dataKey="riskCounts.critical" name="Critical" stackId="a" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top At-Risk Students</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Class</th>
                  <th className="px-4 py-3 font-medium">Risk Score</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Key Factor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topAtRisk?.map((student) => (
                  <tr key={student.studentId} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-900">{student.studentName}</td>
                    <td className="px-4 py-3 text-gray-600">{student.className}</td>
                    <td className="px-4 py-3 text-gray-600">{(student.score * 100).toFixed(0)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={student.tier === 'critical' ? 'destructive' : student.tier === 'high' ? 'default' : 'secondary'} className={student.tier === 'high' ? 'bg-orange-500 hover:bg-orange-600' : ''}>
                        {student.tier.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500 truncate max-w-[300px]">{student.topExplanation}</td>
                  </tr>
                ))}
                {topAtRisk?.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">No students currently at risk.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
