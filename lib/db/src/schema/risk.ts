import { pgTable, serial, text, integer, real, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const riskScoresTable = pgTable("risk_scores", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  classId: integer("class_id").notNull(),
  score: real("score").notNull(),
  tier: text("tier", { enum: ["low", "medium", "high", "critical"] }).notNull(),
  featuresJson: json("features_json"),
  explanationJson: json("explanation_json"),
  computedAt: timestamp("computed_at", { withTimezone: true }).notNull().defaultNow(),
  modelVersion: text("model_version").notNull().default("1.0"),
});

export const riskAlertsTable = pgTable("risk_alerts", {
  id: serial("id").primaryKey(),
  riskScoreId: integer("risk_score_id"),
  studentId: integer("student_id").notNull(),
  classId: integer("class_id").notNull(),
  alertType: text("alert_type").notNull(),
  triggeredAt: timestamp("triggered_at", { withTimezone: true }).notNull().defaultNow(),
  acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
  acknowledgedById: integer("acknowledged_by_id"),
  notificationSent: boolean("notification_sent").notNull().default(false),
  notificationSentAt: timestamp("notification_sent_at", { withTimezone: true }),
});

export const insertRiskScoreSchema = createInsertSchema(riskScoresTable).omit({ id: true, computedAt: true });
export type InsertRiskScore = z.infer<typeof insertRiskScoreSchema>;
export type RiskScore = typeof riskScoresTable.$inferSelect;

export const insertRiskAlertSchema = createInsertSchema(riskAlertsTable).omit({ id: true, triggeredAt: true });
export type InsertRiskAlert = z.infer<typeof insertRiskAlertSchema>;
export type RiskAlert = typeof riskAlertsTable.$inferSelect;
