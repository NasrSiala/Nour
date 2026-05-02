# SchoolBox Offline — Enterprise-Grade Project Roadmap

> **Theme:** Smart Solutions for Smarter Villages (ENIF 6.0)
> **Vision:** A self-contained, offline-first "school-in-a-box" edge platform that delivers digital education, tracks attendance, and predicts dropout risk — no internet required.
> **Stack:** Raspberry Pi 4 (or equivalent) · Flask/FastAPI · SQLite → PostgreSQL · Vue.js PWA · Twilio SMS · scikit-learn risk engine

---

## Table of Contents

1. [Project Architecture Overview](#architecture)
2. [Sprint 0 — Foundation & Tooling](#sprint-0)
3. [Sprint 1 — Core Offline Content Server](#sprint-1)
4. [Sprint 2 — Attendance & Enrollment System](#sprint-2)
5. [Sprint 3 — Teacher & Student Portals](#sprint-3)
6. [Sprint 4 — Dropout Risk Engine (ML)](#sprint-4)
7. [Sprint 5 — Parent Notification & SMS Gateway](#sprint-5)
8. [Sprint 6 — Admin Dashboard & Reporting](#sprint-6)
9. [Sprint 7 — Device Hardening & Deployment](#sprint-7)
10. [Sprint 8 — Sync & Multi-Node Federation](#sprint-8)
11. [Sprint 9 — QA, Load Testing & Pilot Rollout](#sprint-9)
12. [Sprint 10 — Monitoring, Ops & Handoff](#sprint-10)
13. [Cross-Cutting Concerns](#cross-cutting)
14. [Data Model Reference](#data-model)
15. [API Contract Reference](#api-contract)

---

## Architecture Overview {#architecture}

```
┌─────────────────────────────────────────────────────────┐
│                  SchoolBox Edge Device                   │
│  (Raspberry Pi 4 / Intel NUC / Refurb Laptop)           │
│                                                         │
│  ┌──────────────┐  ┌────────────────┐  ┌─────────────┐ │
│  │  Local Wi-Fi │  │  Content Store │  │  SQLite DB  │ │
│  │  Hotspot     │  │  (filesystem)  │  │  (primary)  │ │
│  │  (hostapd)   │  │  PDFs/Videos  │  │             │ │
│  └──────┬───────┘  └───────┬────────┘  └──────┬──────┘ │
│         │                  │                   │        │
│  ┌──────▼───────────────────▼───────────────────▼─────┐ │
│  │              FastAPI Application Server             │ │
│  │  /api/auth  /api/attendance  /api/content           │ │
│  │  /api/risk  /api/notify      /api/sync              │ │
│  └──────────────────────┬──────────────────────────────┘ │
│                         │                               │
│  ┌──────────────────────▼──────────────────────────────┐ │
│  │              Vue.js PWA (served locally)             │ │
│  │   Teacher Portal · Student Portal · Admin Dashboard  │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
         │  (when internet available — optional)
         ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│  Regional Hub Server    │     │  Twilio SMS Gateway      │
│  (PostgreSQL sync)      │     │  (GSM modem fallback)    │
└─────────────────────────┘     └─────────────────────────┘
```

**Key design principles:**
- **Offline-first by default.** Every feature must work with zero internet connectivity.
- **Low-resource target.** Runs on a Raspberry Pi 4 (4 GB RAM), serves 50 concurrent users on school Wi-Fi.
- **Progressive enhancement.** Internet availability unlocks sync, SMS, and cloud backup — but never blocks core operations.
- **Tamper-resistant data.** Attendance records are append-only with cryptographic hashing per session.

---

## Sprint 0 — Foundation & Tooling {#sprint-0}

**Duration:** 3 days
**Goal:** Repo, CI skeleton, dev environment, architecture decisions locked.

### Deliverables
- Monorepo structure initialized
- Docker Compose dev environment (mirrors Pi hardware)
- CI pipeline (GitHub Actions: lint → test → build)
- Architecture Decision Records (ADRs) written
- Database schema v0 migrated

### Tasks

| # | Task | Owner | Estimate |
|---|------|-------|----------|
| 0.1 | Initialize monorepo (backend/, frontend/, device/, docs/) | Lead Dev | 2h |
| 0.2 | Write ADR-001: SQLite vs PostgreSQL offline strategy | Architect | 2h |
| 0.3 | Write ADR-002: FastAPI vs Flask for embedded constraints | Architect | 1h |
| 0.4 | Docker Compose: Pi-emulation service + dev DB | DevOps | 3h |
| 0.5 | GitHub Actions: Python lint (ruff), test (pytest), frontend build | DevOps | 2h |
| 0.6 | Pre-commit hooks: ruff, black, mypy, prettier | Lead Dev | 1h |
| 0.7 | Alembic migration framework + schema v0 | Backend | 2h |
| 0.8 | Environment config (.env.example, pydantic Settings) | Backend | 1h |

### Folder Structure

```
schoolbox/
├── backend/
│   ├── app/
│   │   ├── api/          # route handlers
│   │   ├── core/         # config, security, events
│   │   ├── db/           # models, migrations, session
│   │   ├── schemas/      # pydantic request/response
│   │   ├── services/     # business logic
│   │   └── ml/           # risk engine
│   ├── tests/
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   │   ├── views/        # pages
│   │   ├── components/
│   │   ├── stores/       # Pinia state
│   │   ├── composables/
│   │   └── offline/      # service worker, sync queue
│   └── package.json
├── device/
│   ├── setup/            # Pi provisioning scripts
│   ├── hostapd/          # Wi-Fi hotspot config
│   └── systemd/          # service unit files
├── docs/
│   ├── adr/              # Architecture Decision Records
│   └── api/              # OpenAPI specs
└── docker-compose.yml
```

---

### 🤖 Implementation Prompt — Sprint 0

```
You are setting up the backend foundation for SchoolBox Offline, an offline-first
educational platform for rural schools in Tunisia. The backend is Python 3.11+
with FastAPI, SQLAlchemy 2.0 (async), and Alembic for migrations. The primary
database is SQLite for offline operation.

Task: Create the complete project scaffold including:

1. pyproject.toml with these dependencies:
   - fastapi==0.111.*
   - uvicorn[standard]==0.29.*
   - sqlalchemy==2.0.*
   - aiosqlite==0.20.*
   - alembic==1.13.*
   - pydantic-settings==2.2.*
   - python-jose[cryptography]==3.3.*
   - passlib[bcrypt]==1.7.*
   - python-multipart==0.0.*
   - httpx==0.27.*  (for testing)
   - pytest-asyncio==0.23.*
   - ruff, black, mypy (dev)

2. app/core/config.py using pydantic BaseSettings:
   - DATABASE_URL (default: sqlite+aiosqlite:///./schoolbox.db)
   - SECRET_KEY (required, no default)
   - ACCESS_TOKEN_EXPIRE_MINUTES (default: 480 — 8-hour school day)
   - DEVICE_ID (uuid, generated once at setup)
   - SCHOOL_CODE (string, e.g. "ENIS-SFAX-001")
   - OFFLINE_MODE (bool, default: True)
   - SMS_ENABLED (bool, default: False)
   - CONTENT_DIR (path, default: ./content)
   - MAX_UPLOAD_SIZE_MB (int, default: 500)

3. app/db/session.py with async SQLAlchemy engine and session factory.
   Use check_same_thread=False for SQLite. Add a get_db() dependency.

4. app/core/security.py:
   - Hash passwords with bcrypt
   - Create/verify JWT tokens (HS256)
   - get_current_user() FastAPI dependency that reads Bearer token

5. app/main.py:
   - FastAPI app with title="SchoolBox Offline API"
   - CORS middleware (allow all origins in OFFLINE_MODE since LAN only)
   - Lifespan handler that runs Alembic migrations on startup
   - Health check endpoint GET /health returning device_id, school_code,
     db_status, offline_mode, uptime_seconds
   - Mount static files from CONTENT_DIR at /content

6. Alembic env.py configured for async SQLite.

7. docker-compose.yml with:
   - backend service (port 8000)
   - frontend service (port 3000, placeholder nginx)
   - volumes for SQLite DB and content files

Return complete file contents for each file. Use type hints everywhere.
Add docstrings to all public functions. The code must pass mypy --strict.
```

---

## Sprint 1 — Core Offline Content Server {#sprint-1}

**Duration:** 5 days
**Goal:** Teachers can upload lessons (PDF, video, HTML), students browse and access them — all offline over local Wi-Fi.

### Deliverables
- Content upload API (chunked, resumable for large videos)
- Content browse & stream API
- Offline PWA shell with service worker caching
- Wi-Fi hotspot configuration scripts for Raspberry Pi

### Tasks

| # | Task | Owner | Estimate |
|---|------|-------|----------|
| 1.1 | Content DB model: Subject, Lesson, ContentFile | Backend | 3h |
| 1.2 | Upload API: chunked multipart, file type validation | Backend | 4h |
| 1.3 | Stream API: range-request support for video | Backend | 3h |
| 1.4 | Content search API: full-text search in SQLite FTS5 | Backend | 3h |
| 1.5 | Vue PWA shell + Vite config + Workbox service worker | Frontend | 4h |
| 1.6 | Content browser page (subject → lesson list → viewer) | Frontend | 5h |
| 1.7 | Offline cache strategy: content files cached on first access | Frontend | 3h |
| 1.8 | Pi Wi-Fi hotspot setup script (hostapd + dnsmasq) | Device | 3h |
| 1.9 | Unit tests: upload, stream, search | QA | 3h |

### Content Model

```
Subject
  id, code, name, grade_level, description, created_at

Lesson
  id, subject_id, title, description, order_index,
  duration_minutes, created_at, updated_at

ContentFile
  id, lesson_id, file_type (pdf|video|html|audio),
  filename, filepath, size_bytes, checksum_sha256,
  uploaded_at, uploaded_by
```

---

### 🤖 Implementation Prompt — Sprint 1 (Backend: Content API)

```
Build the content management API for SchoolBox Offline using FastAPI and SQLAlchemy 2.0 async.

Database models (app/db/models/content.py):

class Subject(Base):
    __tablename__ = "subjects"
    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(200))
    grade_level: Mapped[int]  # 1-13
    description: Mapped[str | None]
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(default=func.now())
    lessons: Mapped[list["Lesson"]] = relationship(back_populates="subject")

class Lesson(Base):
    [define similarly with subject_id FK, title, order_index, duration_minutes]

class ContentFile(Base):
    [id, lesson_id FK, file_type enum(pdf/video/html/audio),
     original_filename, stored_filename, filepath, size_bytes,
     checksum_sha256, mime_type, uploaded_at, uploaded_by_id FK]

API routes (app/api/content.py):

1. POST /api/v1/content/upload
   - Accepts multipart/form-data with fields:
     lesson_id: int, file: UploadFile
   - Validates file type by magic bytes (not extension):
     PDF: starts with %PDF, Video: check mime, HTML: text/html
   - Rejects files > MAX_UPLOAD_SIZE_MB
   - Generates unique stored_filename: {uuid4}.{ext}
   - Computes SHA-256 checksum during streaming write
   - Saves to CONTENT_DIR/{subject_code}/{lesson_id}/
   - Returns ContentFileResponse with download URL
   - Requires role: teacher or admin

2. GET /api/v1/content/subjects
   - Returns list of subjects with lesson count
   - Filter by: grade_level, is_active
   - Include: lesson_count, total_size_bytes

3. GET /api/v1/content/subjects/{subject_id}/lessons
   - Returns ordered lesson list
   - Each lesson includes: file list, duration, content types available

4. GET /api/v1/content/files/{file_id}/stream
   - Supports HTTP Range requests (for video seeking)
   - Sets appropriate Content-Type and Content-Disposition
   - Streams file in 1MB chunks to avoid memory pressure
   - Logs access (student_id, file_id, timestamp) for analytics

5. GET /api/v1/content/search?q={query}&grade={n}
   - Full-text search using SQLite FTS5
   - Create virtual FTS table on first migration:
     CREATE VIRTUAL TABLE content_fts USING fts5(title, description, content='lessons')
   - Returns ranked results with snippet highlighting

6. DELETE /api/v1/content/files/{file_id}
   - Soft delete (sets is_deleted=True, does NOT remove file)
   - Hard delete only via admin with ?permanent=true
   - Requires role: admin

Error handling:
- Return RFC 7807 Problem Details JSON for all errors
- Log all errors with structlog including device_id and school_code

Write complete implementations with full type hints. Include pytest-asyncio tests
using httpx.AsyncClient for each endpoint. Use factories (factory_boy) for test data.
```

---

### 🤖 Implementation Prompt — Sprint 1 (Frontend: PWA Shell + Content Browser)

```
Build the Vue 3 PWA frontend for SchoolBox Offline. Stack:
- Vue 3 + Composition API + <script setup>
- Vite 5 + vite-plugin-pwa (Workbox)
- Pinia for state management
- Vue Router 4
- Tailwind CSS (bundled, no CDN — offline!)
- Axios with offline queue interceptor

Requirements:

1. vite.config.ts with VitePWA plugin:
   - registerType: 'autoUpdate'
   - workbox strategies:
     * App shell (index.html, JS, CSS): CacheFirst, cache name: 'app-shell-v1'
     * API responses (GET /api/v1/content/**): NetworkFirst with 5s timeout,
       fallback to cache, cache name: 'api-cache-v1'
     * Content files (/content/**): CacheFirst, maxEntries: 200,
       maxAgeSeconds: 30 days, cache name: 'content-files-v1'
   - manifest: name="SchoolBox", theme_color="#1D9E75", display: standalone

2. src/stores/auth.ts (Pinia):
   - state: user (id, name, role, school_code), token, isAuthenticated
   - actions: login(username, password) → POST /api/v1/auth/token
   - persist token to localStorage
   - auto-logout on 401

3. src/stores/offline.ts (Pinia):
   - state: isOnline (navigator.onLine), syncQueue[], pendingCount
   - Track mutations made while offline
   - On reconnect: flush queue in FIFO order

4. src/composables/useContentBrowser.ts:
   - fetchSubjects(gradeLevel?) → paginated subject list
   - fetchLessons(subjectId) → lesson list with files
   - searchContent(query, grade?) → search results
   - Cache results in memory map (subjectId → lessons)

5. Pages to implement:
   - src/views/HomeView.vue: welcome screen, role-appropriate navigation
   - src/views/ContentBrowserView.vue:
     * Grade filter pills (Grade 1-9, secondary, etc.)
     * Subject grid cards (icon by subject type, lesson count badge)
     * Skeleton loaders while fetching
   - src/views/LessonView.vue:
     * Lesson detail: title, duration, description
     * File list with type icons (PDF=📄, Video=▶, HTML=🌐)
     * PDF viewer: embed tag with fallback download link
     * Video player: native <video> with controls, preload=metadata
     * "Cache for offline" button: triggers service worker to cache file
     * Download progress indicator

6. src/components/OfflineBanner.vue:
   - Fixed top banner: "Offline Mode — Content available from cache"
   - Only shows when navigator.onLine === false
   - Green when online, amber when offline

7. Axios instance (src/api/axios.ts):
   - Base URL: window.location.origin (works for any device on LAN)
   - Auth interceptor: attach Bearer token
   - Retry interceptor: retry GET requests 3x on network error
   - Offline queue interceptor: queue POST/PATCH/DELETE when offline,
     replay on reconnect

Use <Transition> animations between route changes.
All text must support Arabic right-to-left (add dir="rtl" toggle).
Ensure WCAG AA contrast ratios throughout.
```

---

## Sprint 2 — Attendance & Enrollment System {#sprint-2}

**Duration:** 5 days
**Goal:** Teachers record daily attendance per class. System stores immutable audit log. Works entirely offline.

### Deliverables
- Student enrollment data model and CRUD
- Daily attendance recording API (mark present/absent/late/excused)
- Attendance history and summary reports API
- Teacher attendance UI (fast bulk mark flow)

### Tasks

| # | Task | Owner | Estimate |
|---|------|-------|----------|
| 2.1 | Student, Class, Enrollment DB models | Backend | 3h |
| 2.2 | Attendance record model (append-only with hash chain) | Backend | 4h |
| 2.3 | Enrollment CRUD API + bulk import (CSV) | Backend | 4h |
| 2.4 | Attendance POST API: mark session, validate duplicates | Backend | 3h |
| 2.5 | Attendance summary API: by student, class, date range | Backend | 3h |
| 2.6 | Vue attendance sheet UI (grid: students × periods) | Frontend | 5h |
| 2.7 | Offline attendance queue: submit when online restored | Frontend | 3h |
| 2.8 | Attendance history page with calendar heatmap | Frontend | 3h |
| 2.9 | CSV import script for bulk student enrollment | Backend | 2h |
| 2.10 | Tests: attendance deduplication, hash chain integrity | QA | 3h |

### Data Model

```
School
  id, code, name, region, district, gps_lat, gps_lon

AcademicYear
  id, school_id, label (e.g. "2024-2025"), start_date, end_date

Class
  id, school_id, academic_year_id, name, grade_level,
  homeroom_teacher_id

Student
  id, school_id, national_id (nullable), first_name, last_name,
  date_of_birth, gender, parent_phone, parent_name,
  enrollment_date, is_active, notes

Enrollment
  id, student_id, class_id, enrolled_at, withdrawn_at (nullable)

AttendanceSession
  id, class_id, teacher_id, session_date, period (1-8),
  subject_id, created_at, is_locked (bool)

AttendanceRecord
  id, session_id, student_id, status (present/absent/late/excused),
  note, recorded_at, recorded_by_id
  prev_hash (SHA256 of previous record — hash chain for tamper detection)
```

### Hash Chain Logic

Each `AttendanceRecord` stores a `prev_hash` field. When inserting:
```python
import hashlib, json

def compute_record_hash(prev_hash: str, record_data: dict) -> str:
    payload = json.dumps({
        "prev_hash": prev_hash,
        "session_id": record_data["session_id"],
        "student_id": record_data["student_id"],
        "status": record_data["status"],
        "recorded_at": record_data["recorded_at"].isoformat(),
    }, sort_keys=True)
    return hashlib.sha256(payload.encode()).hexdigest()
```

This creates a tamper-evident chain. Any retroactive modification of a record invalidates all subsequent hashes — detectable on integrity audit.

---

### 🤖 Implementation Prompt — Sprint 2 (Attendance API)

```
Build the attendance system for SchoolBox Offline. This is the most critical
feature — data integrity is paramount. Implement the following:

1. Database models (app/db/models/attendance.py):
   Create all models from the data model above using SQLAlchemy 2.0 mapped_column
   syntax. Add these indexes:
   - AttendanceRecord: (session_id, student_id) UNIQUE — prevent duplicates
   - AttendanceRecord: (student_id, recorded_at) — for risk engine queries
   - AttendanceSession: (class_id, session_date, period) UNIQUE

2. Hash chain implementation (app/services/attendance.py):
   class AttendanceService:
     async def open_session(db, class_id, teacher_id, date, period, subject_id)
       → AttendanceSession
       - Check no duplicate session exists (class+date+period)
       - Create and return session (not locked)

     async def record_attendance(db, session_id, records: list[AttendanceInput])
       → list[AttendanceRecord]
       - records: [{student_id, status, note}]
       - Verify session is not locked
       - Verify all student_ids are enrolled in the session's class
       - Fetch the last record for this session to get prev_hash
         (use "GENESIS" as prev_hash for the very first record)
       - For each record: compute hash, insert atomically
       - Use a single DB transaction for all records in a batch
       - On constraint violation (duplicate): raise DuplicateAttendanceError

     async def lock_session(db, session_id, teacher_id)
       → AttendanceSession
       - Sets is_locked=True — no further modifications allowed
       - Requires teacher_id to match session owner OR admin role

     async def verify_chain_integrity(db, session_id) → IntegrityReport
       - Re-computes all hashes for the session
       - Returns: {session_id, record_count, is_valid, first_broken_at}

     async def get_student_summary(db, student_id, from_date, to_date)
       → StudentAttendanceSummary
       - Returns: {total_sessions, present, absent, late, excused,
                   attendance_rate_pct, consecutive_absences_current,
                   absent_dates: list[date]}

     async def get_class_summary(db, class_id, from_date, to_date)
       → ClassAttendanceSummary

3. API routes (app/api/attendance.py):

   POST /api/v1/attendance/sessions
   Body: {class_id, session_date (YYYY-MM-DD), period (1-8), subject_id}
   Returns: AttendanceSession with id

   POST /api/v1/attendance/sessions/{session_id}/records
   Body: {records: [{student_id, status, note}]}
   Idempotent: if records already exist for session, return existing (do not error)
   Returns: {session_id, recorded: int, skipped: int, records: [...]}

   PATCH /api/v1/attendance/sessions/{session_id}/lock
   Returns: {session_id, locked_at, locked_by}

   GET /api/v1/attendance/sessions/{session_id}/integrity
   Returns: IntegrityReport
   Note: expensive operation — add response caching (5 min TTL in memory)

   GET /api/v1/attendance/students/{student_id}/summary
   Query: from_date, to_date, class_id (optional)
   Returns: StudentAttendanceSummary

   GET /api/v1/attendance/classes/{class_id}/sheet
   Query: session_date (required)
   Returns: full attendance sheet for the day —
   {class, sessions: [{period, subject, records: [{student, status}]}]}

   POST /api/v1/attendance/import
   Accepts: multipart CSV upload
   CSV format: national_id,first_name,last_name,date_of_birth,gender,parent_phone
   Dry-run mode: ?dry_run=true returns validation report without inserting
   Returns: {inserted, updated, errors: [{row, reason}]}

4. Write pytest tests for:
   - Hash chain: modify a record directly in DB, verify integrity check catches it
   - Duplicate prevention: second POST to same session with same student
   - Lock enforcement: attempt to add record to locked session → 409
   - CSV import: valid CSV, CSV with duplicate national_ids, CSV with bad dates
```

---

## Sprint 3 — Teacher & Student Portals {#sprint-3}

**Duration:** 6 days
**Goal:** Role-based portals. Teachers manage classes and content. Students browse lessons and take quizzes.

### Deliverables
- Authentication: JWT with role-based access (admin / teacher / student)
- Teacher portal: class roster, attendance sheet UI, lesson uploader
- Student portal: lesson browser, quiz taker, personal progress view
- Quiz engine: question bank, auto-grading, offline submission queue

### Tasks

| # | Task | Owner | Estimate |
|---|------|-------|----------|
| 3.1 | User model with roles + device-local auth (no LDAP) | Backend | 3h |
| 3.2 | JWT auth API: login, refresh, logout (token blacklist in Redis/SQLite) | Backend | 3h |
| 3.3 | Quiz model: Question, Quiz, Attempt, Answer | Backend | 3h |
| 3.4 | Quiz CRUD + auto-grade API | Backend | 4h |
| 3.5 | Login page + auth store (Pinia) | Frontend | 2h |
| 3.6 | Teacher portal: dashboard, class selector, attendance sheet | Frontend | 6h |
| 3.7 | Teacher portal: lesson uploader with progress bar | Frontend | 3h |
| 3.8 | Student portal: lesson browser + PDF/video viewer | Frontend | 4h |
| 3.9 | Student portal: quiz player + offline answer queue | Frontend | 4h |
| 3.10 | Student portal: progress screen (attendance + quiz scores) | Frontend | 3h |
| 3.11 | Role guard middleware + route protection | Frontend | 2h |

### Quiz Engine Design

```
Quiz
  id, lesson_id, title, time_limit_minutes, passing_score_pct,
  max_attempts, is_published, created_by_id

Question
  id, quiz_id, order_index, question_text, question_type
  (multiple_choice / true_false / short_answer),
  points, explanation (shown after submission)

QuestionChoice (for multiple_choice)
  id, question_id, choice_text, is_correct, order_index

QuizAttempt
  id, quiz_id, student_id, started_at, submitted_at,
  score_pct, passed, time_taken_seconds

StudentAnswer
  id, attempt_id, question_id, selected_choice_id (nullable),
  text_answer (nullable), is_correct, points_earned
```

---

### 🤖 Implementation Prompt — Sprint 3 (Auth + Quiz Engine)

```
Implement authentication and the quiz engine for SchoolBox Offline.

PART A — Authentication (app/api/auth.py + app/services/auth.py):

1. User model:
   class User(Base):
     id, username (unique), hashed_password, full_name,
     role: Mapped[UserRole]  # Enum: admin / teacher / student
     class_id: Mapped[int | None]  # for students: their class
     is_active: Mapped[bool]
     last_login: Mapped[datetime | None]
     created_at: Mapped[datetime]

   class TokenBlacklist(Base):  # for logout
     jti: Mapped[str] = mapped_column(primary_key=True)  # JWT ID
     expires_at: Mapped[datetime]

2. Auth endpoints:
   POST /api/v1/auth/token
   Body: {username, password} (application/x-www-form-urlencoded for OAuth2 compat)
   Returns: {access_token, refresh_token, token_type: "bearer",
             expires_in: 28800, user: {id, full_name, role, class_id}}
   - Use python-jose to sign JWT with HS256
   - Include claims: sub (user_id), role, school_code, device_id, jti (uuid4), exp
   - access_token: 8h expiry (school day)
   - refresh_token: 30d expiry, stored in HttpOnly cookie

   POST /api/v1/auth/refresh
   Reads refresh token from HttpOnly cookie
   Issues new access_token (does not rotate refresh token)

   POST /api/v1/auth/logout
   Adds access token's jti to TokenBlacklist
   Clears refresh token cookie
   Background task: clean up expired blacklist entries

3. Dependencies (app/core/deps.py):
   get_current_user(token: str = Depends(oauth2_scheme)) → User
   get_current_teacher() → User (raises 403 if role != teacher|admin)
   get_current_admin() → User (raises 403 if role != admin)
   get_current_student() → User (raises 403 if role != student)

PART B — Quiz Engine (app/api/quiz.py + app/services/quiz.py):

1. Implement all models from the Quiz Engine Design above.

2. QuizService:
   async def create_quiz(db, lesson_id, teacher_id, data) → Quiz
   async def add_question(db, quiz_id, data) → Question
   async def publish_quiz(db, quiz_id) → Quiz
     - Validates: at least 1 question, all multiple_choice have ≥2 choices,
       exactly 1 correct choice per question
   async def start_attempt(db, quiz_id, student_id) → QuizAttempt
     - Check max_attempts not exceeded
     - Check quiz is_published
     - Create attempt with started_at=now()
   async def submit_attempt(db, attempt_id, answers: list[AnswerInput]) → QuizAttempt
     - Must submit within time_limit_minutes of started_at
     - For multiple_choice: compare selected_choice_id.is_correct
     - For true_false: same as multiple_choice
     - For short_answer: mark is_correct=None (requires manual grading)
     - Compute score_pct = sum(points_earned) / sum(max_points) * 100
     - Set passed = score_pct >= passing_score_pct
     - Return full result with per-question breakdown and explanations

3. API endpoints:
   POST /api/v1/quizzes (teacher)
   POST /api/v1/quizzes/{id}/questions (teacher)
   PATCH /api/v1/quizzes/{id}/publish (teacher)
   GET /api/v1/quizzes/{id} (student: only if published, hides correct answers)
   POST /api/v1/quizzes/{id}/attempts (student)
   POST /api/v1/quizzes/attempts/{id}/submit (student)
   GET /api/v1/quizzes/attempts/{id}/result (student)
     Returns: score, passed, per-question: {correct, points, explanation}

4. Offline queue (frontend integration note):
   Answers should be saved to IndexedDB during the quiz.
   On submit, if offline: store attempt in sync queue.
   On reconnect: POST the attempt. The backend must be idempotent:
   if attempt_id already has answers, return existing result without re-grading.
   Implement this idempotency using attempt_id as the deduplication key.
```

---

## Sprint 4 — Dropout Risk Engine (ML) {#sprint-4}

**Duration:** 6 days
**Goal:** The core differentiator. A lightweight ML model runs locally on the Pi, scoring each student's dropout risk daily using attendance patterns, quiz performance, and engagement signals.

### Deliverables
- Feature engineering pipeline (runs nightly via cron)
- Logistic Regression + rule-based risk scorer (runs on Pi CPU in <1s/student)
- Risk score history table + trend tracking
- Alert generation when risk crosses threshold
- Teacher dashboard: risk-sorted class list with explanation

### Risk Features

| Feature | Description | Weight Signal |
|---------|-------------|---------------|
| `absent_rate_30d` | % sessions absent in last 30 days | High |
| `consecutive_absences` | Current streak of consecutive absences | High |
| `absent_rate_trend` | Delta: 30d rate minus 60d rate | Medium |
| `quiz_avg_score_30d` | Average quiz score last 30 days | Medium |
| `quiz_pass_rate` | % quizzes passed (all time) | Medium |
| `content_access_days` | Unique days accessed content | Low |
| `days_since_last_access` | Days since last login/content view | Medium |
| `grade_level` | Encoded (higher grades = higher risk) | Low |
| `term_week` | Week of academic term (early/late) | Low |

### Risk Tiers

| Score | Tier | Color | Action |
|-------|------|-------|--------|
| 0.0 – 0.3 | Low | Green | No action |
| 0.3 – 0.6 | Medium | Amber | Teacher check-in flag |
| 0.6 – 0.8 | High | Orange | Parent SMS alert triggered |
| 0.8 – 1.0 | Critical | Red | Admin escalation + immediate SMS |

---

### 🤖 Implementation Prompt — Sprint 4 (Risk Engine)

```
Build the dropout risk prediction engine for SchoolBox Offline. This must run
entirely on a Raspberry Pi 4 (4 cores, 4GB RAM) with no GPU and no internet.
Model inference must complete in <1 second per student.

Constraints:
- scikit-learn 1.4+ only (no PyTorch, no transformers)
- Model must be serializable to a single .pkl file <10MB
- Feature computation runs entirely from SQLite queries
- All predictions stored in DB for audit trail

Implementation requirements:

1. Feature pipeline (app/ml/features.py):

   class FeatureExtractor:
     def __init__(self, db_session):
       self.db = db_session

     async def extract_features_for_student(
       self, student_id: int, as_of_date: date
     ) -> StudentFeatureVector:
       """
       Runs 5 SQL queries to compute all features.
       Returns a dataclass with all feature fields and metadata.
       All queries must use index-optimized paths (check EXPLAIN QUERY PLAN).
       """
       # Query 1: 30-day and 60-day absence rates
       # Query 2: consecutive absences (window function or iterative)
       # Query 3: quiz performance last 30 days
       # Query 4: content access pattern
       # Query 5: student metadata (grade, enrollment date)

       # Compute derived features:
       absent_rate_trend = absent_rate_30d - absent_rate_60d
       days_since_last_access = (as_of_date - last_access_date).days if last_access_date else 999

       return StudentFeatureVector(
         student_id=student_id,
         as_of_date=as_of_date,
         absent_rate_30d=...,
         consecutive_absences=...,
         absent_rate_trend=...,
         quiz_avg_score_30d=...,
         quiz_pass_rate=...,
         content_access_days_30d=...,
         days_since_last_access=...,
         grade_level=...,
         term_week=...,
       )

     async def extract_features_for_class(
       self, class_id: int, as_of_date: date
     ) -> list[StudentFeatureVector]:
       """Batch extraction for entire class. Run in parallel with asyncio.gather."""

2. Model trainer (app/ml/trainer.py):
   - NOTE: Training happens OFFLINE at project setup time using historical data
     from similar schools (synthetic or real). The trained model is shipped with
     the device image.
   - But implement a retraining endpoint for future data:

   class RiskModelTrainer:
     FEATURE_COLS = [
       "absent_rate_30d", "consecutive_absences", "absent_rate_trend",
       "quiz_avg_score_30d", "quiz_pass_rate", "content_access_days_30d",
       "days_since_last_access", "grade_level", "term_week"
     ]

     def train(self, X: pd.DataFrame, y: pd.Series) -> Pipeline:
       """
       Build sklearn Pipeline:
       1. SimpleImputer(strategy='median') — handle missing quiz data for new students
       2. StandardScaler()
       3. LogisticRegression(C=1.0, max_iter=1000, class_weight='balanced')
       Use cross_val_score(cv=5) to validate. Log metrics with structlog.
       Serialize with joblib.dump to models/risk_model.pkl
       """

     def generate_synthetic_training_data(self, n_samples=2000) -> tuple[pd.DataFrame, pd.Series]:
       """
       Generate synthetic training data for initial model:
       - Dropouts (label=1, ~25% of data):
           absent_rate_30d: Beta(5,2) → high values
           consecutive_absences: Poisson(8)
           quiz_avg_score_30d: Normal(40, 15), clipped 0-100
       - Non-dropouts (label=0):
           absent_rate_30d: Beta(1,8) → low values
           consecutive_absences: Poisson(1)
           quiz_avg_score_30d: Normal(72, 12), clipped 0-100
       Add 10% noise to each feature.
       """

3. Predictor (app/ml/predictor.py):

   class RiskPredictor:
     def __init__(self, model_path: str = "models/risk_model.pkl"):
       self.pipeline = joblib.load(model_path)
       self.feature_cols = RiskModelTrainer.FEATURE_COLS

     def predict_single(self, features: StudentFeatureVector) -> RiskPrediction:
       X = pd.DataFrame([asdict(features)])[self.feature_cols]
       score = float(self.pipeline.predict_proba(X)[0, 1])
       tier = self._score_to_tier(score)
       explanation = self._explain(features, score)
       return RiskPrediction(
         student_id=features.student_id,
         score=score,
         tier=tier,
         explanation=explanation,
         computed_at=datetime.utcnow(),
       )

     def _explain(self, features: StudentFeatureVector, score: float) -> list[str]:
       """
       Rule-based explanation (NOT SHAP — too slow for Pi):
       Return top 3 contributing factors as human-readable strings.
       Examples:
         "Absent 6 consecutive days" (if consecutive_absences > 5)
         "Absence rate 45% this month" (if absent_rate_30d > 0.4)
         "Quiz average below 40%" (if quiz_avg_score_30d < 40)
         "No content accessed in 2 weeks" (if days_since_last_access > 14)
       Return in Arabic AND French (both strings, frontend picks language).
       """

     def _score_to_tier(self, score: float) -> str:
       if score < 0.3: return "low"
       if score < 0.6: return "medium"
       if score < 0.8: return "high"
       return "critical"

4. RiskScore DB model (app/db/models/risk.py):
   class RiskScore(Base):
     id, student_id FK, class_id FK, score (Float),
     tier (String: low/medium/high/critical),
     features_json (JSON — snapshot of features used),
     explanation_json (JSON — list of explanation strings),
     computed_at, model_version (String)
     Index: (student_id, computed_at DESC)

   class RiskAlert(Base):
     id, risk_score_id FK, student_id FK, alert_type (String),
     triggered_at, acknowledged_at (nullable), acknowledged_by_id FK,
     notification_sent (bool), notification_sent_at (nullable)

5. Scheduled job (app/services/risk_scheduler.py):
   - APScheduler CronTrigger: run daily at 23:00 (after school)
   - For each active school class → for each enrolled student:
     extract features → predict → store RiskScore
   - Compare with previous score: if tier WORSENED → create RiskAlert
   - Critical tier: immediately trigger SMS notification (Sprint 5)
   - Log: total students scored, time taken, alert count

6. API endpoints (app/api/risk.py):
   GET /api/v1/risk/classes/{class_id}
   Returns all students sorted by risk score DESC.
   Include: student name, tier, score, top 2 explanation items, trend (↑↓→)
   Trend = compare today's tier to 7-days-ago tier.

   GET /api/v1/risk/students/{student_id}/history
   Returns last 30 daily risk scores as time series for sparkline chart.

   GET /api/v1/risk/alerts?acknowledged=false
   Returns unacknowledged alerts for current teacher's classes.

   PATCH /api/v1/risk/alerts/{alert_id}/acknowledge
   Marks alert acknowledged by current user.

   POST /api/v1/risk/run-now (admin only)
   Triggers immediate scoring run (for demo/testing).
   Returns: {students_scored, alerts_created, duration_seconds}
```

---

## Sprint 5 — Parent Notification & SMS Gateway {#sprint-5}

**Duration:** 4 days
**Goal:** When a student crosses a risk threshold, parents receive an SMS. Works via Twilio (when internet available) or a connected GSM USB modem (fully offline).

### Deliverables
- SMS service abstraction (Twilio / GSM modem / log-only)
- SMS template engine (Arabic + French)
- Notification dispatch queue with retry logic
- Notification history log

### Tasks

| # | Task | Owner | Estimate |
|---|------|-------|----------|
| 5.1 | SMS service interface + Twilio adapter | Backend | 3h |
| 5.2 | GSM modem adapter (gammu-smsd or AT commands via pyserial) | Backend | 4h |
| 5.3 | SMS template engine with variable substitution | Backend | 2h |
| 5.4 | Notification queue: retry on failure, exponential backoff | Backend | 3h |
| 5.5 | Notification history model + API | Backend | 2h |
| 5.6 | Admin UI: notification log, resend button | Frontend | 2h |
| 5.7 | Teacher UI: manual "notify parent" button on risk card | Frontend | 2h |

### SMS Templates

```
Absence Alert (French):
"Bonjour {parent_name}, votre enfant {student_name} a été absent(e) 
{absent_days} jours. Veuillez contacter l'école {school_name} au 
{school_phone}. — SchoolBox"

Absence Alert (Arabic):
"مرحباً {parent_name}، غاب طفلكم {student_name} لمدة {absent_days} أيام. 
يرجى التواصل مع مدرسة {school_name}. — SchoolBox"

Risk Alert (French):
"Bonjour {parent_name}, des difficultés scolaires ont été détectées 
chez {student_name}. Un rendez-vous avec {teacher_name} est recommandé."
```

---

### 🤖 Implementation Prompt — Sprint 5 (SMS Notification)

```
Build the notification system for SchoolBox Offline with two transport layers:
Twilio (internet) and GSM modem (offline). The system must work with EITHER
transport, automatically falling back to the other.

1. Abstract interface (app/services/sms/base.py):

   from abc import ABC, abstractmethod

   class SMSTransport(ABC):
     @abstractmethod
     async def send(self, to: str, body: str) -> SMSResult:
       """to: E.164 format (+21612345678). Returns {success, message_id, error}"""

     @abstractmethod
     async def health_check(self) -> bool:
       """Returns True if transport is available."""

2. Twilio adapter (app/services/sms/twilio_adapter.py):
   - Use httpx.AsyncClient (NOT the Twilio SDK — too heavy for Pi)
   - POST https://api.twilio.com/2010-04-01/Accounts/{SID}/Messages.json
   - Basic auth with (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
   - Body: From={TWILIO_FROM_NUMBER}, To={to}, Body={body}
   - health_check(): GET the account endpoint, return True if 200

3. GSM modem adapter (app/services/sms/gsm_adapter.py):
   - Use pyserial to communicate with USB GSM modem (/dev/ttyUSB0 default)
   - AT commands sequence:
     AT           → expect OK
     AT+CMGF=1    → set text mode
     AT+CMGS="{to}" → start message (wait for ">")
     {body}\x1A   → send body, terminate with Ctrl+Z
   - Parse response for "+CMGS:" confirmation
   - Timeout: 30 seconds per SMS
   - health_check(): send "AT" and expect "OK" within 5 seconds
   - Config: GSM_MODEM_PORT, GSM_MODEM_BAUD_RATE=9600

4. SMS router (app/services/sms/router.py):
   class SMSRouter:
     def __init__(self, twilio: TwilioAdapter, gsm: GSMAdapter):
       self.transports = [twilio, gsm]  # priority order

     async def send(self, to: str, body: str) -> SMSResult:
       for transport in self.transports:
         if await transport.health_check():
           result = await transport.send(to, body)
           if result.success:
             return result
       return SMSResult(success=False, error="All transports unavailable")

5. Template engine (app/services/sms/templates.py):
   TEMPLATES = {
     "absence_alert": {
       "fr": "Bonjour {parent_name}, ...",
       "ar": "مرحباً {parent_name}، ...",
     },
     "risk_alert": {...},
     "quiz_failure": {...},
   }

   def render_template(template_key: str, lang: str, **kwargs) -> str:
     template = TEMPLATES[template_key][lang]
     rendered = template.format(**kwargs)
     if len(rendered) > 160:  # single SMS limit
       rendered = rendered[:157] + "..."
     return rendered

6. Notification queue (app/services/notification_queue.py):
   class NotificationQueue:
     MAX_RETRIES = 3
     BACKOFF_SECONDS = [60, 300, 900]  # 1min, 5min, 15min

     async def enqueue(db, student_id, template_key, lang, **template_vars):
       """Creates NotificationJob record with status=pending"""

     async def process_pending(db, sms_router):
       """
       Called by APScheduler every 5 minutes.
       Fetch pending jobs where next_retry_at <= now() AND retries < MAX_RETRIES
       For each: render template → send → update status
       On failure: increment retries, set next_retry_at = now() + BACKOFF[retries]
       On max retries exceeded: set status=failed, alert admin
       """

   NotificationJob model:
     id, student_id FK, template_key, template_vars_json, lang,
     status (pending/sent/failed), transport_used (twilio/gsm/none),
     retries, next_retry_at, sent_at, error_message, created_at

7. Integration with risk engine:
   In risk_scheduler.py, after creating a RiskAlert:
   if alert.tier in ("high", "critical"):
     student = await get_student(db, alert.student_id)
     if student.parent_phone:
       await notification_queue.enqueue(
         db, student.id, "risk_alert", lang="fr",
         parent_name=student.parent_name,
         student_name=student.full_name,
         teacher_name=...,
         school_name=settings.SCHOOL_NAME,
       )

8. API endpoints:
   GET /api/v1/notifications?status=pending|sent|failed (admin)
   POST /api/v1/notifications/{student_id}/send-manual (teacher)
   Body: {template_key, lang}
   POST /api/v1/notifications/test-sms (admin)
   Body: {to, message} — sends a direct test message
```

---

## Sprint 6 — Admin Dashboard & Reporting {#sprint-6}

**Duration:** 5 days
**Goal:** School admin has a comprehensive view of school health, attendance trends, risk distribution, and can export reports as PDF.

### Deliverables
- Admin analytics API: school-wide KPIs
- Attendance trend charts (weekly, monthly)
- Risk distribution heatmap by class
- PDF report generation (local, no cloud)
- User management (create/deactivate teachers and students)

### Tasks

| # | Task | Owner | Estimate |
|---|------|-------|----------|
| 6.1 | Analytics aggregation service (cached in-memory) | Backend | 4h |
| 6.2 | PDF report generator using WeasyPrint | Backend | 4h |
| 6.3 | Admin dashboard page: KPI cards, charts | Frontend | 5h |
| 6.4 | Risk heatmap: class grid colored by avg risk | Frontend | 3h |
| 6.5 | Attendance trend chart: line chart (Chart.js, offline CDN) | Frontend | 3h |
| 6.6 | User management page: list, create, deactivate | Frontend | 3h |
| 6.7 | Report download flow: request → generate → download | Frontend | 2h |

### KPI Definitions

```
School Attendance Rate = present_sessions / total_sessions * 100 (last 30d)
Students at Risk = count where risk_tier in (high, critical) / total_active
Average Quiz Score = mean(quiz_attempt.score_pct) last 30d
Notification Response Rate = acknowledged_alerts / total_alerts (last 30d)
Content Engagement = unique students who accessed content / total students (last 7d)
```

---

### 🤖 Implementation Prompt — Sprint 6 (Analytics + PDF Reports)

```
Build the admin analytics and reporting system.

1. Analytics service (app/services/analytics.py):

   class AnalyticsService:
     CACHE_TTL = 300  # 5 minutes in-memory cache

     async def get_school_kpis(db, school_id, as_of=date.today()) -> SchoolKPIs:
       """
       Returns:
         attendance_rate_30d: float  # school-wide
         students_at_risk_count: int
         students_at_risk_pct: float
         avg_quiz_score_30d: float
         active_students: int
         content_engagement_7d: float  # pct of students who accessed content
         notifications_sent_30d: int
         alerts_acknowledged_rate: float
       Use a single CTE-heavy SQL query to compute all in one round trip.
       Cache result with key=f"school_kpis_{school_id}_{as_of}".
       """

     async def get_attendance_trend(db, school_id, weeks=8) -> list[WeeklyAttendance]:
       """
       Returns weekly attendance rate for past N weeks.
       Group by ISO week number.
       Result: [{week_label: "W14 2025", rate: 87.3, sessions: 240}]
       """

     async def get_risk_distribution_by_class(db, school_id) -> list[ClassRiskSummary]:
       """
       Returns for each class:
         {class_id, class_name, grade_level, teacher_name,
          risk_counts: {low:n, medium:n, high:n, critical:n},
          avg_risk_score: float}
       Sort by avg_risk_score DESC.
       """

     async def get_top_at_risk_students(db, school_id, limit=20) -> list[AtRiskStudent]:
       """
       Students with highest current risk score.
       Include: name, class, score, tier, top explanation, consecutive_absences,
       parent_phone (masked: +216 ** *** 789)
       """

2. PDF Report Generator (app/services/reports.py):

   Use WeasyPrint (pip install weasyprint) — renders HTML/CSS to PDF.
   No LaTeX, no reportlab — WeasyPrint produces professional output from HTML.

   class ReportGenerator:
     def generate_weekly_report(self, kpis, trends, risk_data) -> bytes:
       """
       Renders Jinja2 HTML template to PDF.
       Template: templates/reports/weekly_report.html
       Include:
         - Header: school name, date, device_id
         - KPI summary table
         - Attendance trend table (last 8 weeks)
         - Top 10 at-risk students table
         - Risk distribution by class table
         - Footer: "Generated by SchoolBox Offline"
       Return PDF bytes.
       """

     def generate_student_report(self, student, attendance_summary, risk_history,
                                  quiz_results) -> bytes:
       """Individual student report: attendance calendar, score trend, risk history."""

   HTML template guidelines:
   - Use @page { size: A4; margin: 2cm; }
   - Embed fonts as base64 (Arial/DejaVu — no Google Fonts CDN)
   - Use table-based layout (WeasyPrint flexbox support is partial)
   - Color-code risk tiers: green/amber/orange/red backgrounds
   - Print-safe: no shadows, no gradients

3. User management (app/api/admin.py):
   GET /api/v1/admin/users?role=teacher|student&class_id=n
   POST /api/v1/admin/users
   Body: {username, full_name, role, class_id, password}
   Auto-generate password if not provided, return it once (not stored plain)

   PATCH /api/v1/admin/users/{user_id}/deactivate
   Sets is_active=False. JWT tokens for this user are invalidated (add to blacklist).

   POST /api/v1/admin/users/{user_id}/reset-password
   Generates new random password, returns it once.

4. Report API:
   GET /api/v1/reports/weekly
   Query: week (ISO format, default current week)
   Computes all data → renders PDF → returns as application/pdf
   Cache PDF in /tmp for 1 hour (avoid regenerating on each request)

   GET /api/v1/reports/student/{student_id}
   Returns individual student PDF report.

5. Analytics API:
   GET /api/v1/analytics/kpis
   GET /api/v1/analytics/attendance-trend?weeks=8
   GET /api/v1/analytics/risk-by-class
   GET /api/v1/analytics/top-at-risk?limit=20
   All require admin role. All cached 5 minutes.
```

---

## Sprint 7 — Device Hardening & Deployment {#sprint-7}

**Duration:** 4 days
**Goal:** Turn a Raspberry Pi 4 into a reliable, auto-starting, self-healing school server that a non-technical teacher can set up in 15 minutes.

### Deliverables
- Automated Pi setup script (single command)
- systemd service units for all components
- Wi-Fi hotspot auto-start
- Watchdog: auto-restart services on failure
- Read-only root filesystem with persistent data partition
- Device provisioning QR code generator

### Tasks

| # | Task | Owner | Estimate |
|---|------|-------|----------|
| 7.1 | Pi setup script: installs deps, creates user, sets permissions | DevOps | 4h |
| 7.2 | systemd unit: schoolbox-api.service (with watchdog) | DevOps | 2h |
| 7.3 | systemd unit: schoolbox-frontend.service (nginx) | DevOps | 2h |
| 7.4 | hostapd + dnsmasq config: hotspot on wlan0 | DevOps | 3h |
| 7.5 | Captive portal redirect: any HTTP → schoolbox.local | DevOps | 2h |
| 7.6 | Nightly backup: SQLite → encrypted tarball on USB | DevOps | 2h |
| 7.7 | QR code generator for device Wi-Fi credentials | Backend | 1h |
| 7.8 | Health monitor: email/SMS admin if service down >5min | DevOps | 2h |

---

### 🤖 Implementation Prompt — Sprint 7 (Device Setup & Hardening)

```
Create the complete device setup and hardening scripts for Raspberry Pi 4
running Raspberry Pi OS Lite (64-bit, Bookworm).

1. device/setup/install.sh — main setup script:
   Run as root. Idempotent (safe to run multiple times).

   Steps:
   a) System packages:
      apt-get install -y python3.11 python3.11-venv python3-pip nginx hostapd dnsmasq
      apt-get install -y sqlite3 libsqlite3-dev weasyprint fonts-dejavu
      apt-get install -y gammu gammu-smsd  # for GSM modem (optional)
      apt-get install -y qrencode          # for QR code generation

   b) Create system user:
      useradd -r -s /bin/false -d /opt/schoolbox schoolbox
      mkdir -p /opt/schoolbox/{app,content,models,backups,logs}
      chown -R schoolbox:schoolbox /opt/schoolbox

   c) Python environment:
      python3.11 -m venv /opt/schoolbox/venv
      /opt/schoolbox/venv/bin/pip install -r /opt/schoolbox/app/requirements.txt

   d) Generate SECRET_KEY and DEVICE_ID if not present:
      if [ ! -f /opt/schoolbox/.env ]; then
        SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))")
        DEVICE_ID=$(python3 -c "import uuid; print(str(uuid.uuid4()))")
        Write /opt/schoolbox/.env with all required env vars
      fi

   e) Nginx config (/etc/nginx/sites-available/schoolbox):
      server {
        listen 80 default_server;
        server_name _;
        # Captive portal: redirect DNS probe URLs to app
        location /generate_204 { return 204; }
        location /hotspot-detect.html { return 200; }
        # Proxy API
        location /api/ { proxy_pass http://127.0.0.1:8000; }
        # Static frontend
        location / { root /opt/schoolbox/app/frontend/dist; try_files $uri $uri/ /index.html; }
        # Content files
        location /content/ { alias /opt/schoolbox/content/; sendfile on; }
      }

   f) Wi-Fi hotspot:
      /etc/hostapd/hostapd.conf:
        interface=wlan0
        driver=nl80211
        ssid=SchoolBox-{SCHOOL_CODE}
        hw_mode=g
        channel=6
        wpa=2
        wpa_passphrase={generated 12-char password}
        wpa_key_mgmt=WPA-PSK

      /etc/dnsmasq.conf:
        interface=wlan0
        dhcp-range=192.168.4.2,192.168.4.50,255.255.255.0,24h
        address=/#/192.168.4.1  # captive portal: all domains → box IP

      Set wlan0 static IP: 192.168.4.1

   g) Generate QR code for Wi-Fi credentials:
      qrencode -o /opt/schoolbox/app/frontend/dist/wifi-qr.png \
        "WIFI:T:WPA;S:SchoolBox-{SCHOOL_CODE};P:{password};;"

2. device/systemd/schoolbox-api.service:
   [Unit]
   Description=SchoolBox Offline API
   After=network.target
   [Service]
   Type=simple
   User=schoolbox
   WorkingDirectory=/opt/schoolbox/app/backend
   EnvironmentFile=/opt/schoolbox/.env
   ExecStart=/opt/schoolbox/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 2
   Restart=always
   RestartSec=5
   WatchdogSec=30  # systemd watchdog — kill if no ping in 30s
   StandardOutput=journal
   StandardError=journal
   [Install]
   WantedBy=multi-user.target

3. device/setup/backup.sh — nightly backup cron:
   - Runs at 02:00 via cron
   - sqlite3 /opt/schoolbox/db/schoolbox.db ".backup /tmp/backup_$(date +%Y%m%d).db"
   - tar czf /opt/schoolbox/backups/backup_$(date +%Y%m%d).tar.gz /tmp/backup_$(date +%Y%m%d).db
   - Encrypt with gpg (symmetric, passphrase from .env):
     gpg --batch --yes --passphrase "$BACKUP_PASSPHRASE" -c backup.tar.gz
   - Copy to USB if mounted: cp backup.tar.gz.gpg /media/schoolbox/BACKUP/
   - Delete local backups older than 7 days
   - Send SMS alert if backup fails (via the app's notification API)

4. device/setup/provision.sh — first-run provisioning wizard:
   Interactive script that:
   - Prompts: SCHOOL_CODE, SCHOOL_NAME, SCHOOL_PHONE, admin username/password
   - Writes /opt/schoolbox/.env
   - Calls the API to create the admin user (POST /api/v1/admin/bootstrap)
   - Prints Wi-Fi credentials and QR code path
   - Runs install.sh and starts all services
   Output at end:
   "╔══════════════════════════════════╗"
   "║  SchoolBox is ready!             ║"
   "║  Wi-Fi: SchoolBox-{CODE}         ║"
   "║  Password: {password}            ║"
   "║  URL: http://schoolbox.local     ║"
   "║  QR Code: /dist/wifi-qr.png      ║"
   "╚══════════════════════════════════╝"
```

---

## Sprint 8 — Sync & Multi-Node Federation {#sprint-8}

**Duration:** 5 days
**Goal:** When internet is occasionally available, devices sync attendance and risk data to a regional hub. Multiple schools can be monitored centrally.

### Deliverables
- Sync protocol: delta sync using `updated_at` watermarks
- Conflict resolution strategy (device wins for attendance, hub wins for model updates)
- Hub server (lightweight — same codebase, different config)
- Sync status UI showing last sync time and pending records

### Sync Strategy

```
DEVICE → HUB (push when internet available):
  - Attendance records (since last_sync_at)
  - Risk scores (since last_sync_at)
  - Content access logs
  - Student enrollment changes

HUB → DEVICE (pull when internet available):
  - Updated ML model (if model_version > device version)
  - New content packages (if teacher uploaded centrally)
  - Configuration updates (school settings, SMS templates)
```

### Conflict Resolution

| Entity | Strategy | Reason |
|--------|----------|--------|
| AttendanceRecord | Device wins (append-only) | Hash chain on device is authoritative |
| RiskScore | Hub wins if newer | Hub may have cross-school model |
| ContentFile | Last-write wins (by checksum) | Prevent duplicate uploads |
| Student | Hub wins (enrollment is managed centrally) | Avoid ghost students |

---

### 🤖 Implementation Prompt — Sprint 8 (Sync Protocol)

```
Implement the sync protocol for SchoolBox Offline devices to sync with a
regional hub server when internet is available.

1. Sync watermark model (app/db/models/sync.py):
   class SyncState(Base):
     id: 1  # singleton row
     device_id: str
     hub_url: str
     last_push_at: datetime | None
     last_pull_at: datetime | None
     last_sync_status: str  # success/failed/partial
     records_pushed_total: int
     records_pulled_total: int

   class SyncLog(Base):
     id, direction (push/pull), entity_type, records_count,
     started_at, completed_at, status, error_message

2. Sync service (app/services/sync.py):

   class SyncService:
     def __init__(self, hub_url: str, device_id: str, api_key: str):
       self.client = httpx.AsyncClient(
         base_url=hub_url,
         headers={"X-Device-ID": device_id, "X-API-Key": api_key},
         timeout=60,
       )

     async def push_attendance(self, db, since: datetime) -> SyncResult:
       """
       1. Query all AttendanceRecord WHERE recorded_at > since
          AND synced_to_hub = False (add this column to model)
       2. Serialize to list of dicts (exclude prev_hash — hub recomputes)
       3. POST /api/v1/sync/attendance to hub in batches of 500
       4. On 200: mark records as synced_to_hub=True, update SyncState.last_push_at
       5. On 409 conflict: log and skip (hub already has record)
       6. On network error: log, update SyncState.last_sync_status='failed', raise
       """

     async def pull_model_update(self, db) -> bool:
       """
       GET /api/v1/sync/model-version from hub
       If hub_version > local version (stored in SyncState):
         GET /api/v1/sync/model-download
         Verify SHA-256 of downloaded file
         Save to /opt/schoolbox/models/risk_model_new.pkl
         Atomic rename to risk_model.pkl
         Reload predictor in memory
         Update SyncState.model_version
         Return True (model updated)
       Return False (no update needed)
       """

     async def run_full_sync(self, db) -> FullSyncReport:
       """
       1. Check internet: GET https://1.1.1.1 with 5s timeout
       2. If no internet: skip and log "sync skipped - offline"
       3. Push: attendance, risk scores, access logs
       4. Pull: model update, content packages, config
       5. Update SyncState
       6. Return report with counts and status
       """

3. Sync scheduler: APScheduler every 6 hours (when internet check passes)
   Also trigger sync immediately when network-online event detected.

4. Hub API (same codebase, DEVICE_MODE=False):
   POST /api/v1/sync/attendance
   Accepts batch of attendance records from device.
   Deduplicates by (device_id, session_id, student_id, recorded_at).
   Stores in hub's PostgreSQL with source_device_id.

   GET /api/v1/sync/model-version
   Returns {version: "2025.04.15", sha256: "abc...", size_bytes: 4200000}

   GET /api/v1/sync/model-download
   Streams the .pkl file.

5. API endpoints for device:
   GET /api/v1/sync/status
   Returns: {last_push_at, last_pull_at, pending_records, model_version, hub_reachable}

   POST /api/v1/sync/trigger (admin)
   Runs full sync immediately. Returns FullSyncReport.

6. Frontend: sync status widget in admin header
   Shows: "Last sync: 2h ago ✓" or "Sync pending: 142 records"
   Button: "Sync Now" (calls POST /sync/trigger)
```

---

## Sprint 9 — QA, Load Testing & Pilot Rollout {#sprint-9}

**Duration:** 5 days
**Goal:** The system handles 50 concurrent users, all critical flows are tested end-to-end, and a real pilot school receives the device.

### Deliverables
- End-to-end test suite (Playwright)
- Load test report (Locust): 50 concurrent users on Pi hardware
- Security audit: auth, input validation, file upload limits
- Pilot deployment checklist
- User training guide (1 page per role: teacher, student, admin)

### Load Test Scenarios

```
Scenario 1: Morning attendance rush (50 concurrent teachers)
  - Each teacher: login → GET class roster → POST 30 attendance records
  - Target: all requests <2s p95

Scenario 2: Students accessing content simultaneously (50 students)
  - Each student: login → browse subjects → stream a PDF
  - Target: PDF load <3s p95 (served from nginx sendfile)

Scenario 3: Risk engine background job during school hours
  - Run risk scoring for 200 students while 30 concurrent users active
  - Target: no request latency degradation >20%
```

---

### 🤖 Implementation Prompt — Sprint 9 (Testing Suite)

```
Write the complete testing suite for SchoolBox Offline.

1. Backend unit tests (tests/unit/):

   tests/unit/test_attendance.py:
   - test_hash_chain_integrity: create 10 records, verify chain, modify record 5
     directly in DB, verify chain reports broken at record 5
   - test_duplicate_prevention: POST same session+student twice, expect 2nd returns
     existing record (idempotent, not error)
   - test_locked_session_rejection: lock session, attempt to add record → 409
   - test_attendance_summary: seed 90 days of attendance with known rates,
     verify summary matches

   tests/unit/test_risk_engine.py:
   - test_feature_extraction: seed known attendance/quiz data, verify features
     are computed correctly
   - test_prediction_tiers: test boundary scores (0.29, 0.31, 0.59, 0.61, 0.79, 0.81)
   - test_explanation_generation: verify explanations match input features
   - test_synthetic_data_quality: train on synthetic data, verify AUC > 0.75

   tests/unit/test_quiz_auto_grade.py:
   - test_multiple_choice_grading: all correct, some correct, none correct
   - test_time_limit_enforcement: submit after time_limit_minutes + 1 → 400
   - test_max_attempts: attempt limit reached → 403
   - test_idempotent_submission: submit same attempt_id twice → same result

2. API integration tests (tests/integration/):

   tests/integration/test_auth.py:
   - test_login_success, test_wrong_password (expect 401)
   - test_token_expiry (mock time), test_logout_blacklist
   - test_role_enforcement: teacher accessing admin endpoint → 403

   tests/integration/test_content.py:
   - test_upload_pdf (valid), test_upload_invalid_type (exe file)
   - test_range_request: GET file with Range: bytes=0-1023 → 206
   - test_full_text_search: upload lesson with known text, search for it

3. E2E tests (tests/e2e/) using Playwright + pytest-playwright:

   tests/e2e/test_teacher_flow.py:
   async def test_complete_attendance_flow(page):
     await page.goto("http://localhost/")
     await page.fill("#username", "teacher1")
     await page.fill("#password", "test123")
     await page.click("button[type=submit]")
     await page.wait_for_url("**/teacher/dashboard")
     await page.click("text=Class 6A")
     await page.click("text=Take Attendance")
     # Mark all students present
     await page.click("button.mark-all-present")
     await page.click("button.submit-attendance")
     await expect(page.locator(".success-toast")).to_contain_text("Attendance saved")

   tests/e2e/test_offline_flow.py:
   async def test_offline_quiz_submission(page, context):
     # Login and start quiz
     [login steps]
     await page.click("text=Quiz: Chapter 3")
     await page.click("text=Start Quiz")
     # Go offline
     await context.set_offline(True)
     # Answer and try to submit
     [answer steps]
     await page.click("button.submit-quiz")
     # Should queue, not error
     await expect(page.locator(".offline-banner")).to_be_visible()
     await expect(page.locator(".sync-queue-count")).to_contain_text("1")
     # Go online
     await context.set_offline(False)
     # Sync should auto-trigger
     await page.wait_for_selector(".quiz-result", timeout=10000)

4. Load tests (tests/load/locustfile.py):

   from locust import HttpUser, task, between

   class TeacherUser(HttpUser):
     wait_time = between(1, 3)

     def on_start(self):
       resp = self.client.post("/api/v1/auth/token",
         data={"username": "teacher1", "password": "test123"})
       self.token = resp.json()["access_token"]
       self.client.headers["Authorization"] = f"Bearer {self.token}"

     @task(3)
     def get_class_roster(self):
       self.client.get("/api/v1/attendance/classes/1/sheet?session_date=2025-04-15")

     @task(1)
     def submit_attendance(self):
       self.client.post("/api/v1/attendance/sessions", json={
         "class_id": 1, "session_date": "2025-04-15",
         "period": 1, "subject_id": 1
       })

   class StudentUser(HttpUser):
     wait_time = between(2, 5)

     @task(5)
     def browse_content(self):
       self.client.get("/api/v1/content/subjects")

     @task(2)
     def stream_file(self):
       self.client.get("/api/v1/content/files/1/stream",
         headers={"Range": "bytes=0-102399"})

   Run: locust -f locustfile.py --host http://192.168.4.1
          --users 50 --spawn-rate 5 --run-time 5m --headless
   Target: p95 < 2000ms for all endpoints

5. Security checks (add to CI):
   bandit -r backend/app/  # Python security linter
   safety check            # known CVE check in dependencies
   [Document any findings and mitigations]
```

---

## Sprint 10 — Monitoring, Ops & Handoff {#sprint-10}

**Duration:** 3 days
**Goal:** The device is maintainable by the school's regional IT coordinator without engineering support.

### Deliverables
- Structured logging (structlog) with log rotation
- System health endpoint with detailed diagnostics
- Admin "system status" page (disk, CPU, RAM, service status)
- Runbook: common problems and fixes
- Update mechanism: pull new code from USB stick

### Tasks

| # | Task | Owner | Estimate |
|---|------|-------|----------|
| 10.1 | Structured logging with structlog throughout backend | Backend | 3h |
| 10.2 | Log rotation: logrotate config for backend logs | DevOps | 1h |
| 10.3 | Detailed health endpoint: disk, RAM, CPU, DB size | Backend | 2h |
| 10.4 | System status page in admin frontend | Frontend | 3h |
| 10.5 | USB update script: validate → backup → apply → restart | DevOps | 3h |
| 10.6 | Runbook document (Markdown) | Tech Writer | 3h |

---

### 🤖 Implementation Prompt — Sprint 10 (Ops & Health Monitoring)

```
Build the operations and monitoring layer for SchoolBox Offline.

1. Enhanced health endpoint (app/api/health.py):

   GET /health — basic (no auth required)
   Returns: {status: "ok"|"degraded"|"down", version, uptime_seconds}

   GET /api/v1/health/detailed (admin only)
   Returns:
   {
     status: "ok"|"degraded"|"down",
     device_id: str,
     school_code: str,
     version: str,
     uptime_seconds: int,
     system: {
       cpu_percent: float,           # psutil.cpu_percent(interval=1)
       memory_used_mb: float,
       memory_total_mb: float,
       disk_used_gb: float,
       disk_total_gb: float,
       disk_free_pct: float,
       temperature_celsius: float,   # Pi CPU temp: open('/sys/class/thermal/...')
     },
     database: {
       size_mb: float,               # os.path.getsize(db_path) / 1e6
       wal_size_mb: float,           # WAL file size
       students_count: int,
       attendance_records_count: int,
       last_vacuum_at: datetime | None,
     },
     services: {
       api: "running",
       nginx: "running"|"stopped",   # check via systemctl is-active
       hotspot: "running"|"stopped",
       gsm_modem: "connected"|"disconnected"|"disabled",
     },
     sync: {
       last_push_at: datetime | None,
       pending_records: int,
       hub_reachable: bool,
     },
     content: {
       total_files: int,
       total_size_gb: float,
       free_space_gb: float,
     }
   }
   Status is "degraded" if disk_free_pct < 15 or any service stopped.
   Status is "down" if database unreachable or API itself is erroring.

2. Structured logging (app/core/logging.py):
   Configure structlog with:
   - JSON renderer for production
   - ConsoleRenderer for development (pretty colors)
   - Bound context: device_id, school_code on every log entry
   - Request middleware: log every request with method, path, status_code,
     duration_ms, user_id (if authenticated)
   - Error handler: log full traceback with structlog.exception()

   Usage in services:
   logger = structlog.get_logger().bind(service="attendance")
   logger.info("session_created", session_id=session.id, class_id=class_id)
   logger.warning("duplicate_attendance", session_id=session_id, student_id=student_id)
   logger.error("hash_chain_broken", session_id=session_id, at_record=record_id)

3. USB update script (device/setup/update.sh):
   - USB must contain: schoolbox-update-{version}.tar.gz + SHA256SUMS
   - Verify signature: sha256sum -c SHA256SUMS
   - Create timestamped backup: /opt/schoolbox/backups/pre-update-{date}.tar.gz
   - Stop services: systemctl stop schoolbox-api schoolbox-frontend
   - Extract update to /opt/schoolbox/app/
   - Run database migrations: alembic upgrade head
   - Restart services
   - Run health check: curl http://localhost:8000/health
   - If health check fails: ROLLBACK (restore from backup, restart old version)
   - Log entire process to /opt/schoolbox/logs/updates.log

4. Disk space guardian (background task, hourly):
   - If content disk usage > 85%: send admin SMS alert
   - If content disk usage > 95%: stop accepting new content uploads (503)
   - If WAL file > 100MB: run PRAGMA wal_checkpoint(TRUNCATE)
   - Auto-vacuum: PRAGMA auto_vacuum = INCREMENTAL, run PRAGMA incremental_vacuum
     weekly at 03:00
```

---

## Cross-Cutting Concerns {#cross-cutting}

### Security

```
Authentication:
  - JWT HS256 with 8-hour expiry
  - Refresh token in HttpOnly cookie (not localStorage)
  - Token blacklist for immediate logout/deactivation
  - Rate limiting: 10 login attempts per IP per 5 minutes (using SlowAPI)

Authorization:
  - Role-based: admin > teacher > student
  - Resource-based: teachers only access their own classes
  - Students only access their own data (not other students' risk scores)

Input Validation:
  - All inputs validated via Pydantic v2 with strict mode
  - File uploads: validate by magic bytes, reject executables
  - SQL injection: impossible via SQLAlchemy ORM (no raw SQL except FTS)
  - Path traversal: all file paths constructed server-side from UUIDs

Network:
  - All traffic over LAN (no public internet exposure in offline mode)
  - When sync is enabled: mTLS with hub (client cert per device)
  - Nginx enforces max request body size: 512MB for video uploads

Data Privacy:
  - Student national IDs stored encrypted (Fernet symmetric encryption)
  - Parent phone numbers masked in API responses (except admin)
  - Audit log: all admin actions logged with actor, action, timestamp
```

### Internationalization (i18n)

```
Supported languages: French (default), Arabic (RTL)
Implementation:
  - Backend: error messages in both languages (return lang-keyed dict)
  - Frontend: vue-i18n with locale files fr.json and ar.json
  - RTL support: <html dir="rtl"> toggle, CSS logical properties throughout
  - SMS templates: both languages (user preference stored in Student model)
  - PDF reports: WeasyPrint supports Arabic with DejaVu fonts
```

### Performance Targets (on Raspberry Pi 4)

```
API response times (p95, 50 concurrent users):
  GET /api/v1/content/subjects        < 200ms
  GET /api/v1/attendance/classes/.../sheet < 500ms
  POST /api/v1/attendance/.../records < 800ms
  GET /api/v1/risk/classes/{id}       < 1000ms
  Risk engine (200 students)          < 60 seconds (background job)
  PDF report generation               < 10 seconds

Memory budget:
  FastAPI (2 workers)    ~200MB
  Risk model (loaded)    ~50MB
  SQLite WAL             ~20MB
  Nginx                  ~20MB
  OS + other             ~300MB
  Total                  ~590MB / 4000MB available ✓
```

---

## Data Model Reference {#data-model}

### Complete Entity Relationship Summary

```
School (1) ────── (N) AcademicYear
School (1) ────── (N) Class
School (1) ────── (N) Student
Class (1) ─────── (N) Enrollment ──── (1) Student
Class (1) ─────── (N) AttendanceSession
AttendanceSession (1) ── (N) AttendanceRecord ── (1) Student
Class (1) ─────── (1) User [homeroom_teacher]
Lesson (1) ────── (N) ContentFile
Lesson (1) ────── (N) Quiz
Quiz (1) ──────── (N) Question ──── (N) QuestionChoice
Quiz (1) ──────── (N) QuizAttempt ─ (1) Student
QuizAttempt (1) ─ (N) StudentAnswer ─ (1) Question
Student (1) ───── (N) RiskScore
RiskScore (1) ─── (1) RiskAlert ──── (N) NotificationJob
```

### Alembic Migration Order

```
001_create_core_tables.py        # School, AcademicYear, User
002_create_enrollment.py         # Class, Student, Enrollment
003_create_content.py            # Subject, Lesson, ContentFile
004_create_attendance.py         # AttendanceSession, AttendanceRecord
005_create_quiz.py               # Quiz, Question, Choice, Attempt, Answer
006_create_risk.py               # RiskScore, RiskAlert
007_create_notifications.py      # NotificationJob
008_create_sync.py               # SyncState, SyncLog
009_create_fts_index.py          # SQLite FTS5 virtual table
010_create_token_blacklist.py    # TokenBlacklist
```

---

## API Contract Reference {#api-contract}

### Base URL
All API endpoints: `http://192.168.4.1/api/v1/` (device LAN IP)

### Authentication
All endpoints except `/auth/token` and `/health` require:
`Authorization: Bearer {access_token}`

### Standard Response Envelope

```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "per_page": 50,
    "total": 142
  }
}
```

### Standard Error Response (RFC 7807)

```json
{
  "type": "https://schoolbox.local/errors/validation-error",
  "title": "Validation Error",
  "status": 422,
  "detail": "session_date must be a valid date in YYYY-MM-DD format",
  "instance": "/api/v1/attendance/sessions",
  "errors": [
    {"field": "session_date", "message": "Invalid format"}
  ]
}
```

### Key Endpoint Summary

| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | /auth/token | public | Login |
| POST | /auth/refresh | any | Refresh access token |
| POST | /auth/logout | any | Logout |
| GET | /content/subjects | any | List subjects |
| POST | /content/upload | teacher | Upload content file |
| GET | /content/files/{id}/stream | student | Stream content |
| GET | /content/search | any | Full-text search |
| POST | /attendance/sessions | teacher | Open attendance session |
| POST | /attendance/sessions/{id}/records | teacher | Submit records |
| PATCH | /attendance/sessions/{id}/lock | teacher | Lock session |
| GET | /attendance/students/{id}/summary | teacher | Student summary |
| GET | /risk/classes/{id} | teacher | Class risk list |
| GET | /risk/students/{id}/history | teacher | Student risk trend |
| POST | /quizzes | teacher | Create quiz |
| POST | /quizzes/{id}/attempts | student | Start quiz |
| POST | /quizzes/attempts/{id}/submit | student | Submit answers |
| GET | /analytics/kpis | admin | School KPIs |
| GET | /reports/weekly | admin | Download weekly PDF |
| GET | /admin/users | admin | List users |
| POST | /admin/users | admin | Create user |
| POST | /sync/trigger | admin | Manual sync to hub |
| GET | /health/detailed | admin | System diagnostics |

---

## Appendix: Technology Decision Log

| Decision | Choice | Rejected | Reason |
|----------|--------|----------|--------|
| Backend framework | FastAPI | Flask, Django | Async-native, auto OpenAPI, type safety |
| Database (primary) | SQLite + aiosqlite | PostgreSQL | No install needed on Pi, sufficient for 1 school |
| Database (hub) | PostgreSQL | MySQL | JSON support, better for multi-school analytics |
| ML framework | scikit-learn | PyTorch, TensorFlow | Pi CPU only, model <10MB, fast inference |
| SMS transport 1 | Twilio HTTP API | Twilio SDK | SDK too heavy for Pi; raw HTTP same result |
| SMS transport 2 | pyserial + AT commands | gammu | gammu adds system service; pyserial is lighter |
| PDF generation | WeasyPrint | reportlab, wkhtmltopdf | HTML/CSS input, Arabic RTL support, pure Python |
| Frontend framework | Vue 3 + Vite | React, Svelte | Lighter runtime, easier PWA with Workbox |
| PWA strategy | Workbox (via vite-plugin-pwa) | Manual SW | Best-practice offline caching out of the box |
| Auth storage | JWT in memory + HttpOnly cookie | localStorage | XSS protection for refresh token |
| Task scheduler | APScheduler | Celery + Redis | No external broker needed for single Pi |

---

*SchoolBox Offline — ENIF 6.0 Technical Challenge*
*Theme: Smart Solutions for Smarter Villages*
*Generated: May 2026*
