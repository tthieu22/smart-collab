# SmartCollab

SmartCollab là nền tảng quản lý dự án và làm việc nhóm thời gian thực, được xây dựng theo kiến trúc microservices hiện đại với NestJS monorepo và Next.js 14. Hỗ trợ Kanban, thông báo realtime, presence, và trợ lý AI thông minh.

## Table of Contents
- Features
- Architecture
- Tech Stack
- Quick Start
- Docker Setup
- Project Structure
- Event System
- Contributing
- Roadmap
- License

## Features
Realtime Kanban & Timeline  
WebSocket collaboration với presence (ai đang online)  
Trợ lý AI gợi ý deadline, tóm tắt tiến độ, hỏi đáp bằng OpenAI  
Thông báo thông minh (in-app + email queue)  
Phân quyền chi tiết (org - team - member)  
Event-driven microservices qua RabbitMQ  
Redis cache & pub/sub  
Frontend Next.js 14 + shadcn/ui  
Chạy full local bằng Docker Compose

## Architecture
Next.js Frontend ←→ API Gateway (NestJS)  
          ↓ (REST + WebSocket)  
          RabbitMQ (events.exchange - topic)  
          ↓  
Auth - Project - Task - Notification - Realtime - AI  
(Postgres + Redis + VectorDB)

## Tech Stack
Monorepo: pnpm workspaces + TypeScript  
Backend: NestJS 10  
Frontend: Next.js 14 App Router + Tailwind + shadcn/ui  
Database: PostgreSQL + Prisma  
Message Broker: RabbitMQ  
Cache/PubSub: Redis  
Realtime: Socket.IO + Redis Adapter  
AI: OpenAI API + Embeddings  
Infra: Docker Compose

## Quick Start (Development)

Yêu cầu: Node.js 20+, pnpm 8+, Docker

git clone https://github.com/your-username/smart-collab.git
cd smart-collab
pnpm install

# Khởi động Postgres, Redis, RabbitMQ
docker compose up -d

# Chạy tất cả services
pnpm run dev

# Hoặc chạy riêng
pnpm --filter api-gateway run start:dev
pnpm --filter frontend run dev   # http://localhost:3000

## Docker Setup
docker compose -f docker-compose.yml -f docker-compose.prod.yml build
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

## Project Structure
smart-collab/
├── apps/
│   ├── api-gateway/
│   ├── auth/
│   ├── project/
│   ├── task/
│   ├── notification/
│   ├── realtime/
│   ├── ai/
│   └── frontend/
├── libs/
│   ├── prisma-postgres/
│   ├── rabbitmq/
│   ├── redis/
│   └── shared/
├── docker-compose.yml
└── pnpm-workspace.yaml

## Event System (RabbitMQ)
Exchange: events.exchange (topic)

user.*          → auth → notification, realtime
project.*       → project → notification, realtime
task.*          → task → notification, realtime, ai
notification.*  → notification → realtime
ai.*            → ai → realtime, frontend

## Contributing
Rất hoan nghênh mọi đóng góp! Xem file CONTRIBUTING.md để biết cách setup, style guide và gửi PR.

## Roadmap
Multi-tenant organizations  
File attachments (MinIO/S3)  
AI nâng cao với RAG  
Mobile app  
One-click self-hosted installer

## License
MIT License. Xem file LICENSE để biết chi tiết.

Happy collaborating!