# SchoolBox Offline

Enterprise-grade, offline-first school management platform for rural Tunisian schools.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod, drizzle-zod
- **API codegen**: Orval (from OpenAPI spec → lib/api-zod + lib/api-client-react)
- **Frontend**: React + Vite + Wouter + TailwindCSS + shadcn/ui + Recharts + Framer Motion
- **Build**: esbuild (ESM bundle for server)

## Artifacts

- `artifacts/api-server` — Express 5 REST API on port 8080, proxied at `/api`
- `artifacts/schoolbox` — React/Vite frontend, proxied at `/`

## Shared Libraries

- `lib/db` — Drizzle ORM schema + PostgreSQL client
- `lib/api-zod` — Zod schemas generated from OpenAPI spec
- `lib/api-client-react` — React Query hooks generated from OpenAPI spec

## Features

- **Role-based portals**: Admin, Teacher, Student — each with their own layout and pages
- **Admin portal**: Dashboard (KPIs + charts), Analytics (16-week trend, radar, risk heatmap), User management, Class management, Notifications
- **Teacher portal**: Dashboard, Attendance tracking (hash-signed sessions), Risk alerts, Class roster
- **Student portal**: Dashboard, Subjects/Lessons browser, Attendance history
- **Dropout risk engine**: Score-per-student (0–1), tiers: low/medium/high/critical
- **Attendance**: Session-based with lock-and-hash integrity, period tracking
- **Parent notifications**: Queue system with SMS/WhatsApp templates (Arabic + French)
- **Analytics**: KPIs, 16-week attendance trend, per-class risk distribution, top-at-risk table, content engagement radar

## Auth

- HMAC-signed tokens stored in `localStorage` key `schoolbox_token`
- Passwords: `sha256(password + "schoolbox_salt")`
- Token format: `base64(payload).HMAC_signature`
- Middleware: `requireAuth`, `requireRole(...roles)`

## Seed Credentials

| Role    | Username  | Password    |
|---------|-----------|-------------|
| Admin   | admin     | admin123    |
| Teacher | teacher1  | teacher123  |
| Student | student1  | student123  |

Seed data: 5 classes, 4 teachers, 115 students, 15 subjects, 60+ attendance sessions, risk scores, 10 notifications, 25 alerts.

## Key Commands

```bash
pnpm run typecheck                              # full typecheck all packages
pnpm --filter @workspace/api-server run codegen # regenerate API client from OpenAPI
pnpm --filter @workspace/db run push            # push schema to PostgreSQL (dev only)

# Seed database (one-time)
cd artifacts/api-server
node -e "import('esbuild').then(({build})=>build({entryPoints:['src/seed.ts'],platform:'node',bundle:true,format:'cjs',outfile:'dist/seed.cjs',external:['pg-native','*.node']})).then(()=>console.log('ok'))"
node dist/seed.cjs
```

## API Route Map

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/auth/login` | POST | — | Login, returns token + user |
| `/api/auth/me` | GET | ✓ | Current user |
| `/api/auth/logout` | POST | ✓ | Logout |
| `/api/users` | GET/POST | admin | List/create users |
| `/api/users/:id` | GET/PATCH | ✓ | Get/update user |
| `/api/classes` | GET/POST | ✓ | List/create classes |
| `/api/classes/:id/students` | GET | ✓ | Students in class |
| `/api/students` | GET/POST | ✓ | List/create students |
| `/api/students/:id` | GET/PATCH | ✓ | Get/update student |
| `/api/students/:id/attendance-summary` | GET | ✓ | Attendance summary |
| `/api/subjects` | GET/POST | ✓ | List/create subjects |
| `/api/subjects/:id/lessons` | GET/POST | ✓ | Lessons for subject |
| `/api/lessons/:id` | GET/PATCH | ✓ | Get/update lesson |
| `/api/attendance/sessions` | GET/POST | ✓ | List/create sessions |
| `/api/attendance/sessions/:id/records` | POST | teacher | Record attendance |
| `/api/attendance/sessions/:id/lock` | POST | teacher | Lock+hash session |
| `/api/risk/classes/:classId` | GET | ✓ | Risk scores for class |
| `/api/risk/students/:id/history` | GET | ✓ | Risk history |
| `/api/risk/alerts` | GET | ✓ | List alerts |
| `/api/risk/alerts/:id/acknowledge` | PATCH | ✓ | Acknowledge alert |
| `/api/risk/run-now` | POST | admin | Recompute all risk scores |
| `/api/analytics/kpis` | GET | admin/teacher | School KPIs |
| `/api/analytics/attendance-trend` | GET | admin/teacher | Weekly trend |
| `/api/analytics/risk-by-class` | GET | admin/teacher | Risk heatmap by class |
| `/api/analytics/top-at-risk` | GET | admin/teacher | Top at-risk students |
| `/api/analytics/content-engagement` | GET | admin/teacher | Subject engagement |
| `/api/notifications` | GET | ✓ | Notification log |
| `/api/notifications/:studentId/send` | POST | ✓ | Queue notification |

## Important Notes

- After every `pnpm run codegen`, check `lib/api-zod/src/index.ts` — it must only have `export * from "./generated/api";`
- `lib/api-client-react/package.json` exports `"./src/custom-fetch"` for auth token injection
- Risk tiers: low (0–0.3 green), medium (0.3–0.6 amber), high (0.6–0.8 orange), critical (0.8–1.0 red)
- Attendance sessions are locked with an HMAC hash chain for tamper-evidence
