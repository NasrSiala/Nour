import { mysqlEnum, mysqlTable, serial, text, varchar, int, timestamp, json } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const notificationsTable = mysqlTable("notifications", {
  id: serial("id").primaryKey(),
  studentId: int("student_id").notNull(),
  templateKey: text("template_key").notNull(),
  templateVarsJson: json("template_vars_json"),
  lang: mysqlEnum("lang", ["fr", "ar"]).notNull().default("fr"),
  status: mysqlEnum("status", ["pending", "sent", "failed"]).notNull().default("pending"),
  transportUsed: text("transport_used"),
  retries: int("retries").notNull().default(0),
  nextRetryAt: timestamp("next_retry_at"),
  sentAt: timestamp("sent_at"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notificationsTable).omit({ id: true, createdAt: true });
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notificationsTable.$inferSelect;
