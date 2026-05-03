import { Router, type IRouter } from "express";
import { db, subjectsTable, lessonsTable, usersTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth";
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

  const countMap = new Map(lessonCounts.map(l => [l.subjectId, Number(l.count)]));

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

  const [result] = await db.insert(subjectsTable).values(parsed.data);
  const [subject] = await db.select().from(subjectsTable).where(eq(subjectsTable.id, result.insertId));
  
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
    lessonCount: Number(lessonCount?.count ?? 0),
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

  const [result] = await db.insert(lessonsTable).values({ ...parsed.data, subjectId: id });
  const [lesson] = await db.select().from(lessonsTable).where(eq(lessonsTable.id, result.insertId));
  
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

  await db.update(subjectsTable).set(updates).where(eq(subjectsTable.id, id));
  const [updated] = await db.select().from(subjectsTable).where(eq(subjectsTable.id, id));
  
  if (!updated) { res.status(404).json({ error: "Subject not found" }); return; }

  const [lc] = await db.select({ count: count() }).from(lessonsTable).where(eq(lessonsTable.subjectId, id));
  res.json({
    ...updated,
    teacherId: updated.teacherId ?? null,
    teacherName: await getTeacherName(updated.teacherId),
    lessonCount: Number(lc?.count ?? 0),
    createdAt: updated.createdAt.toISOString(),
  });
});

router.delete("/subjects/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [toDelete] = await db.select().from(subjectsTable).where(eq(subjectsTable.id, id));
  if (!toDelete) { res.status(404).json({ error: "Subject not found" }); return; }
  
  await db.delete(subjectsTable).where(eq(subjectsTable.id, id));

  res.status(204).send();
});

router.post("/subjects/bulk", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const body = req.body as { rows?: unknown };
  if (!body || !Array.isArray(body.rows) || body.rows.length === 0 || body.rows.length > 500) {
    res.status(400).json({ error: "rows must be a non-empty array (max 500)" });
    return;
  }

  type BulkRow = { code: string; name: string; gradeLevel: number; description?: string | null; teacherUsername?: string | null };
  const rows = body.rows as BulkRow[];
  const results: { row: number; status: "created" | "skipped" | "error"; code?: string; reason?: string }[] = [];

  // Pre-load all teachers once for username→id lookup
  const teachers = await db.select({ id: usersTable.id, username: usersTable.username }).from(usersTable);
  const teacherMap = new Map(teachers.map(t => [t.username.toLowerCase(), t.id]));

  // Pre-load existing codes to detect duplicates
  const existing = await db.select({ code: subjectsTable.code }).from(subjectsTable);
  const existingCodes = new Set(existing.map(s => s.code.toUpperCase()));

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const code = row.code.toUpperCase().trim();

    if (existingCodes.has(code)) {
      results.push({ row: i + 1, status: "skipped", code, reason: "Code already exists" });
      continue;
    }

    try {
      const teacherId = row.teacherUsername
        ? (teacherMap.get(row.teacherUsername.toLowerCase()) ?? null)
        : null;

      await db.insert(subjectsTable).values({
        code,
        name: row.name.trim(),
        gradeLevel: row.gradeLevel,
        description: row.description?.trim() || null,
        teacherId,
      });

      existingCodes.add(code);
      results.push({ row: i + 1, status: "created", code });
    } catch {
      results.push({ row: i + 1, status: "error", code, reason: "Database error" });
    }
  }

  const created = results.filter(r => r.status === "created").length;
  const skipped = results.filter(r => r.status === "skipped").length;
  const errors = results.filter(r => r.status === "error").length;

  res.status(207).json({ created, skipped, errors, results });
});

router.patch("/lessons/:id/file", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { fileUrl, fileName } = req.body ?? {};

  if (typeof fileUrl !== "string" || !fileUrl) {
    res.status(400).json({ error: "fileUrl required" });
    return;
  }

  await db.update(lessonsTable)
    .set({ fileUrl, fileName: typeof fileName === "string" ? fileName : null })
    .where(eq(lessonsTable.id, id));

  const [updated] = await db.select().from(lessonsTable).where(eq(lessonsTable.id, id));
  if (!updated) { res.status(404).json({ error: "Lesson not found" }); return; }

  res.json({
    ...updated,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
});

export default router;
