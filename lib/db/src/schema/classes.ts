import { mysqlTable, serial, text, varchar, int, timestamp } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const classesTable = mysqlTable("classes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  gradeLevel: int("grade_level").notNull(),
  homeroomTeacherId: int("homeroom_teacher_id"),
  academicYear: text("academic_year").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertClassSchema = createInsertSchema(classesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertClass = z.infer<typeof insertClassSchema>;
export type Class = typeof classesTable.$inferSelect;
