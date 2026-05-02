import { Router, type IRouter } from "express";
import { db, subjectsTable, lessonsTable, usersTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { CreateSubjectBody, CreateLessonBody } from "@workspace/api-zod";

const router: IRouter = Router();

async function getTeacherName(teacherId: number | null | undefined): Promise<string | null> {
  if (!teacherId) return null;
  const [teacher] = await db.select({ fullName: usersTable.fullName }).from(usersTable).where(eq(usersTable.id, teacherId));
  return teacher?.fullName ?? null;
}

router.get("/subjects", requireAuth, async (req, res): Promise<void> => {
  const { gradeLevel } = req.query;

  const subjects = gradeLevel
    ? await db.select().from(subjectsTable).where(eq(subjectsTable.gradeLevel, Number(gradeLevel)))
    : await db.select().from(subjectsTable).orderBy(subjectsTable.gradeLevel, subjectsTable.name);

  const lessonCounts = await db.select({
    subjectId: lessonsTable.subjectId,
    count: count(),
  }).from(lessonsTable).groupBy(lessonsTable.subjectId);

  const countMap = new Map(lessonCounts.map(l => [l.subjectId, l.count]));

  const results = await Promise.all(subjects.map(async s => ({
    id: s.id,
    code: s.code,
    name: s.name,
    gradeLevel: s.gradeLevel,
    description: s.description,
    teacherId: s.teacherId ?? null,
    teacherName: await getTeacherName(s.teacherId),
    isActive: s.isActive,
    lessonCount: countMap.get(s.id) ?? 0,
    createdAt: s.createdAt.toISOString(),
  })));

  res.json(results);
});

router.post("/subjects", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateSubjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [subject] = await db.insert(subjectsTable).values(parsed.data).returning();
  res.status(201).json({
    ...subject,
    teacherId: subject.teacherId ?? null,
    teacherName: await getTeacherName(subject.teacherId),
    lessonCount: 0,
    createdAt: subject.createdAt.toISOString(),
  });
});

router.get("/subjects/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [subject] = await db.select().from(subjectsTable).where(eq(subjectsTable.id, id));
  if (!subject) {
    res.status(404).json({ error: "Subject not found" });
    return;
  }

  const [lessonCount] = await db.select({ count: count() }).from(lessonsTable).where(eq(lessonsTable.subjectId, id));

  res.json({
    ...subject,
    teacherId: subject.teacherId ?? null,
    teacherName: await getTeacherName(subject.teacherId),
    lessonCount: lessonCount?.count ?? 0,
    createdAt: subject.createdAt.toISOString(),
  });
});

router.get("/subjects/:id/lessons", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const lessons = await db.select().from(lessonsTable)
    .where(eq(lessonsTable.subjectId, id))
    .orderBy(lessonsTable.orderIndex);

  res.json(lessons.map(l => ({
    id: l.id,
    subjectId: l.subjectId,
    title: l.title,
    description: l.description,
    orderIndex: l.orderIndex,
    durationMinutes: l.durationMinutes,
    fileType: l.fileType,
    fileUrl: l.fileUrl,
    fileName: l.fileName,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  })));
});

router.post("/subjects/:id/lessons", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [subject] = await db.select().from(subjectsTable).where(eq(subjectsTable.id, id));
  if (!subject) {
    res.status(404).json({ error: "Subject not found" });
    return;
  }

  const parsed = CreateLessonBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [lesson] = await db.insert(lessonsTable).values({ ...parsed.data, subjectId: id }).returning();
  res.status(201).json({
    ...lesson,
    createdAt: lesson.createdAt.toISOString(),
    updatedAt: lesson.updatedAt.toISOString(),
  });
});

router.get("/lessons/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [lesson] = await db.select().from(lessonsTable).where(eq(lessonsTable.id, id));
  if (!lesson) {
    res.status(404).json({ error: "Lesson not found" });
    return;
  }

  res.json({
    ...lesson,
    createdAt: lesson.createdAt.toISOString(),
    updatedAt: lesson.updatedAt.toISOString(),
  });
});

router.patch("/subjects/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const { name, code, gradeLevel, description, isActive, teacherId } = req.body ?? {};
  const updates: Record<string, unknown> = {};
  if (typeof name === "string" && name.trim()) updates.name = name.trim();
  if (typeof code === "string" && code.trim()) updates.code = code.trim().toUpperCase();
  if (typeof gradeLevel === "number") updates.gradeLevel = gradeLevel;
  if ("description" in (req.body ?? {})) updates.description = description ?? null;
  if (typeof isActive === "boolean") updates.isActive = isActive;
  if ("teacherId" in (req.body ?? {})) updates.teacherId = teacherId ?? null;

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }

  const [updated] = await db.update(subjectsTable).set(updates).where(eq(subjectsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Subject not found" }); return; }

  const [lc] = await db.select({ count: count() }).from(lessonsTable).where(eq(lessonsTable.subjectId, id));
  res.json({
    ...updated,
    teacherId: updated.teacherId ?? null,
    teacherName: await getTeacherName(updated.teacherId),
    lessonCount: lc?.count ?? 0,
    createdAt: updated.createdAt.toISOString(),
  });
});

router.delete("/subjects/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [deleted] = await db.delete(subjectsTable).where(eq(subjectsTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Subject not found" }); return; }

  res.status(204).send();
});

router.patch("/lessons/:id/file", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { fileUrl, fileName } = req.body ?? {};

  if (typeof fileUrl !== "string" || !fileUrl) {
    res.status(400).json({ error: "fileUrl required" });
    return;
  }

  const [updated] = await db.update(lessonsTable)
    .set({ fileUrl, fileName: typeof fileName === "string" ? fileName : null })
    .where(eq(lessonsTable.id, id))
    .returning();

  if (!updated) { res.status(404).json({ error: "Lesson not found" }); return; }

  res.json({
    ...updated,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
});

export default router;
