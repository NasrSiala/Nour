import { mysqlEnum, mysqlTable, serial, text, varchar, int, boolean, timestamp, date, uniqueIndex } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const attendanceSessionsTable = mysqlTable("attendance_sessions", {
  id: serial("id").primaryKey(),
  classId: int("class_id").notNull(),
  teacherId: int("teacher_id").notNull(),
  sessionDate: date("session_date").notNull(),
  period: int("period").notNull(),
  subjectId: int("subject_id"),
  isLocked: boolean("is_locked").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const attendanceRecordsTable = mysqlTable("attendance_records", {
  id: serial("id").primaryKey(),
  sessionId: int("session_id").notNull(),
  studentId: int("student_id").notNull(),
  status: mysqlEnum("status", ["present", "absent", "late", "excused"]).notNull(),
  note: text("note"),
  prevHash: text("prev_hash").notNull().default("GENESIS"),
  recordedAt: timestamp("recorded_at").notNull().defaultNow(),
  recordedById: int("recorded_by_id"),
});

export const insertAttendanceSessionSchema = createInsertSchema(attendanceSessionsTable).omit({ id: true, createdAt: true });
export type InsertAttendanceSession = z.infer<typeof insertAttendanceSessionSchema>;
export type AttendanceSession = typeof attendanceSessionsTable.$inferSelect;

export const insertAttendanceRecordSchema = createInsertSchema(attendanceRecordsTable).omit({ id: true, recordedAt: true });
export type InsertAttendanceRecord = z.infer<typeof insertAttendanceRecordSchema>;
export type AttendanceRecord = typeof attendanceRecordsTable.$inferSelect;
