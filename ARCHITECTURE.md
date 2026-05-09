# SmartCollab Architecture Documentation

## 🏗️ System Overview
SmartCollab is built as a **Modular Monolith** that integrates project management, social networking, and AI automation into a single high-performance ecosystem. This architecture balances scalability with development velocity, allowing for deep integration between modules while maintaining clean separation of concerns.

### High-Level Architecture Diagram
```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (Next.js 15)                  │
│                   Port 3000                              │
└──────────────────────┬──────────────────────────────────┘
                       │ (JSON/WebSocket)
┌──────────────────────▼──────────────────────────────────┐
│              Unified Backend (NestJS 11)                 │
│              Port 8000                                   │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Auth Module  │  │ Project Mod  │  │ Home Module  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ AI Module    │  │ Realtime Mod │  │ Search Mod   │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└──────────────┬───────────────┬───────────────┬───────────┘
               │               │               │
    ┌──────────▼────────┐  ┌───▼───┐  ┌────────▼────────┐
    │  Primary DB       │  │ Cache │  │ Asset Storage   │
    │  (MongoDB Atlas)  │  │(Redis)│  │ (Cloudinary)    │
    └───────────────────┘  └───────┘  └─────────────────┘
```

---

## 📦 Core Modules

### 1. Auth Module
- **Purpose:** Identity management, security, and access control.
- **Features:**
  - JWT-based authentication with Refresh Tokens.
  - Google OAuth 2.0 integration.
  - Role-Based Access Control (RBAC).
  - Profile management and audit logs.

### 2. Project Module
- **Purpose:** Core workspace and task management engine.
- **Features:**
  - **Workspaces:** Multi-project and multi-board support.
  - **Agile Tools:** Kanban boards, custom columns, and task cards.
  - **Rich Metadata:** Labels, priorities, deadlines, and custom fields.
  - **Collaboration:** Card members, comments, and attachments.

### 3. Home (Social) Module
- **Purpose:** Social engagement and real-time news feed.
- **Features:**
  - **News Feed:** High-performance social updates and AI-generated news.
  - **Engagement:** Post reactions (Like, Love, etc.), comments, and sharing.
  - **Networking:** Following/Follower system and user discovery.

### 4. AI & Automation Module
- **Purpose:** Intelligent task generation and project insights.
- **AI Providers:** Gemini 2.0 Flash, Groq (Llama 3), OpenAI (GPT-4o).
- **Capabilities:**
  - **Strategic Generation:** Automated creation of project structures and task descriptions.
  - **News Generation:** AI-driven industry news and project summaries.
  - **Smart Suggestions:** Automated priority and deadline estimations.

### 5. Realtime Module
- **Purpose:** Live collaboration and instant notifications.
- **Technology:** Socket.io integrated with NestJS Gateways.
- **Features:**
  - **Live Sync:** Real-time updates for board moves and card changes.
  - **Presence:** Active user tracking within projects.
  - **Notifications:** Instant alerts for mentions and assignments.

---

## 🗄️ Data Persistence

### Unified MongoDB (Prisma)
SmartCollab utilizes a unified MongoDB database via **Prisma ORM**. This provides the flexibility of a document store with the type-safety of a relational-like schema.

- **Models:**
  - **Users & Identity:** `User`, `RefreshToken`, `Device`.
  - **Social:** `Post`, `NewsArticle`, `Comment`, `Reaction`, `Follower`.
  - **Project:** `Project`, `Board`, `Column`, `Card`, `CardMember`.
  - **Extensions:** `AuditLog`, `Notification`, `CustomField`.

### Redis (Caching & Scaling)
- **Use Cases:**
  - Socket.io adapter for scaling real-time connections.
  - Caching frequently accessed project metadata.
  - Rate limiting and session management.

---

## 🔐 Security Architecture
1. **Transport:** All communication is secured via TLS/SSL.
2. **Authentication:** Stateless JWT authentication. Access tokens have a 15-minute TTL, while Refresh Tokens are stored securely in MongoDB.
3. **Authorization:** Middleware and Guards implement strict RBAC and resource ownership checks (e.g., only project members can view boards).
4. **Validation:** All inputs are strictly validated using `class-validator` and `Zod`.

---

## 🔄 Development & Lifecycle
- **Monorepo:** Managed via **pnpm Workspaces** and **Turborepo**.
- **Build System:** Unified TypeScript configuration across frontend and backend.
- **CI/CD:** Optimized for containerized deployments (Docker) and cloud platforms like Railway or Vercel.

**Last Updated:** May 2026
**Version:** 2.0 (Modular Monolith Migration)
