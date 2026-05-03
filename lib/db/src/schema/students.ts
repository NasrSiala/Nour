import { mysqlEnum, mysqlTable, serial, text, varchar, int, boolean, timestamp, date } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const studentsTable = mysqlTable("students", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  nationalId: varchar("national_id", { length: 255 }),
  dateOfBirth: date("date_of_birth"),
  gender: mysqlEnum("gender", ["male", "female"]),
  parentPhone: text("parent_phone"),
  parentName: text("parent_name"),
  classId: int("class_id"),
  isActive: boolean("is_active").notNull().default(true),
  enrollmentDate: date("enrollment_date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertStudentSchema = createInsertSchema(studentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof studentsTable.$inferSelect;
