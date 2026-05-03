# Nour - Resilient Education Platform

Nour is a decentralized education continuity system designed for rural Tunisian villages. It ensures learning never stops, even during physical or digital disruptions, by using a resilient edge-box architecture.

## 🚀 Vision

In many Tunisian rural villages, children miss school frequently due to long distances, lack of reliable transport, and weather disruptions. Every missed day creates learning gaps that accumulate silently. Nour provides a resilient "learning continuity system" that keeps children learning at home and enables early intervention before dropout happens.

## 🛠 Architecture

- **Edge Nodes (Nour Box)**: Raspberry Pi-based local servers providing offline access to lessons and attendance tracking.
- **Regional Hubs**: Cloud-based central management for multi-school synchronization.
- **Progressive Web App (PWA)**: Mobile-first interface for students, teachers, and administrators.
- **Risk Engine**: Automated early warning system for students at risk of dropout.

## 📦 Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Vite, Framer Motion.
- **Backend**: Node.js (Express), TypeScript, Pino (Logging).
- **Database**: MySQL, Drizzle ORM.
- **Infrastructure**: Edge-computing on Raspberry Pi.

## 🚦 Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- MySQL instance

### Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Set up environment variables in `.env`:
   ```env
   DATABASE_URL=mysql://user:pass@localhost:3306/nour
   SESSION_SECRET=your_secret_here
   ```
4. Run migrations and seed data:
   ```bash
   pnpm run db:push
   pnpm run db:seed
   ```
5. Start development servers:
   ```bash
   pnpm run dev
   ```

## 🛡 Security & Audit

- **Authentication**: HMAC-SHA256 tokens with secure session management.
- **Audited**: Codebase undergoes regular security scans for sensitive data leakage.
- **Offline Reliability**: Data sync protocol designed for low-connectivity environments.

## 📜 License

MIT License.
