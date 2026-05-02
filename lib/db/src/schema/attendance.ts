import { pgTable, serial, text, integer, boolean, timestamp, date, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const attendanceSessionsTable = pgTable("attendance_sessions", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").notNull(),
  teacherId: integer("teacher_id").notNull(),
  sessionDate: date("session_date").notNull(),
  period: integer("period").notNull(),
  subjectId: integer("subject_id"),
  isLocked: boolean("is_locked").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const attendanceRecordsTable = pgTable("attendance_records", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  studentId: integer("student_id").notNull(),
  status: text("status", { enum: ["present", "absent", "late", "excused"] }).notNull(),
  note: text("note"),
  prevHash: text("prev_hash").notNull().default("GENESIS"),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
  recordedById: integer("recorded_by_id"),
});

export const insertAttendanceSessionSchema = createInsertSchema(attendanceSessionsTable).omit({ id: true, createdAt: true });
export type InsertAttendanceSession = z.infer<typeof insertAttendanceSessionSchema>;
export type AttendanceSession = typeof attendanceSessionsTable.$inferSelect;

export const insertAttendanceRecordSchema = createInsertSchema(attendanceRecordsTable).omit({ id: true, recordedAt: true });
export type InsertAttendanceRecord = z.infer<typeof insertAttendanceRecordSchema>;
export type AttendanceRecord = typeof attendanceRecordsTable.$inferSelect;
