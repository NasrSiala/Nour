import { Router, type IRouter } from "express";
import { db, notificationsTable, studentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { SendNotificationBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/notifications", requireAuth, async (req, res): Promise<void> => {
  const { status } = req.query;

  const allNotifications = status && typeof status === "string" && status !== "null"
    ? await db.select().from(notificationsTable).where(eq(notificationsTable.status, status as "pending" | "sent" | "failed"))
    : await db.select().from(notificationsTable);

  const formatted = await Promise.all(allNotifications.map(async n => {
    const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, n.studentId));
    return {
      id: n.id,
      studentId: n.studentId,
      studentName: student ? `${student.firstName} ${student.lastName}` : null,
      templateKey: n.templateKey,
      lang: n.lang,
      status: n.status,
      transportUsed: n.transportUsed,
      retries: n.retries,
      sentAt: n.sentAt?.toISOString() ?? null,
      errorMessage: n.errorMessage,
      createdAt: n.createdAt.toISOString(),
    };
  }));

  res.json(formatted);
});

router.post("/notifications/:studentId/send", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.studentId) ? req.params.studentId[0] : req.params.studentId;
  const studentId = parseInt(raw, 10);

  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, studentId));
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  const parsed = SendNotificationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [notification] = await db.insert(notificationsTable).values({
    studentId,
    templateKey: parsed.data.templateKey,
    lang: parsed.data.lang,
    status: "pending",
    templateVarsJson: {
      studentName: `${student.firstName} ${student.lastName}`,
      parentName: student.parentName ?? "",
      parentPhone: student.parentPhone ?? "",
    },
  }).returning();

  res.json({
    id: notification.id,
    studentId: notification.studentId,
    studentName: `${student.firstName} ${student.lastName}`,
    templateKey: notification.templateKey,
    lang: notification.lang,
    status: notification.status,
    transportUsed: notification.transportUsed,
    retries: notification.retries,
    sentAt: notification.sentAt?.toISOString() ?? null,
    errorMessage: notification.errorMessage,
    createdAt: notification.createdAt.toISOString(),
  });
});

export default router;
