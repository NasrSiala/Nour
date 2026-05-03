import { Router, type IRouter } from "express";
import { db, classesTable, studentsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { CreateClassBody } from "@workspace/api-zod";

const router: IRouter = Router();

async function formatClass(cls: typeof classesTable.$inferSelect) {
  let teacherName: string | null = null;
  if (cls.homeroomTeacherId) {
    const [teacher] = await db.select().from(usersTable).where(eq(usersTable.id, cls.homeroomTeacherId));
    teacherName = teacher?.fullName ?? null;
  }
  const students = await db.select().from(studentsTable).where(eq(studentsTable.classId, cls.id));
  return {
    id: cls.id,
    name: cls.name,
    gradeLevel: cls.gradeLevel,
    homeroomTeacherId: cls.homeroomTeacherId,
    teacherName,
    studentCount: students.length,
    academicYear: cls.academicYear,
    createdAt: cls.createdAt.toISOString(),
  };
}

router.get("/classes", requireAuth, async (_req, res): Promise<void> => {
  const classes = await db.select().from(classesTable).orderBy(classesTable.gradeLevel, classesTable.name);
  const formatted = await Promise.all(classes.map(formatClass));
  res.json(formatted);
});

router.post("/classes", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateClassBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [result] = await db.insert(classesTable).values(parsed.data);
  const [cls] = await db.select().from(classesTable).where(eq(classesTable.id, result.insertId));
  res.status(201).json(await formatClass(cls));
});

router.get("/classes/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [cls] = await db.select().from(classesTable).where(eq(classesTable.id, id));
  if (!cls) {
    res.status(404).json({ error: "Class not found" });
    return;
  }

  res.json(await formatClass(cls));
});

router.get("/classes/:id/students", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const students = await db.select().from(studentsTable)
    .where(eq(studentsTable.classId, id))
    .orderBy(studentsTable.lastName, studentsTable.firstName);

  const [cls] = await db.select().from(classesTable).where(eq(classesTable.id, id));

  res.json(students.map(s => ({
    id: s.id,
    firstName: s.firstName,
    lastName: s.lastName,
    nationalId: s.nationalId,
    dateOfBirth: s.dateOfBirth,
    gender: s.gender,
    parentPhone: s.parentPhone,
    parentName: s.parentName,
    classId: s.classId,
    className: cls?.name ?? null,
    gradeLevel: cls?.gradeLevel ?? null,
    isActive: s.isActive,
    enrollmentDate: s.enrollmentDate,
    createdAt: s.createdAt.toISOString(),
  })));
});

export default router;
