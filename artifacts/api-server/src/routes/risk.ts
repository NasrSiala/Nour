import { Router, type IRouter } from "express";
import { db, riskScoresTable, riskAlertsTable, studentsTable, classesTable, usersTable, attendanceRecordsTable, attendanceSessionsTable } from "@workspace/db";
import { eq, and, desc, isNull } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function scoreToTier(score: number): "low" | "medium" | "high" | "critical" {
  if (score < 0.3) return "low";
  if (score < 0.6) return "medium";
  if (score < 0.8) return "high";
  return "critical";
}

async function computeRiskScore(studentId: number, classId: number): Promise<{
  score: number;
  tier: "low" | "medium" | "high" | "critical";
  explanation: string[];
  features: Record<string, number>;
}> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const records = await db.select().from(attendanceRecordsTable)
    .where(and(
      eq(attendanceRecordsTable.studentId, studentId),
      eq(attendanceRecordsTable.sessionId, attendanceRecordsTable.sessionId),
    ));

  const recentRecords = records.filter(r => r.recordedAt >= thirtyDaysAgo);
  const totalRecent = recentRecords.length;
  const absentRecent = recentRecords.filter(r => r.status === "absent").length;
  const absentRate30d = totalRecent > 0 ? absentRecent / totalRecent : 0;

  // Consecutive absences (from most recent)
  let consecutiveAbsences = 0;
  const sortedRecords = [...records].sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime());
  for (const r of sortedRecords) {
    if (r.status === "absent") consecutiveAbsences++;
    else break;
  }

  // Simple risk score computation
  const score = Math.min(1.0,
    absentRate30d * 0.5 +
    Math.min(consecutiveAbsences, 14) / 14 * 0.35 +
    (totalRecent < 3 ? 0.15 : 0)
  );

  const tier = scoreToTier(score);
  const explanation: string[] = [];

  if (consecutiveAbsences >= 5) explanation.push(`Absent ${consecutiveAbsences} consecutive days`);
  if (absentRate30d > 0.4) explanation.push(`Absence rate ${Math.round(absentRate30d * 100)}% this month`);
  if (totalRecent < 3) explanation.push("Insufficient attendance data");
  if (explanation.length === 0) explanation.push("Attendance patterns are within normal range");

  return {
    score,
    tier,
    explanation,
    features: {
      absentRate30d,
      consecutiveAbsences,
      totalRecentSessions: totalRecent,
    },
  };
}

router.get("/risk/classes/:classId", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.classId) ? req.params.classId[0] : req.params.classId;
  const classId = parseInt(raw, 10);

  const students = await db.select().from(studentsTable)
    .where(and(eq(studentsTable.classId, classId), eq(studentsTable.isActive, true)));

  const results = await Promise.all(students.map(async student => {
    const latestScore = await db.select().from(riskScoresTable)
      .where(eq(riskScoresTable.studentId, student.id))
      .orderBy(desc(riskScoresTable.computedAt))
      .limit(1);

    const previousScore = await db.select().from(riskScoresTable)
      .where(eq(riskScoresTable.studentId, student.id))
      .orderBy(desc(riskScoresTable.computedAt))
      .offset(1)
      .limit(1);

    if (latestScore.length === 0) {
      const computed = await computeRiskScore(student.id, classId);
      return {
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        classId,
        score: computed.score,
        tier: computed.tier,
        explanation: computed.explanation,
        trend: "stable" as const,
        consecutiveAbsences: computed.features.consecutiveAbsences,
        absenceRate30d: computed.features.absentRate30d,
        computedAt: new Date().toISOString(),
      };
    }

    const current = latestScore[0];
    const tierOrder = { low: 0, medium: 1, high: 2, critical: 3 };
    let trend: "up" | "down" | "stable" = "stable";
    if (previousScore.length > 0) {
      const prev = previousScore[0];
      if (tierOrder[current.tier as keyof typeof tierOrder] > tierOrder[prev.tier as keyof typeof tierOrder]) {
        trend = "up";
      } else if (tierOrder[current.tier as keyof typeof tierOrder] < tierOrder[prev.tier as keyof typeof tierOrder]) {
        trend = "down";
      }
    }

    const features = (current.featuresJson as Record<string, number>) ?? {};

    return {
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      classId,
      score: current.score,
      tier: current.tier as "low" | "medium" | "high" | "critical",
      explanation: (current.explanationJson as string[]) ?? [],
      trend,
      consecutiveAbsences: features.consecutiveAbsences ?? 0,
      absenceRate30d: features.absentRate30d ?? 0,
      computedAt: current.computedAt.toISOString(),
    };
  }));

  results.sort((a, b) => b.score - a.score);
  res.json(results);
});

router.get("/risk/students/:studentId/history", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.studentId) ? req.params.studentId[0] : req.params.studentId;
  const studentId = parseInt(raw, 10);

  const history = await db.select().from(riskScoresTable)
    .where(eq(riskScoresTable.studentId, studentId))
    .orderBy(desc(riskScoresTable.computedAt))
    .limit(30);

  res.json(history.map(h => ({
    date: h.computedAt.toISOString().split("T")[0],
    score: h.score,
    tier: h.tier,
  })));
});

router.get("/risk/alerts", requireAuth, async (req, res): Promise<void> => {
  const { acknowledged } = req.query;

  let alerts;
  if (acknowledged === "false") {
    alerts = await db.select().from(riskAlertsTable).where(isNull(riskAlertsTable.acknowledgedAt)).orderBy(desc(riskAlertsTable.triggeredAt));
  } else if (acknowledged === "true") {
    alerts = await db.select().from(riskAlertsTable).orderBy(desc(riskAlertsTable.triggeredAt));
  } else {
    alerts = await db.select().from(riskAlertsTable).orderBy(desc(riskAlertsTable.triggeredAt));
  }

  const formatted = await Promise.all(alerts.map(async alert => {
    const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, alert.studentId));
    const [cls] = await db.select().from(classesTable).where(eq(classesTable.id, alert.classId));
    const latestScore = await db.select().from(riskScoresTable)
      .where(eq(riskScoresTable.studentId, alert.studentId))
      .orderBy(desc(riskScoresTable.computedAt))
      .limit(1);

    let acknowledgedBy: string | null = null;
    if (alert.acknowledgedById) {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, alert.acknowledgedById));
      acknowledgedBy = user?.fullName ?? null;
    }

    return {
      id: alert.id,
      studentId: alert.studentId,
      studentName: student ? `${student.firstName} ${student.lastName}` : "Unknown",
      classId: alert.classId,
      className: cls?.name ?? null,
      tier: (latestScore[0]?.tier ?? "medium") as "low" | "medium" | "high" | "critical",
      score: latestScore[0]?.score ?? 0.5,
      alertType: alert.alertType,
      triggeredAt: alert.triggeredAt.toISOString(),
      acknowledgedAt: alert.acknowledgedAt?.toISOString() ?? null,
      acknowledgedBy,
    };
  }));

  res.json(formatted);
});

router.patch("/risk/alerts/:id/acknowledge", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const user = (req as typeof req & { user: { userId: number } }).user;

  const [alert] = await db.update(riskAlertsTable)
    .set({ acknowledgedAt: new Date(), acknowledgedById: user.userId })
    .where(eq(riskAlertsTable.id, id))
    .returning();

  if (!alert) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }

  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, alert.studentId));
  const [cls] = await db.select().from(classesTable).where(eq(classesTable.id, alert.classId));
  const acknowledger = await db.select().from(usersTable).where(eq(usersTable.id, user.userId)).then(r => r[0]);

  res.json({
    id: alert.id,
    studentId: alert.studentId,
    studentName: student ? `${student.firstName} ${student.lastName}` : "Unknown",
    classId: alert.classId,
    className: cls?.name ?? null,
    tier: "medium" as const,
    score: 0.5,
    alertType: alert.alertType,
    triggeredAt: alert.triggeredAt.toISOString(),
    acknowledgedAt: alert.acknowledgedAt?.toISOString() ?? null,
    acknowledgedBy: acknowledger?.fullName ?? null,
  });
});

router.post("/risk/run-now", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const startTime = Date.now();
  let studentsScored = 0;
  let alertsCreated = 0;

  const students = await db.select().from(studentsTable).where(eq(studentsTable.isActive, true));

  for (const student of students) {
    if (!student.classId) continue;
    try {
      const computed = await computeRiskScore(student.id, student.classId);
      const [score] = await db.insert(riskScoresTable).values({
        studentId: student.id,
        classId: student.classId,
        score: computed.score,
        tier: computed.tier,
        featuresJson: computed.features,
        explanationJson: computed.explanation,
      }).returning();

      studentsScored++;

      if (computed.tier === "high" || computed.tier === "critical") {
        await db.insert(riskAlertsTable).values({
          riskScoreId: score.id,
          studentId: student.id,
          classId: student.classId,
          alertType: `risk_${computed.tier}`,
          notificationSent: false,
        });
        alertsCreated++;
      }
    } catch (err) {
      logger.error({ err, studentId: student.id }, "Error computing risk score");
    }
  }

  res.json({
    studentsScored,
    alertsCreated,
    durationMs: Date.now() - startTime,
  });
});

export default router;
