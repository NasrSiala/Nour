import { Router, type IRouter } from "express";
import { db, usersTable, classesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireRole, hashPassword } from "../middlewares/auth";
import { CreateUserBody, UpdateUserBody } from "@workspace/api-zod";

const router: IRouter = Router();

function formatUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    classId: user.classId,
    isActive: user.isActive,
    lastLogin: user.lastLogin?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

router.get("/users", requireAuth, async (req, res): Promise<void> => {
  const { role, classId } = req.query;
  let query = db.select().from(usersTable).$dynamic();

  const conditions = [];
  if (role && typeof role === "string") {
    conditions.push(eq(usersTable.role, role as "admin" | "teacher" | "student"));
  }
  if (classId) {
    conditions.push(eq(usersTable.classId, Number(classId)));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const users = await query;
  res.json(users.map(formatUser));
});

router.post("/users", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, fullName, password, role, classId } = parsed.data;
  const hashed = hashPassword(password);

  const [user] = await db.insert(usersTable).values({
    username,
    fullName,
    hashedPassword: hashed,
    role,
    classId: classId ?? null,
  }).returning();

  res.status(201).json(formatUser(user));
});

router.get("/users/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(formatUser(user));
});

router.patch("/users/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (parsed.data.fullName != null) updates.fullName = parsed.data.fullName;
  if (parsed.data.role != null) updates.role = parsed.data.role;
  if (parsed.data.classId !== undefined) updates.classId = parsed.data.classId;
  if (parsed.data.isActive != null) updates.isActive = parsed.data.isActive;

  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(formatUser(user));
});

router.patch("/users/:id/deactivate", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [user] = await db.update(usersTable).set({ isActive: false }).where(eq(usersTable.id, id)).returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(formatUser(user));
});

export default router;
