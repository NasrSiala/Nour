import { db, riskScoresTable, riskAlertsTable, studentsTable, attendanceRecordsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { logger } from "./logger";

export function scoreToTier(score: number): "low" | "medium" | "high" | "critical" {
  if (score < 0.3) return "low";
  if (score < 0.6) return "medium";
  if (score < 0.8) return "high";
  return "critical";
}

export async function computeRiskScore(studentId: number, _classId: number): Promise<{
  score: number;
  tier: "low" | "medium" | "high" | "critical";
  explanation: string[];
  features: Record<string, number>;
}> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const records = await db.select().from(attendanceRecordsTable)
    .where(eq(attendanceRecordsTable.studentId, studentId));

  const recentRecords = records.filter(r => r.recordedAt >= thirtyDaysAgo);
  const totalRecent = recentRecords.length;
  const absentRecent = recentRecords.filter(r => r.status === "absent").length;
  const absentRate30d = totalRecent > 0 ? absentRecent / totalRecent : 0;

  let consecutiveAbsences = 0;
  const sortedRecords = [...records].sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime());
  for (const r of sortedRecords) {
    if (r.status === "absent") consecutiveAbsences++;
    else break;
  }

  const score = Math.min(1.0,
    absentRate30d * 0.5 +
    Math.min(consecutiveAbsences, 14) / 14 * 0.35 +
    (totalRecent < 3 ? 0.15 : 0)
  );

  const tier = scoreToTier(score);
  const explanation: string[] = [];
  if (consecutiveAbsences >= 5) explanation.push(`غائب منذ ${consecutiveAbsences} أيام متتالية`);
  if (absentRate30d > 0.4) explanation.push(`معدل الغياب ${Math.round(absentRate30d * 100)}٪ هذا الشهر`);
  if (totalRecent < 3) explanation.push("بيانات الحضور غير كافية");
  if (explanation.length === 0) explanation.push("أنماط الحضور ضمن النطاق الطبيعي");

  return { score, tier, explanation, features: { absentRate30d, consecutiveAbsences, totalRecentSessions: totalRecent } };
}

export async function runRiskEngine(): Promise<{ studentsScored: number; alertsCreated: number; durationMs: number }> {
  const startTime = Date.now();
  let studentsScored = 0;
  let alertsCreated = 0;

  const students = await db.select().from(studentsTable).where(eq(studentsTable.isActive, true));

  for (const student of students) {
    if (!student.classId) continue;
    try {
      const computed = await computeRiskScore(student.id, student.classId);
      const [res] = await db.insert(riskScoresTable).values({
        studentId: student.id,
        classId: student.classId,
        score: computed.score,
        tier: computed.tier,
        featuresJson: computed.features,
        explanationJson: computed.explanation,
      });

      const scoreId = res.insertId;
      studentsScored++;

      if (computed.tier === "high" || computed.tier === "critical") {
        await db.insert(riskAlertsTable).values({
          riskScoreId: scoreId,
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

  return { studentsScored, alertsCreated, durationMs: Date.now() - startTime };
}
