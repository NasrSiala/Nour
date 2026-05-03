import { Router, type IRouter } from "express";
import { db, studentsTable, classesTable, usersTable, attendanceRecordsTable, attendanceSessionsTable, riskScoresTable, notificationsTable, subjectsTable, lessonsTable } from "@workspace/db";
import { eq, and, gte, sql, desc } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/analytics/kpis", requireAuth, requireRole("admin", "teacher"), async (_req, res): Promise<void> => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [activeStudents] = await db.select({ count: sql<number>`count(*)` }).from(studentsTable).where(eq(studentsTable.isActive, true));
  const [totalClasses] = await db.select({ count: sql<number>`count(*)` }).from(classesTable);
  const [totalTeachers] = await db.select({ count: sql<number>`count(*)` }).from(usersTable).where(eq(usersTable.role, "teacher"));

  const recentRecords = await db.select().from(attendanceRecordsTable)
    .where(gte(attendanceRecordsTable.recordedAt, thirtyDaysAgo));

  const totalSessions = recentRecords.length;
  const presentSessions = recentRecords.filter(r => r.status === "present" || r.status === "late").length;
  const attendanceRate30d = totalSessions > 0 ? Math.round(presentSessions / totalSessions * 1000) / 10 : 100;

  const result = await db.execute(sql`
    SELECT rs.student_id, rs.tier, rs.score
    FROM risk_scores rs
    INNER JOIN (
      SELECT student_id, MAX(computed_at) as max_at
      FROM risk_scores
      GROUP BY student_id
    ) latest ON rs.student_id = latest.student_id AND rs.computed_at = latest.max_at
  `);
  const scores = (result[0] as unknown) as { student_id: number; tier: string; score: number }[];
  const atRiskCount = scores.filter(s => s.tier === "high" || s.tier === "critical").length;
  const atRiskPct = Number(activeStudents.count) > 0 ? Math.round(atRiskCount / Number(activeStudents.count) * 1000) / 10 : 0;

  const [notificationsSent] = await db.select({ count: sql<number>`count(*)` })
    .from(notificationsTable)
    .where(and(eq(notificationsTable.status, "sent"), gte(notificationsTable.createdAt, thirtyDaysAgo)));

  const allAlerts = await db.execute(sql`SELECT acknowledged_at FROM risk_alerts WHERE triggered_at >= ${thirtyDaysAgo}`);
  const alertRows = (allAlerts[0] as unknown) as { acknowledged_at: Date | null }[];
  const acknowledgedRate = alertRows.length > 0
    ? Math.round(alertRows.filter(a => a.acknowledged_at != null).length / alertRows.length * 1000) / 10
    : 100;

  // Content engagement: students who accessed lessons in last 7 days (using attendance as proxy)
  const recentSessions7d = recentRecords.filter(r => r.recordedAt >= sevenDaysAgo);
  const uniqueStudents7d = new Set(recentSessions7d.map(r => r.studentId)).size;
  const contentEngagement7d = Number(activeStudents.count) > 0
    ? Math.round(uniqueStudents7d / Number(activeStudents.count) * 1000) / 10
    : 0;

  res.json({
    attendanceRate30d,
    studentsAtRiskCount: atRiskCount,
    studentsAtRiskPct: atRiskPct,
    activeStudents: Number(activeStudents.count),
    totalClasses: Number(totalClasses.count),
    totalTeachers: Number(totalTeachers.count),
    notificationsSent30d: Number(notificationsSent.count),
    alertsAcknowledgedRate: acknowledgedRate,
    contentEngagement7d,
  });
});

router.get("/analytics/attendance-trend", requireAuth, requireRole("admin", "teacher"), async (req, res): Promise<void> => {
  const weeks = Math.min(Math.max(Number(req.query.weeks) || 8, 1), 52);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - startDate.getDay() - (weeks - 1) * 7);
  startDate.setHours(0, 0, 0, 0);

  const records = await db.select({
    id: attendanceRecordsTable.id,
    status: attendanceRecordsTable.status,
    recordedAt: attendanceRecordsTable.recordedAt,
  })
    .from(attendanceRecordsTable)
    .where(gte(attendanceRecordsTable.recordedAt, startDate));

  const results = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() - i * 7);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    const weekRecords = records.filter(r => r.recordedAt >= weekStart && r.recordedAt < weekEnd);
    const total = weekRecords.length;
    const present = weekRecords.filter(r => r.status === "present").length;
    const absent = weekRecords.filter(r => r.status === "absent").length;
    const rate = total > 0 ? Math.round((present + weekRecords.filter(r => r.status === "late").length) / total * 1000) / 10 : 0;

    const weekNum = Math.ceil((weekStart.getDate() - weekStart.getDay() + 1) / 7);
    results.push({
      weekLabel: `W${weekNum} ${weekStart.getFullYear()}`,
      rate,
      sessions: total,
      present,
      absent,
    });
  }

  res.json(results);
});

router.get("/analytics/risk-by-class", requireAuth, requireRole("admin", "teacher"), async (_req, res): Promise<void> => {
  const classes = await db.select({
    id: classesTable.id,
    name: classesTable.name,
    gradeLevel: classesTable.gradeLevel,
    homeroomTeacherId: classesTable.homeroomTeacherId,
    teacherName: usersTable.fullName,
  })
    .from(classesTable)
    .leftJoin(usersTable, eq(classesTable.homeroomTeacherId, usersTable.id));

  const studentCounts = await db.select({
    classId: studentsTable.classId,
    count: sql<number>`count(*)`
  })
    .from(studentsTable)
    .groupBy(studentsTable.classId);

  const riskStats = await db.execute(sql`
    SELECT rs.class_id, rs.tier, rs.score, rs.student_id
    FROM risk_scores rs
    INNER JOIN (
      SELECT student_id, MAX(computed_at) as max_at
      FROM risk_scores
      GROUP BY student_id
    ) latest ON rs.student_id = latest.student_id AND rs.computed_at = latest.max_at
  `);
  const riskRows = (riskStats[0] as unknown) as { class_id: number; tier: string; score: number; student_id: number }[];

  const results = classes.map(cls => {
    const classRiskRows = riskRows.filter(r => r.class_id === cls.id);
    const riskCounts = { low: 0, medium: 0, high: 0, critical: 0 };
    let totalScore = 0;
    
    for (const row of classRiskRows) {
      if (row.tier in riskCounts) riskCounts[row.tier as keyof typeof riskCounts]++;
      totalScore += row.score;
    }

    const sCount = studentCounts.find(sc => sc.classId === cls.id)?.count ?? 0;

    return {
      classId: cls.id,
      className: cls.name,
      gradeLevel: cls.gradeLevel,
      teacherName: cls.teacherName,
      riskCounts,
      avgRiskScore: classRiskRows.length > 0 ? Math.round(totalScore / classRiskRows.length * 1000) / 1000 : 0,
      studentCount: Number(sCount),
    };
  });

  results.sort((a, b) => b.avgRiskScore - a.avgRiskScore);
  res.json(results);
});

router.get("/analytics/top-at-risk", requireAuth, requireRole("admin", "teacher"), async (req, res): Promise<void> => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);

  const scores = await db.execute(sql`
    SELECT 
      rs.student_id, rs.tier, rs.score, rs.class_id, rs.explanation_json, rs.features_json,
      s.first_name, s.last_name, s.parent_phone,
      c.name as class_name, c.grade_level
    FROM risk_scores rs
    INNER JOIN (
      SELECT student_id, MAX(computed_at) as max_at
      FROM risk_scores
      GROUP BY student_id
    ) latest ON rs.student_id = latest.student_id AND rs.computed_at = latest.max_at
    INNER JOIN students s ON rs.student_id = s.id
    INNER JOIN classes c ON rs.class_id = c.id
    ORDER BY rs.score DESC
    LIMIT ${limit}
  `);
  
  const rows = (scores[0] as unknown) as any[];

  const results = rows.map(row => {
    const maskedPhone = row.parent_phone
      ? row.parent_phone.replace(/(\+\d{3})(\d{2})(\d{3})(\d{3})/, "$1 ** *** $4")
      : null;

    const features = (row.features_json ?? {}) as Record<string, number>;

    return {
      studentId: row.student_id,
      studentName: `${row.first_name} ${row.last_name}`,
      className: row.class_name,
      gradeLevel: row.grade_level,
      score: row.score,
      tier: row.tier as "low" | "medium" | "high" | "critical",
      topExplanation: (row.explanation_json?.[0] ?? "No data available"),
      consecutiveAbsences: features.consecutiveAbsences ?? 0,
      parentPhone: maskedPhone,
    };
  });

  res.json(results);
});

router.get("/analytics/content-engagement", requireAuth, requireRole("admin", "teacher"), async (_req, res): Promise<void> => {
  const subjects = await db.select().from(subjectsTable);

  const results = await Promise.all(subjects.map(async subject => {
    const lessons = await db.select().from(lessonsTable).where(eq(lessonsTable.subjectId, subject.id));
    
    // TODO: Implement actual engagement tracking. Returning static placeholders for now.
    return {
      subjectId: subject.id,
      subjectName: subject.name,
      lessonCount: lessons.length,
      uniqueStudents: 0,
      totalViews: 0,
    };
  }));

  res.json(results);
});

export default router;
