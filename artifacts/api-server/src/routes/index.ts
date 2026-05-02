import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import studentsRouter from "./students";
import classesRouter from "./classes";
import subjectsRouter from "./subjects";
import attendanceRouter from "./attendance";
import riskRouter from "./risk";
import analyticsRouter from "./analytics";
import notificationsRouter from "./notifications";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(studentsRouter);
router.use(classesRouter);
router.use(subjectsRouter);
router.use(attendanceRouter);
router.use(riskRouter);
router.use(analyticsRouter);
router.use(notificationsRouter);

export default router;
