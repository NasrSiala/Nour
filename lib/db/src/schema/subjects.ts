import { mysqlEnum, mysqlTable, serial, text, varchar, int, boolean, timestamp } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const subjectsTable = mysqlTable("subjects", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 255 }).notNull().unique(),
  name: text("name").notNull(),
  gradeLevel: int("grade_level").notNull(),
  description: text("description"),
  teacherId: int("teacher_id"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export const lessonsTable = mysqlTable("lessons", {
  id: serial("id").primaryKey(),
  subjectId: int("subject_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  orderIndex: int("order_index").notNull().default(0),
  durationMinutes: int("duration_minutes"),
  fileType: mysqlEnum("file_type", ["pdf", "video", "html", "audio"]),
  fileUrl: text("file_url"),
  fileName: text("file_name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSubjectSchema = createInsertSchema(subjectsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type Subject = typeof subjectsTable.$inferSelect;

export const insertLessonSchema = createInsertSchema(lessonsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type Lesson = typeof lessonsTable.$inferSelect;
