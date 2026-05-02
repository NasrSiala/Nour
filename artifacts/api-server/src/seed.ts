import { db, usersTable, classesTable, studentsTable, subjectsTable, lessonsTable, attendanceSessionsTable, attendanceRecordsTable, riskScoresTable, riskAlertsTable, notificationsTable, type Class } from "@workspace/db";
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

  const [admin] = await db.insert(usersTable).values({
    username: "admin",
    fullName: "Directeur Rachid Mansouri",
    hashedPassword: hashPassword("admin123"),
    role: "admin",
    isActive: true,
  }).returning();
  console.log("Created admin:", admin.username);

  const teacherData = [
    { username: "teacher1", fullName: "Mme Fatma Ben Ali" },
    { username: "teacher2", fullName: "M. Karim Bouazizi" },
    { username: "teacher3", fullName: "Mme Salwa Trabelsi" },
    { username: "teacher4", fullName: "M. Hichem Nasr" },
  ];

  const teachers = [];
  for (const t of teacherData) {
    const [teacher] = await db.insert(usersTable).values({
      username: t.username,
      fullName: t.fullName,
      hashedPassword: hashPassword("teacher123"),
      role: "teacher",
      isActive: true,
    }).returning();
    teachers.push(teacher);
  }
  console.log("Created teachers:", teachers.length);

  const classData = [
    { name: "3ème A", gradeLevel: 3, homeroomTeacherId: teachers[0].id, academicYear: "2025-2026" },
    { name: "3ème B", gradeLevel: 3, homeroomTeacherId: teachers[1].id, academicYear: "2025-2026" },
    { name: "4ème A", gradeLevel: 4, homeroomTeacherId: teachers[2].id, academicYear: "2025-2026" },
    { name: "5ème A", gradeLevel: 5, homeroomTeacherId: teachers[3].id, academicYear: "2025-2026" },
    { name: "6ème A", gradeLevel: 6, homeroomTeacherId: teachers[0].id, academicYear: "2025-2026" },
  ];

  const classes: Class[] = [];
  for (const c of classData) {
    const [cls] = await db.insert(classesTable).values(c).returning();
    classes.push(cls);
  }
  console.log("Created classes:", classes.length);

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
      const gender = (i % 2 === 0 ? "male" : "female") as "male" | "female";
      const year = 2010 + Math.floor(Math.random() * 4);
      const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, "0");
      const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, "0");

      const [student] = await db.insert(studentsTable).values({
        firstName,
        lastName,
        gender,
        dateOfBirth: `${year}-${month}-${day}`,
        parentPhone: `+21620${String(Math.floor(Math.random() * 1000000)).padStart(6, "0")}`,
        parentName: `Parent de ${firstName} ${lastName}`,
        classId: cls.id,
        isActive: true,
        enrollmentDate: "2025-09-01",
      }).returning();
      allStudents.push(student);
    }
  }
  console.log("Created students:", allStudents.length);

  const subjectData = [
    { code: "MATH-3", name: "Mathématiques", gradeLevel: 3, description: "Arithmétique, géométrie et résolution de problèmes" },
    { code: "FR-3", name: "Français", gradeLevel: 3, description: "Lecture, rédaction et grammaire française" },
    { code: "ARABE-3", name: "Arabe", gradeLevel: 3, description: "Langue et littérature arabe" },
    { code: "SC-3", name: "Sciences Naturelles", gradeLevel: 3, description: "Sciences de la vie et de la terre" },
    { code: "HIST-3", name: "Histoire-Géographie", gradeLevel: 3, description: "Histoire et géographie de la Tunisie" },
    { code: "MATH-4", name: "Mathématiques", gradeLevel: 4, description: "Algèbre, géométrie plane et statistiques" },
    { code: "FR-4", name: "Français", gradeLevel: 4, description: "Expression écrite et orale avancée" },
    { code: "ARABE-4", name: "Arabe", gradeLevel: 4, description: "Composition et analyse de textes" },
    { code: "SC-4", name: "Sciences", gradeLevel: 4, description: "Physique, chimie et biologie" },
    { code: "MATH-5", name: "Mathématiques", gradeLevel: 5, description: "Fonctions, équations et probabilités" },
    { code: "FR-5", name: "Français", gradeLevel: 5, description: "Littérature et communication" },
    { code: "ARABE-5", name: "Arabe", gradeLevel: 5, description: "Rhétorique et analyse littéraire" },
    { code: "MATH-6", name: "Mathématiques", gradeLevel: 6, description: "Préparation baccalauréat" },
    { code: "FR-6", name: "Français", gradeLevel: 6, description: "Préparation aux examens officiels" },
    { code: "PHILO-6", name: "Philosophie", gradeLevel: 6, description: "Initiation à la pensée philosophique" },
  ];

  const subjects = [];
  for (const s of subjectData) {
    const [subject] = await db.insert(subjectsTable).values({ ...s, isActive: true }).returning();
    subjects.push(subject);
  }
  console.log("Created subjects:", subjects.length);

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
  const fileTypes: ("pdf" | "video" | "html" | "audio")[] = ["pdf", "video", "html", "audio"];

  for (const subject of subjects) {
    const numLessons = Math.floor(Math.random() * 6) + 4;
    for (let i = 0; i < numLessons; i++) {
      await db.insert(lessonsTable).values({
        subjectId: subject.id,
        title: `${lessonTitles[i % lessonTitles.length]} — ${subject.name}`,
        description: `Contenu pédagogique pour ${subject.name} — séance ${i + 1}`,
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
      const [session] = await db.insert(attendanceSessionsTable).values({
        classId: cls.id,
        teacherId: cls.homeroomTeacherId ?? teachers[0].id,
        sessionDate: dateStr,
        period: 1,
        isLocked: true,
      }).returning();

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
  console.log("Created attendance sessions");

  for (let si = 0; si < allStudents.length; si++) {
    const student = allStudents[si];
    if (!student.classId) continue;
    const base = si % 5 === 0 ? randomFloat(0.65, 0.95) : si % 3 === 0 ? randomFloat(0.35, 0.65) : randomFloat(0.05, 0.35);
    const score = Math.min(1, Math.max(0, base));
    const tier = scoreToTier(score);
    const explanation: string[] = [];
    if (score > 0.8) { explanation.push("Absent 8 consecutive days"); explanation.push("Absence rate 55% this month"); }
    else if (score > 0.6) { explanation.push("Absence rate 32% this month"); explanation.push("Absent 4 consecutive days"); }
    else if (score > 0.3) { explanation.push("Absence rate 18% this month"); }
    else { explanation.push("Attendance patterns are within normal range"); }

    const [riskScore] = await db.insert(riskScoresTable).values({
      studentId: student.id,
      classId: student.classId,
      score,
      tier,
      featuresJson: { absentRate30d: score * 0.7, consecutiveAbsences: Math.floor(score * 12), totalRecentSessions: 22 },
      explanationJson: explanation,
    }).returning();

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
  console.log("Created risk scores");

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

  for (let i = 0; i < 3; i++) {
    const classStudents = allStudents.filter(s => s.classId === classes[0].id);
    if (i < classStudents.length) {
      const s = classStudents[i];
      await db.insert(usersTable).values({
        username: `student${i + 1}`,
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
