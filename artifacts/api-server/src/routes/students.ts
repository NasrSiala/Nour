import { Router, type IRouter } from "express";
import { db, studentsTable, attendanceRecordsTable, attendanceSessionsTable, classesTable } from "@workspace/db";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { CreateStudentBody, UpdateStudentBody } from "@workspace/api-zod";

const router: IRouter = Router();

function formatStudent(student: typeof studentsTable.$inferSelect, className?: string | null, gradeLevel?: number | null) {
  return {
    id: student.id,
    firstName: student.firstName,
    lastName: student.lastName,
    nationalId: student.nationalId,
    dateOfBirth: student.dateOfBirth,
    gender: student.gender,
    parentPhone: student.parentPhone,
    parentName: student.parentName,
    classId: student.classId,
    className: className ?? null,
    gradeLevel: gradeLevel ?? null,
    isActive: student.isActive,
    enrollmentDate: student.enrollmentDate,
    createdAt: student.createdAt.toISOString(),
  };
}

router.get("/students", requireAuth, async (req, res): Promise<void> => {
  const { classId, isActive } = req.query;

  const conditions = [];
  if (classId) conditions.push(eq(studentsTable.classId, Number(classId)));
  if (isActive !== undefined) conditions.push(eq(studentsTable.isActive, isActive === "true"));

  const students = conditions.length > 0
    ? await db.select().from(studentsTable).where(and(...conditions)).orderBy(studentsTable.lastName, studentsTable.firstName)
    : await db.select().from(studentsTable).orderBy(studentsTable.lastName, studentsTable.firstName);

  // Get class info for all students
  const classIds = [...new Set(students.filter(s => s.classId).map(s => s.classId!))];
  const classes = classIds.length > 0
    ? await db.select().from(classesTable).where(sql`${classesTable.id} = ANY(ARRAY[${sql.join(classIds, sql`, `)}]::int[])`)
    : [];
  const classMap = new Map(classes.map(c => [c.id, c]));

  res.json(students.map(s => {
    const cls = s.classId ? classMap.get(s.classId) : null;
    return formatStudent(s, cls?.name, cls?.gradeLevel);
  }));
});

router.post("/students", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateStudentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [student] = await db.insert(studentsTable).values({
    ...parsed.data,
    enrollmentDate: new Date().toISOString().split("T")[0],
  }).returning();

  res.status(201).json(formatStudent(student));
});

router.get("/students/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, id));
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  let className: string | null = null;
  let gradeLevel: number | null = null;
  if (student.classId) {
    const [cls] = await db.select().from(classesTable).where(eq(classesTable.id, student.classId));
    className = cls?.name ?? null;
    gradeLevel = cls?.gradeLevel ?? null;
  }

  res.json(formatStudent(student, className, gradeLevel));
});

router.patch("/students/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const parsed = UpdateStudentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [student] = await db.update(studentsTable).set(parsed.data).where(eq(studentsTable.id, id)).returning();
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  res.json(formatStudent(student));
});

router.get("/students/:id/attendance-summary", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const studentId = parseInt(raw, 10);
  const { fromDate, toDate } = req.query;

  const conditions = [eq(attendanceRecordsTable.studentId, studentId)];

  if (fromDate && typeof fromDate === "string") {
    conditions.push(gte(attendanceRecordsTable.recordedAt, new Date(fromDate)));
  }
  if (toDate && typeof toDate === "string") {
    conditions.push(lte(attendanceRecordsTable.recordedAt, new Date(toDate)));
  }

  const records = await db.select().from(attendanceRecordsTable)
    .where(and(...conditions))
    .orderBy(desc(attendanceRecordsTable.recordedAt));

  const present = records.filter(r => r.status === "present").length;
  const absent = records.filter(r => r.status === "absent").length;
  const late = records.filter(r => r.status === "late").length;
  const excused = records.filter(r => r.status === "excused").length;
  const total = records.length;
  const attendanceRatePct = total > 0 ? Math.round((present + late) / total * 100 * 10) / 10 : 100;

  // Compute consecutive absences
  let consecutive = 0;
  for (const r of records) {
    if (r.status === "absent") consecutive++;
    else break;
  }

  const absentDates = records
    .filter(r => r.status === "absent")
    .map(r => r.recordedAt.toISOString().split("T")[0]);

  res.json({
    studentId,
    totalSessions: total,
    present,
    absent,
    late,
    excused,
    attendanceRatePct,
    consecutiveAbsences: consecutive,
    absentDates,
  });
});

export default router;
