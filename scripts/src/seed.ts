import { db, usersTable, classesTable, studentsTable, subjectsTable, lessonsTable, attendanceSessionsTable, attendanceRecordsTable, riskScoresTable, riskAlertsTable, notificationsTable } from "@workspace/db";
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
  console.log("Seeding database...");

  // Clear existing data in order
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

  // Create admin
  const [adminRes] = await db.insert(usersTable).values({
    username: "admin",
    fullName: "Directeur Rachid Mansouri",
    hashedPassword: hashPassword("admin123"),
    role: "admin",
    isActive: true,
  });
  const [admin] = await db.select().from(usersTable).where(eq(usersTable.id, adminRes.insertId));
  console.log("Created admin:", admin.username);

  // Create teachers
  const teacherData = [
    { username: "teacher1", fullName: "Mme Fatma Ben Ali", password: "teacher123" },
    { username: "teacher2", fullName: "M. Karim Bouazizi", password: "teacher123" },
    { username: "teacher3", fullName: "Mme Salwa Trabelsi", password: "teacher123" },
    { username: "teacher4", fullName: "M. Hichem Nasr", password: "teacher123" },
  ];

  const teachers = await Promise.all(teacherData.map(async t => {
    const [res] = await db.insert(usersTable).values({
      username: t.username,
      fullName: t.fullName,
      hashedPassword: hashPassword(t.password),
      role: "teacher",
      isActive: true,
    });
    const [teacher] = await db.select().from(usersTable).where(eq(usersTable.id, res.insertId));
    return teacher;
  }));
  console.log("Created teachers:", teachers.length);

  // Create classes
  const classData = [
    { name: "3ème A", gradeLevel: 3, homeroomTeacherId: teachers[0].id, academicYear: "2025-2026" },
    { name: "3ème B", gradeLevel: 3, homeroomTeacherId: teachers[1].id, academicYear: "2025-2026" },
    { name: "4ème A", gradeLevel: 4, homeroomTeacherId: teachers[2].id, academicYear: "2025-2026" },
    { name: "5ème A", gradeLevel: 5, homeroomTeacherId: teachers[3].id, academicYear: "2025-2026" },
    { name: "6ème A", gradeLevel: 6, homeroomTeacherId: teachers[0].id, academicYear: "2025-2026" },
  ];

  const classes = await Promise.all(classData.map(async c => {
    const [res] = await db.insert(classesTable).values(c);
    const [cls] = await db.select().from(classesTable).where(eq(classesTable.id, res.insertId));
    return cls;
  }));
  console.log("Created classes:", classes.length);

  // Update teachers with classId
  await db.update(usersTable).set({ classId: classes[0].id }).then(() => {});

  // Create students (25 per class for first 2 classes, 20 for others)
  const firstNames = ["Ahmed", "Mohamed", "Fatima", "Amira", "Sana", "Youssef", "Rania", "Karim", "Nour", "Ines",
    "Hamza", "Lina", "Samir", "Rim", "Omar", "Meriem", "Tarek", "Cyrine", "Bilel", "Asma",
    "Wael", "Hela", "Fares", "Syrine", "Malek"];
  const lastNames = ["Ben Salem", "Gharbi", "Mansouri", "Trabelsi", "Bouazizi", "Jelassi", "Maaloul",
    "Bel Hadj", "Chaouachi", "Ferchichi", "Hammami", "Riahi", "Tlili", "Keskes", "Dridi"];

  const allStudents = [];
  for (const cls of classes) {
    const count = cls.gradeLevel <= 4 ? 25 : 20;
    for (let i = 0; i < count; i++) {
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const gender = i % 2 === 0 ? "male" : "female";
      const dob = new Date(2010 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);

      const [res] = await db.insert(studentsTable).values({
        firstName,
        lastName,
        gender,
        dateOfBirth: dob,
        parentPhone: `+216${Math.floor(20000000 + Math.random() * 79999999)}`,
        parentName: `Parent de ${firstName} ${lastName}`,
        classId: cls.id,
        isActive: true,
        enrollmentDate: new Date("2025-09-01"),
      });

      const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, res.insertId));
      allStudents.push(student);
    }
  }
  console.log("Created students:", allStudents.length);

  // Create subjects
  const subjectData = [
    { code: "MATH-3", name: "Mathématiques", gradeLevel: 3, description: "Arithmétique, géométrie et résolution de problèmes" },
    { code: "FR-3", name: "Français", gradeLevel: 3, description: "Lecture, rédaction et grammaire française" },
    { code: "ARABE-3", name: "Arabe", gradeLevel: 3, description: "Langue et littérature arabe" },
    { code: "SC-3", name: "Sciences Naturelles", gradeLevel: 3, description: "Sciences de la vie et de la terre" },
    { code: "HIST-3", name: "Histoire-Géographie", gradeLevel: 3, description: "Histoire et géographie de la Tunisie et du monde" },
    { code: "MATH-4", name: "Mathématiques", gradeLevel: 4, description: "Algèbre, géométrie plane et statistiques" },
    { code: "FR-4", name: "Français", gradeLevel: 4, description: "Expression écrite et orale avancée" },
    { code: "ARABE-4", name: "Arabe", gradeLevel: 4, description: "Composition et analyse de textes" },
    { code: "SC-4", name: "Sciences", gradeLevel: 4, description: "Physique, chimie et biologie" },
    { code: "MATH-5", name: "Mathématiques", gradeLevel: 5, description: "Fonctions, équations et probabilités" },
    { code: "FR-5", name: "Français", gradeLevel: 5, description: "Littérature et communication" },
    { code: "ARABE-5", name: "Arabe", gradeLevel: 5, description: "Rhétorique et analyse littéraire" },
    { code: "MATH-6", name: "Mathématiques", gradeLevel: 6, description: "Préparation au baccalauréat — mathématiques" },
    { code: "FR-6", name: "Français", gradeLevel: 6, description: "Préparation aux examens officiels" },
    { code: "PHILO-6", name: "Philosophie", gradeLevel: 6, description: "Initiation à la pensée philosophique" },
  ];

  const subjects = await Promise.all(subjectData.map(async s => {
    const [res] = await db.insert(subjectsTable).values({ ...s, isActive: true });
    const [subject] = await db.select().from(subjectsTable).where(eq(subjectsTable.id, res.insertId));
    return subject;
  }));
  console.log("Created subjects:", subjects.length);

  // Create lessons
  const lessonTitles = [
    "Introduction et objectifs du cours",
    "Les concepts fondamentaux",
    "Applications pratiques — Partie 1",
    "Applications pratiques — Partie 2",
    "Exercices dirigés",
    "Révision et consolidation",
    "Évaluation formative",
    "Approfondissement des notions clés",
    "Travaux pratiques",
    "Synthèse et bilan",
  ];

  for (const subject of subjects) {
    const numLessons = Math.floor(Math.random() * 6) + 4;
    for (let i = 0; i < numLessons; i++) {
      const fileTypes: ("pdf" | "video" | "html" | "audio")[] = ["pdf", "video", "html", "audio"];
      await db.insert(lessonsTable).values({
        subjectId: subject.id,
        title: `${lessonTitles[i % lessonTitles.length]} — ${subject.name}`,
        description: `Contenu pédagogique pour ${subject.name} — séance ${i + 1}`,
        orderIndex: i + 1,
        durationMinutes: [30, 45, 60, 90][Math.floor(Math.random() * 4)],
        fileType: fileTypes[Math.floor(Math.random() * fileTypes.length)],
      });
    }
  }
  console.log("Created lessons");

  // Create attendance sessions for last 30 days
  const today = new Date();
  const sessionDates: string[] = [];
  for (let d = 29; d >= 0; d--) {
    const date = new Date(today);
    date.setDate(today.getDate() - d);
    const day = date.getDay();
    if (day !== 0 && day !== 6) { // Skip weekends
      sessionDates.push(date.toISOString().split("T")[0]);
    }
  }

  const classStudentMap = new Map<number, typeof allStudents>();
  for (const cls of classes) {
    classStudentMap.set(cls.id, allStudents.filter(s => s.classId === cls.id));
  }

  // Create sessions for each class, each day, period 1
  for (const cls of classes.slice(0, 3)) { // First 3 classes get full history
    const classStudents = classStudentMap.get(cls.id) ?? [];
    for (const dateStr of sessionDates.slice(-20)) { // Last 20 school days
      const [res] = await db.insert(attendanceSessionsTable).values({
        classId: cls.id,
        teacherId: cls.homeroomTeacherId ?? teachers[0].id,
        sessionDate: new Date(dateStr),
        period: 1,
        isLocked: true,
      });
      const [session] = await db.select().from(attendanceSessionsTable).where(eq(attendanceSessionsTable.id, res.insertId));

      let prevHash = "GENESIS";
      for (const student of classStudents) {
        // Create realistic attendance patterns — some students are chronic absentees
        const studentIndex = allStudents.indexOf(student);
        const baseAbsentRate = studentIndex % 5 === 0 ? 0.4 : studentIndex % 3 === 0 ? 0.2 : 0.05;
        const rand = Math.random();
        let status: "present" | "absent" | "late" | "excused" = "present";
        if (rand < baseAbsentRate) status = "absent";
        else if (rand < baseAbsentRate + 0.05) status = "late";
        else if (rand < baseAbsentRate + 0.08) status = "excused";

        const recordedAt = new Date(dateStr);
        recordedAt.setHours(8, Math.floor(Math.random() * 30));

        const hashPayload = JSON.stringify({ prevHash, sessionId: session.id, studentId: student.id, status, recordedAt: recordedAt.toISOString() });
        const hash = crypto.createHash("sha256").update(hashPayload).digest("hex");

        await db.insert(attendanceRecordsTable).values({
          sessionId: session.id,
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
  console.log("Created attendance sessions and records");

  // Create risk scores for all students
  for (const student of allStudents) {
    if (!student.classId) continue;
    const studentIndex = allStudents.indexOf(student);
    const baseScore = studentIndex % 5 === 0 ? randomFloat(0.65, 0.95) :
      studentIndex % 3 === 0 ? randomFloat(0.35, 0.65) :
      randomFloat(0.05, 0.35);

    const score = Math.min(1, Math.max(0, baseScore + randomFloat(-0.05, 0.05)));
    const tier = scoreToTier(score);
    const explanation = [];

    if (score > 0.8) {
      explanation.push("Absent 8 consecutive days");
      explanation.push("Absence rate 55% this month");
    } else if (score > 0.6) {
      explanation.push("Absence rate 32% this month");
      explanation.push("Absent 4 consecutive days");
    } else if (score > 0.3) {
      explanation.push("Absence rate 18% this month");
    } else {
      explanation.push("Attendance patterns are within normal range");
    }

    const [res] = await db.insert(riskScoresTable).values({
      studentId: student.id,
      classId: student.classId,
      score,
      tier,
      featuresJson: {
        absentRate30d: score * 0.7,
        consecutiveAbsences: Math.floor(score * 12),
        totalRecentSessions: 22,
      },
      explanationJson: explanation,
    });
    const [riskScore] = await db.select().from(riskScoresTable).where(eq(riskScoresTable.id, res.insertId));

    // Create alerts for high/critical risk students
    if (tier === "high" || tier === "critical") {
      await db.insert(riskAlertsTable).values({
        riskScoreId: riskScore.id,
        studentId: student.id,
        classId: student.classId,
        alertType: `risk_${tier}`,
        notificationSent: tier === "critical",
        acknowledgedAt: Math.random() > 0.5 ? new Date() : null,
        acknowledgedById: Math.random() > 0.5 ? teachers[0].id : null,
      });
    }
  }
  console.log("Created risk scores and alerts");

  // Create some notifications
  const atRiskStudents = allStudents.filter((_, i) => i % 5 === 0).slice(0, 10);
  for (const student of atRiskStudents) {
    await db.insert(notificationsTable).values({
      studentId: student.id,
      templateKey: "risk_alert_parent",
      lang: "fr",
      status: Math.random() > 0.3 ? "sent" : "pending",
      transportUsed: "sms",
      sentAt: new Date(),
      retries: 0,
    });
  }
  console.log("Created notifications");

  // Create student users for 3 students from first class
  const studentsForLogin = allStudents.filter(s => s.classId === classes[0].id).slice(0, 3);
  for (let i = 0; i < studentsForLogin.length; i++) {
    const s = studentsForLogin[i];
    await db.insert(usersTable).values({
      username: `student${i + 1}`,
      fullName: `${s.firstName} ${s.lastName}`,
      hashedPassword: hashPassword("student123"),
      role: "student",
      classId: classes[0].id,
      isActive: true,
    });
  }
  console.log("Created student users");

  console.log("\n✓ Seed complete!");
  console.log("Login credentials:");
  console.log("  Admin:   admin / admin123");
  console.log("  Teacher: teacher1 / teacher123");
  console.log("  Student: student1 / student123");

  process.exit(0);
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
