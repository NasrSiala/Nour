import { mysqlEnum, mysqlTable, serial, text, varchar, int, float, boolean, timestamp, json } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const riskScoresTable = mysqlTable("risk_scores", {
  id: serial("id").primaryKey(),
  studentId: int("student_id").notNull(),
  classId: int("class_id").notNull(),
  score: float("score").notNull(),
  tier: mysqlEnum("tier", ["low", "medium", "high", "critical"]).notNull(),
  featuresJson: json("features_json"),
  explanationJson: json("explanation_json"),
  computedAt: timestamp("computed_at").notNull().defaultNow(),
  modelVersion: text("model_version").notNull().default("1.0"),
});

export const riskAlertsTable = mysqlTable("risk_alerts", {
  id: serial("id").primaryKey(),
  riskScoreId: int("risk_score_id"),
  studentId: int("student_id").notNull(),
  classId: int("class_id").notNull(),
  alertType: text("alert_type").notNull(),
  triggeredAt: timestamp("triggered_at").notNull().defaultNow(),
  acknowledgedAt: timestamp("acknowledged_at"),
  acknowledgedById: int("acknowledged_by_id"),
  notificationSent: boolean("notification_sent").notNull().default(false),
  notificationSentAt: timestamp("notification_sent_at"),
});

export const insertRiskScoreSchema = createInsertSchema(riskScoresTable).omit({ id: true, computedAt: true });
export type InsertRiskScore = z.infer<typeof insertRiskScoreSchema>;
export type RiskScore = typeof riskScoresTable.$inferSelect;

export const insertRiskAlertSchema = createInsertSchema(riskAlertsTable).omit({ id: true, triggeredAt: true });
export type InsertRiskAlert = z.infer<typeof insertRiskAlertSchema>;
export type RiskAlert = typeof riskAlertsTable.$inferSelect;
