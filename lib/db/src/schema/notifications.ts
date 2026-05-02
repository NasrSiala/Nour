import { pgTable, serial, text, integer, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  templateKey: text("template_key").notNull(),
  templateVarsJson: json("template_vars_json"),
  lang: text("lang", { enum: ["fr", "ar"] }).notNull().default("fr"),
  status: text("status", { enum: ["pending", "sent", "failed"] }).notNull().default("pending"),
  transportUsed: text("transport_used"),
  retries: integer("retries").notNull().default(0),
  nextRetryAt: timestamp("next_retry_at", { withTimezone: true }),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notificationsTable).omit({ id: true, createdAt: true });
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notificationsTable.$inferSelect;
