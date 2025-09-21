API Gateway
pnpm dlx @nestjs/cli new api-gateway --package-manager=pnpm

Auth / User Service
pnpm dlx @nestjs/cli new auth --package-manager=pnpm

Project Service
pnpm dlx @nestjs/cli new project --package-manager=pnpm

Task Service
pnpm dlx @nestjs/cli new task --package-manager=pnpm

Notification Service
pnpm dlx @nestjs/cli new notification --package-manager=pnpm

Realtime Gateway Service
pnpm dlx @nestjs/cli new realtime --package-manager=pnpm

AI Service
pnpm dlx @nestjs/cli new ai --package-manager=pnpm

🔗 Dependency Graph (MVP)
┌────────────────┐
│ Frontend │ (Next.js 14)
└───────▲────────┘
│ REST/GraphQL + WebSocket
▼
┌────────────────┐
│ API Gateway │ (NestJS)
│ - Auth Guard │
│ - REST routes │
└───────┬────────┘
│ Publish/Consume
┌───────┴───────────────────────────┐
│ RabbitMQ (events.exchange, topic) │
└───┬─────────┬─────────┬──────────┘
│ │ │
┌──────────────┘ │ └───────────────┐
▼ ▼ ▼
┌─────────────┐ ┌──────────────┐ ┌────────────────┐
│ Auth Svc │ │ Project Svc │ │ Task Svc │
│ (Postgres) │ │ (Postgres) │ │ (Postgres) │
│ user.roles │ │ project.meta │ │ tasks CRUD │
└─────┬───────┘ └──────┬───────┘ └────────┬───────┘
│ │ │
▼ ▼ ▼
emits user._ emits project._ emits task.\*
events events events
│ │ │
└────────────────┬──────┴─────────────┬─────────────┘
▼ ▼
┌───────────────┐ ┌────────────────┐
│ Notification │ │ Realtime GW │
│ (Postgres+ │ │ (WebSocket + │
│ Redis + RMQ) │ │ Redis adapter) │
│ consume events │ │ consume events │
└───────┬───────┘ └───────┬────────┘
│ │
in-app notify emit WS events
email queue presence tracking
│
▼
┌─────────────┐
│ AI Service │ (OpenAI + VectorDB)
│ - deadline │
│ - summary │
│ - Q&A │
└───────┬─────┘
│
consumes ai.request
publishes ai.response

🗄️ Service → Infra dependency
| Service | Postgres | Redis | RabbitMQ | S3/MinIO | VectorDB |
| ---------------- | -------- | ------------- | ------------------- | -------- | ------------ |
| **API Gateway** | ❌ | ❌ | ✅ (publish/consume) | ❌ | ❌ |
| **Auth** | ✅ users | ❌ | ✅ (user.\* events) | ❌ | ❌ |
| **Project** | ✅ | ❌ | ✅ (project.\*) | ❌ | ❌ |
| **Task** | ✅ | ❌ | ✅ (task.\*) | ❌ | ❌ |
| **Notification** | ✅ | ✅ cache/email | ✅ (consume all) | ❌ | ❌ |
| **Realtime** | ❌ | ✅ presence | ✅ (consume all) | ❌ | ❌ |
| **AI** | ❌ | ✅ cache resp | ✅ (ai.request) | ❌ | ✅ embeddings |
| **Frontend** | ❌ | ❌ | ❌ | ✅ upload | ❌ |

📌 RabbitMQ Exchange/Queue plan

events.exchange (topic)

user.\* → auth_service emits

project.\* → project_service emits

task.\* → task_service emits

notification.\* → notification_service emits

ai.\* → ai_service emits

Queues:

notification.queue (binds to user._, project._, task.\*)

realtime.queue (binds to all \*.created|updated)

ai.request.queue (binds to ai.request)

📌 Roadmap Hoàn Thành Dự Án SmartCollab

1. Chuẩn bị môi trường

Cài Node.js LTS (20.x) + pnpm

Cài Docker + Docker Compose

Cài Postgres, Redis, RabbitMQ qua docker-compose.yml

Tạo repo monorepo (Nx hoặc tự quản lý):

smartcollab/
├── apps/ # chứa microservices và frontend
├── libs/ # chia sẻ DTO, constants, utils
├── docker-compose.yml
└── package.json

2. Scaffold các service

api-gateway (NestJS – REST/GraphQL entrypoint)

auth (NestJS – User/Auth service)

project (NestJS – quản lý project/team)

task (NestJS – quản lý task Kanban/timeline)

notification (NestJS – consume event + gửi noti/email)

realtime (NestJS – WebSocket Gateway, presence, pub/sub Redis)

ai (NestJS – OpenAI integration)

frontend (Next.js 14 – UI)

3. Thiết lập kết nối hạ tầng

Tạo thư mục config/ trong mỗi service

rabbitmq.config.ts

postgres.config.ts

redis.config.ts

Config microservice transport (RabbitMQ) trong main.ts

Config DB (TypeORM/Prisma với Postgres) trong app.module.ts

Config Redis (cache, pub/sub) cho Notification + Realtime

4. Xây dựng Auth/User Service

Schema User (Postgres)

Đăng ký, đăng nhập, refresh token (JWT/OAuth2)

Phân quyền (user, team-admin, org-admin)

Publish sự kiện user.created, user.logged_in

5. Xây dựng Project Service

Schema Project (id, name, description, owner, members)

API: tạo project, thêm thành viên

Publish sự kiện project.created, project.member_added

Subscribe user.created để sync user metadata

6. Xây dựng Task Service

Schema Task (id, project_id, title, description, status, assignee, due_date)

CRUD task + move (kanban)

Publish sự kiện task.created, task.updated, task.moved

Subscribe project.created để auto-init board

7. Xây dựng Notification Service

Consume task._, project._, user.\*

Lưu Notification vào Postgres

Emit in-app notification qua RabbitMQ → Realtime service

Queue email notification (chỉ cần log email ở MVP)

8. Xây dựng Realtime Gateway

NestJS + @nestjs/websockets + Socket.IO

Redis adapter cho scale out

Subscribe từ notification exchange → emit tới client

Presence (ai đang online) với Redis

9. Xây dựng AI Service

API nội bộ: gọi OpenAI API (Chat Completions, Embeddings)

Prompt engineering: gợi ý deadline, tóm tắt tiến độ

Lưu cache response bằng Redis

Publish sự kiện ai.suggestion_ready

10. API Gateway

REST/GraphQL endpoints cho frontend

AuthGuard (JWT)

Forward request đến các service qua RabbitMQ (RPC)

Rate-limit + validation

11. Frontend (Next.js 14 + shadcn/ui)

Trang Login/Register

Trang Dashboard → Danh sách Project

Project Board (Kanban, drag & drop)

Timeline view

Notification Bell (realtime WS)

AI Assistant popup (chat box)

12. DevOps / Vận hành

Dockerfile cho từng service

docker-compose.override.yml cho dev

Log cấu trúc (Winston)

Healthcheck endpoint /health

GitHub Actions CI/CD (build, test, docker push)

13. Roadmap 14 ngày (MVP)

Day 1-2: Scaffold repo + Docker infra

Day 3-4: Auth service (login/register/JWT)

Day 5-6: Project service (create/join project)

Day 7-8: Task service (CRUD, kanban events)

Day 9: Notification service (consume + emit)

Day 10: Realtime WS gateway

Day 11-12: Frontend (login, dashboard, kanban UI)

Day 13: AI Assistant integration (basic prompt)

Day 14: Test + polish + demo

RabitMQ : http://localhost:15672/

progest port 5050
pnpm prisma generate --schema=libs/prisma/schema.prisma
reder Prisma

Cấu trúc repo   

smart-collab/
├── apps/
│   ├── api-gateway/                # NestJS API Gateway
│   │   ├── src/
│   │   │   ├── main.ts             # Bootstrap app
│   │   │   ├── app.module.ts       # Import RabbitMQModule
│   │   │   └── controllers/
│   │   └── package.json
│   │
│   ├── auth/                       # Auth Service (Postgres)
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── auth.module.ts      # Import PrismaPostgresModule + RabbitMQModule
│   │   │   ├── user.entity.ts
│   │   │   ├── user.service.ts
│   │   │   └── user.controller.ts
│   │   └── package.json
│   │
│   ├── project/                    # Project Service (Postgres)
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── project.module.ts   # Import PrismaPostgresModule + RabbitMQModule
│   │   │   ├── project.service.ts
│   │   │   └── project.controller.ts
│   │   └── package.json
│   │
│   ├── task/                       # Task Service (Postgres)
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── task.module.ts      # Import PrismaPostgresModule + RabbitMQModule
│   │   │   └── task.controller.ts
│   │   └── package.json
│   │
│   ├── notification/               # Notification Service (Postgres + Redis)
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── notification.module.ts # Import PrismaPostgresModule + RedisModule + RabbitMQModule + MailerModule
│   │   │   └── notification.service.ts
│   │   └── package.json
│   │
│   ├── realtime/                   # Realtime Service (Redis + RabbitMQ)
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── realtime.module.ts  # Import RedisModule + RabbitMQModule
│   │   │   └── gateway.ts          # WebSocket Gateway
│   │   └── package.json
│   │
│   ├── ai/                         # AI Service (VectorDB + Redis + RabbitMQ)
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── ai.module.ts        # Import RedisModule + RabbitMQModule
│   │   │   └── ai.service.ts
│   │   └── package.json
│   │
│   └── frontend/                   # Next.js 14
│       ├── app/
│       └── package.json
│
├── libs/
│   ├── prisma/                     # Mongo (chưa dùng cho graph này, nhưng có sẵn)
│   ├── prisma-postgres/            # Postgres ORM
│   ├── rabbitmq/                   # RabbitMQ common module
│   ├── redis/                      # Redis common module
│   ├── mailer/                     # Mailer common module
│   └── shared/                     # Shared utils
│
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── package.json
└── docker-compose.yml              # DB + Redis + RabbitMQ + MinIO


Client → API Gateway → RabbitMQ (send) → Auth Service (consume + xử lý) → RabbitMQ (return) → API Gateway → Client