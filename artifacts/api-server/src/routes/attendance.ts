import { Router, type IRouter } from "express";
import { db, attendanceSessionsTable, attendanceRecordsTable, studentsTable, classesTable, subjectsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { CreateAttendanceSessionBody, RecordAttendanceBody } from "@workspace/api-zod";
import crypto from "crypto";

const router: IRouter = Router();

function computeHash(prevHash: string, sessionId: number, studentId: number, status: string, recordedAt: Date): string {
  const payload = JSON.stringify({ prevHash, sessionId, studentId, status, recordedAt: recordedAt.toISOString() });
  return crypto.createHash("sha256").update(payload).digest("hex");
}

async function formatSession(session: typeof attendanceSessionsTable.$inferSelect) {
  const [cls] = session.classId ? await db.select().from(classesTable).where(eq(classesTable.id, session.classId)) : [];
  const [teacher] = session.teacherId ? await db.select().from(usersTable).where(eq(usersTable.id, session.teacherId)) : [];
  const [subject] = session.subjectId ? await db.select().from(subjectsTable).where(eq(subjectsTable.id, session.subjectId)) : [];
  const records = await db.select().from(attendanceRecordsTable).where(eq(attendanceRecordsTable.sessionId, session.id));

  return {
    id: session.id,
    classId: session.classId,
    className: cls?.name ?? null,
    teacherId: session.teacherId,
    teacherName: teacher?.fullName ?? null,
    sessionDate: session.sessionDate,
    period: session.period,
    subjectId: session.subjectId,
    subjectName: subject?.name ?? null,
    isLocked: session.isLocked,
    recordCount: records.length,
    presentCount: records.filter(r => r.status === "present").length,
    absentCount: records.filter(r => r.status === "absent").length,
    createdAt: session.createdAt.toISOString(),
  };
}

router.get("/attendance/sessions", requireAuth, async (req, res): Promise<void> => {
  const { classId, sessionDate } = req.query;
  const conditions = [];
  if (classId) conditions.push(eq(attendanceSessionsTable.classId, Number(classId)));
  if (sessionDate && typeof sessionDate === "string") conditions.push(eq(attendanceSessionsTable.sessionDate, sessionDate));

  const sessions = conditions.length > 0
    ? await db.select().from(attendanceSessionsTable).where(and(...conditions))
    : await db.select().from(attendanceSessionsTable);

  const formatted = await Promise.all(sessions.map(formatSession));
  res.json(formatted);
});

router.post("/attendance/sessions", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateAttendanceSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const user = (req as typeof req & { user: { userId: number } }).user;

  const [session] = await db.insert(attendanceSessionsTable).values({
    ...parsed.data,
    teacherId: user.userId,
  }).returning();

  res.status(201).json(await formatSession(session));
});

router.get("/attendance/sessions/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [session] = await db.select().from(attendanceSessionsTable).where(eq(attendanceSessionsTable.id, id));
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const records = await db.select().from(attendanceRecordsTable).where(eq(attendanceRecordsTable.sessionId, id));
  const studentIds = [...new Set(records.map(r => r.studentId))];
  const students = studentIds.length > 0
    ? await Promise.all(studentIds.map(sid => db.select().from(studentsTable).where(eq(studentsTable.id, sid)).then(r => r[0])))
    : [];
  type StudentRow = typeof studentsTable.$inferSelect;
  const studentMap = new Map((students.filter(Boolean) as StudentRow[]).map(s => [s.id, s]));

  const formattedRecords = records.map(r => {
    const student = studentMap.get(r.studentId);
    return {
      id: r.id,
      sessionId: r.sessionId,
      studentId: r.studentId,
      studentName: student ? `${student.firstName} ${student.lastName}` : "Unknown",
      status: r.status,
      note: r.note,
      recordedAt: r.recordedAt.toISOString(),
    };
  });

  res.json({ session: await formatSession(session), records: formattedRecords });
});

router.post("/attendance/sessions/:id/records", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const sessionId = parseInt(raw, 10);

  const [session] = await db.select().from(attendanceSessionsTable).where(eq(attendanceSessionsTable.id, sessionId));
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  if (session.isLocked) {
    res.status(409).json({ error: "Session is locked" });
    return;
  }

  const parsed = RecordAttendanceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const user = (req as typeof req & { user: { userId: number } }).user;
  const existingRecords = await db.select().from(attendanceRecordsTable).where(eq(attendanceRecordsTable.sessionId, sessionId));
  const existingStudentIds = new Set(existingRecords.map(r => r.studentId));

  let recorded = 0;
  let skipped = 0;
  let prevHash = existingRecords.length > 0 ? existingRecords[existingRecords.length - 1].prevHash : "GENESIS";

  for (const input of parsed.data.records) {
    if (existingStudentIds.has(input.studentId)) {
      skipped++;
      continue;
    }
    const recordedAt = new Date();
    const hash = computeHash(prevHash, sessionId, input.studentId, input.status, recordedAt);
    await db.insert(attendanceRecordsTable).values({
      sessionId,
      studentId: input.studentId,
      status: input.status,
      note: input.note ?? null,
      prevHash: hash,
      recordedAt,
      recordedById: user.userId,
    });
    prevHash = hash;
    recorded++;
  }

  res.json({ sessionId, recorded, skipped });
});

router.patch("/attendance/sessions/:id/lock", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [session] = await db.update(attendanceSessionsTable)
    .set({ isLocked: true })
    .where(eq(attendanceSessionsTable.id, id))
    .returning();

  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  res.json(await formatSession(session));
});

router.get("/attendance/classes/:classId/sheet", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.classId) ? req.params.classId[0] : req.params.classId;
  const classId = parseInt(raw, 10);
  const { sessionDate } = req.query;

  if (!sessionDate || typeof sessionDate !== "string") {
    res.status(400).json({ error: "sessionDate is required" });
    return;
  }

  const [cls] = await db.select().from(classesTable).where(eq(classesTable.id, classId));
  if (!cls) {
    res.status(404).json({ error: "Class not found" });
    return;
  }

  const sessions = await db.select().from(attendanceSessionsTable)
    .where(and(eq(attendanceSessionsTable.classId, classId), eq(attendanceSessionsTable.sessionDate, sessionDate)));

  const detailedSessions = await Promise.all(sessions.map(async session => {
    const records = await db.select().from(attendanceRecordsTable).where(eq(attendanceRecordsTable.sessionId, session.id));
    const studentIds = [...new Set(records.map(r => r.studentId))];
    const students = studentIds.length > 0
      ? await Promise.all(studentIds.map(sid => db.select().from(studentsTable).where(eq(studentsTable.id, sid)).then(r => r[0])))
      : [];
    type StudentRow2 = typeof studentsTable.$inferSelect;
    const studentMap = new Map((students.filter(Boolean) as StudentRow2[]).map(s => [s.id, s]));

    return {
      session: await formatSession(session),
      records: records.map(r => {
        const student = studentMap.get(r.studentId);
        return {
          id: r.id,
          sessionId: r.sessionId,
          studentId: r.studentId,
          studentName: student ? `${student.firstName} ${student.lastName}` : "Unknown",
          status: r.status,
          note: r.note,
          recordedAt: r.recordedAt.toISOString(),
        };
      }),
    };
  }));

  res.json({
    classId,
    className: cls.name,
    sessionDate,
    sessions: detailedSessions,
  });
});

export default router;
