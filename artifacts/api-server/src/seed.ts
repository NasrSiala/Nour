import { db, usersTable, classesTable, studentsTable, subjectsTable, lessonsTable, attendanceSessionsTable, attendanceRecordsTable, riskScoresTable, riskAlertsTable, notificationsTable, type Class } from "@workspace/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "schoolbox_salt").digest("hex");
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function scoreToTier(score: number): "low" | "medium" | "high" | "critical" {
  if (score < 0.3) return "low";
  if (score < 0.6) return "medium";
  if (score < 0.8) return "high";
  return "critical";
}

async function seed() {
  console.log("Seeding database (Arabic data)...");

  await db.delete(notificationsTable);
  await db.delete(riskAlertsTable);
  await db.delete(riskScoresTable);
  await db.delete(attendanceRecordsTable);
  await db.delete(attendanceSessionsTable);
  await db.delete(lessonsTable);
  await db.delete(subjectsTable);
  await db.delete(studentsTable);
  await db.delete(classesTable);
  await db.delete(usersTable);

  const [adminRes] = await db.insert(usersTable).values({
    username: "admin",
    email: "admin@nour.edu",
    fullName: "المدير رشيد منصوري",
    hashedPassword: hashPassword("admin123"),
    role: "admin",
    isActive: true,
  });
  console.log("Created admin: admin");

  const teacherData = [
    { username: "teacher1", email: "teacher1@nour.edu", fullName: "الأستاذة فاطمة بن علي" },
    { username: "teacher2", email: "teacher2@nour.edu", fullName: "الأستاذ كريم بوعزيزي" },
    { username: "teacher3", email: "teacher3@nour.edu", fullName: "الأستاذة سلوى طرابلسي" },
    { username: "teacher4", email: "teacher4@nour.edu", fullName: "الأستاذ هشام نصر" },
  ];

  const teachers = [];
  for (const t of teacherData) {
    const [res] = await db.insert(usersTable).values({
      username: t.username,
      email: t.email,
      fullName: t.fullName,
      hashedPassword: hashPassword("teacher123"),
      role: "teacher",
      isActive: true,
    });
    teachers.push({ id: res.insertId, ...t });
  }
  console.log("Created teachers:", teachers.length);

  const classData = [
    { name: "الصف الثالث أ", gradeLevel: 3, homeroomTeacherId: teachers[0].id, academicYear: "2025-2026" },
    { name: "الصف الثالث ب", gradeLevel: 3, homeroomTeacherId: teachers[1].id, academicYear: "2025-2026" },
    { name: "الصف الرابع أ", gradeLevel: 4, homeroomTeacherId: teachers[2].id, academicYear: "2025-2026" },
    { name: "الصف الخامس أ", gradeLevel: 5, homeroomTeacherId: teachers[3].id, academicYear: "2025-2026" },
    { name: "الصف السادس أ", gradeLevel: 6, homeroomTeacherId: teachers[0].id, academicYear: "2025-2026" },
  ];

  const classes: Class[] = [];
  for (const c of classData) {
    const [res] = await db.insert(classesTable).values(c);
    classes.push({ id: res.insertId, ...c } as any);
  }
  console.log("Created classes:", classes.length);

  const firstNames = ["أحمد", "محمد", "فاطمة", "أميرة", "سناء", "يوسف", "رانيا", "كريم", "نور", "إيناس",
    "حمزة", "لينا", "سمير", "ريم", "عمر", "مريم", "طارق", "سيرين", "بلال", "أسماء",
    "وائل", "هالة", "فارس", "مالك"];
  const lastNames = ["بن سالم", "غربي", "منصوري", "طرابلسي", "بوعزيزي", "جلاصي", "معلول",
    "بالحاج", "شواشي", "فرشيشي", "همامي", "رياحي", "تليلي", "كسكس", "دريدي"];

  const allStudents = [];
  for (const cls of classes) {
    const count = cls.gradeLevel <= 4 ? 25 : 20;
    for (let i = 0; i < count; i++) {
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const gender = (i % 2 === 0 ? "male" : "female") as "male" | "female";
      const year = 2010 + Math.floor(Math.random() * 4);
      const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, "0");
      const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, "0");

      const [res] = await db.insert(studentsTable).values({
        firstName,
        lastName,
        gender,
        dateOfBirth: new Date(`${year}-${month}-${day}`),
        parentPhone: `+21620${String(Math.floor(Math.random() * 1000000)).padStart(6, "0")}`,
        parentName: `ولي أمر ${firstName} ${lastName}`,
        classId: cls.id,
        isActive: true,
        enrollmentDate: new Date("2025-09-01"),
      });
      allStudents.push({ id: res.insertId, firstName, lastName, classId: cls.id });
    }
  }
  console.log("Created students:", allStudents.length);

  const subjectData = [
    { code: "MATH-3", name: "الرياضيات", gradeLevel: 3, description: "الحساب والهندسة وحل المسائل" },
    { code: "FR-3", name: "اللغة الفرنسية", gradeLevel: 3, description: "القراءة والكتابة بالفرنسية" },
    { code: "ARABE-3", name: "اللغة العربية", gradeLevel: 3, description: "قواعد اللغة والأدب العربي" },
    { code: "SC-3", name: "العلوم", gradeLevel: 3, description: "علوم الحياة والأرض" },
    { code: "HIST-3", name: "التاريخ والجغرافيا", gradeLevel: 3, description: "تاريخ وجغرافيا تونس" },
    { code: "MATH-4", name: "الرياضيات", gradeLevel: 4, description: "الجبر والهندسة والإحصاء" },
    { code: "ARABE-4", name: "اللغة العربية", gradeLevel: 4, description: "التعبير والتحليل" },
  ];

  const subjects = [];
  for (const s of subjectData) {
    const [res] = await db.insert(subjectsTable).values({ ...s, isActive: true });
    subjects.push({ id: res.insertId, ...s });
  }
  console.log("Created subjects:", subjects.length);

  const lessonTitles = [
    "مقدمة وأهداف الدرس",
    "المفاهيم الأساسية",
    "تطبيقات عملية - الجزء الأول",
    "تطبيقات عملية - الجزء الثاني",
    "تمارين موجهة",
    "مراجعة وتثبيت",
    "تقييم تكويني",
    "تعميق المفاهيم",
    "أعمال تطبيقية",
    "خلاصة وحصيلة",
  ];
  const fileTypes: ("pdf" | "video" | "html" | "audio")[] = ["pdf", "video", "html", "audio"];

  for (const subject of subjects) {
    const numLessons = Math.floor(Math.random() * 6) + 4;
    for (let i = 0; i < numLessons; i++) {
      await db.insert(lessonsTable).values({
        subjectId: subject.id,
        title: `${lessonTitles[i % lessonTitles.length]} - ${subject.name}`,
        description: `محتوى تعليمي لمادة ${subject.name} - الحصة ${i + 1}`,
        orderIndex: i + 1,
        durationMinutes: [30, 45, 60, 90][Math.floor(Math.random() * 4)],
        fileType: fileTypes[Math.floor(Math.random() * 4)],
      });
    }
  }
  console.log("Created lessons");

  const today = new Date();
  const sessionDates: string[] = [];
  for (let d = 29; d >= 0; d--) {
    const date = new Date(today);
    date.setDate(today.getDate() - d);
    const day = date.getDay();
    if (day !== 0 && day !== 6) {
      sessionDates.push(date.toISOString().split("T")[0]);
    }
  }

  for (const cls of classes.slice(0, 3)) {
    const classStudents = allStudents.filter(s => s.classId === cls.id);
    for (const dateStr of sessionDates.slice(-20)) {
      const [sessionRes] = await db.insert(attendanceSessionsTable).values({
        classId: cls.id,
        teacherId: cls.homeroomTeacherId ?? teachers[0].id,
        sessionDate: new Date(dateStr),
        period: 1,
        isLocked: true,
      });
      const sessionId = sessionRes.insertId;

      let prevHash = "GENESIS";
      for (let si = 0; si < classStudents.length; si++) {
        const student = classStudents[si];
        const baseAbsentRate = si % 5 === 0 ? 0.4 : si % 3 === 0 ? 0.2 : 0.05;
        const rand = Math.random();
        let status: "present" | "absent" | "late" | "excused" = "present";
        if (rand < baseAbsentRate) status = "absent";
        else if (rand < baseAbsentRate + 0.05) status = "late";
        else if (rand < baseAbsentRate + 0.08) status = "excused";

        const recordedAt = new Date(dateStr + "T08:00:00Z");
        recordedAt.setMinutes(Math.floor(Math.random() * 30));

        const hashPayload = JSON.stringify({ prevHash, sessionId: sessionId, studentId: student.id, status, recordedAt: recordedAt.toISOString() });
        const hash = crypto.createHash("sha256").update(hashPayload).digest("hex");

        await db.insert(attendanceRecordsTable).values({
          sessionId: sessionId,
          studentId: student.id,
          status,
          prevHash: hash,
          recordedAt,
          recordedById: cls.homeroomTeacherId ?? teachers[0].id,
        });
        prevHash = hash;
      }
    }
  }
  console.log("Created attendance sessions");

  for (let si = 0; si < allStudents.length; si++) {
    const student = allStudents[si];
    if (!student.classId) continue;
    const base = si % 5 === 0 ? randomFloat(0.65, 0.95) : si % 3 === 0 ? randomFloat(0.35, 0.65) : randomFloat(0.05, 0.35);
    const score = Math.min(1, Math.max(0, base));
    const tier = scoreToTier(score);
    const explanation: string[] = [];
    if (score > 0.8) { explanation.push("غياب 8 أيام متتالية"); explanation.push("نسبة الغياب 55٪ هذا الشهر"); }
    else if (score > 0.6) { explanation.push("نسبة الغياب 32٪ هذا الشهر"); explanation.push("غياب 4 أيام متتالية"); }
    else if (score > 0.3) { explanation.push("نسبة الغياب 18٪ هذا الشهر"); }
    else { explanation.push("أنماط الحضور ضمن النطاق الطبيعي"); }

    const [riskScoreRes] = await db.insert(riskScoresTable).values({
      studentId: student.id,
      classId: student.classId,
      score,
      tier,
      featuresJson: { absentRate30d: score * 0.7, consecutiveAbsences: Math.floor(score * 12), totalRecentSessions: 22 },
      explanationJson: explanation,
    });

    if (tier === "high" || tier === "critical") {
      await db.insert(riskAlertsTable).values({
        riskScoreId: riskScoreRes.insertId,
        studentId: student.id,
        classId: student.classId,
        alertType: `risk_${tier}`,
        notificationSent: tier === "critical",
        acknowledgedAt: Math.random() > 0.5 ? new Date() : null,
        acknowledgedById: Math.random() > 0.5 ? teachers[0].id : null,
      });
    }
  }
  console.log("Created risk scores");

  for (let i = 0; i < 3; i++) {
    const classStudents = allStudents.filter(s => s.classId === classes[0].id);
    if (i < classStudents.length) {
      const s = classStudents[i];
      await db.insert(usersTable).values({
        username: `student${i + 1}`,
        email: `student${i + 1}@nour.edu`,
        fullName: `${s.firstName} ${s.lastName}`,
        hashedPassword: hashPassword("student123"),
        role: "student",
        classId: classes[0].id,
        isActive: true,
      });
    }
  }
  console.log("Created student users");

  console.log("\n Seed complete!");
  console.log("Login: admin/admin123  |  teacher1/teacher123  |  student1/student123");
  process.exit(0);
}

seed().catch(err => { console.error("Seed failed:", err); process.exit(1); });
