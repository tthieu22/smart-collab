# SmartCollab Monorepo Setup Guide

## 🎯 Overview

This document provides a complete guide for setting up and running the SmartCollab monorepo with:
- **Shared node_modules** at the root level (pnpm workspaces)
- **Unified Prisma schema** at the root (PostgreSQL)
- **5 Node.js microservices** (NestJS + 1 Next.js frontend)
- **2 Java microservices** (Spring Boot)
- **Shared libraries** for common functionality

## 📋 Prerequisites

```bash
Node.js >= 18
pnpm >= 9.0.0
Java 21 (for Spring Boot services)
Maven 3.9+
PostgreSQL 12+
MongoDB (for auth service)
Redis
RabbitMQ
```

## 🚀 Quick Start

### Step 1: Install Node Dependencies

```bash
# From project root
cd C:\Users\hieut\Desktop\smart-collab
pnpm install
```

This will:
- Create a **single `node_modules` at the root**
- Hoist shared dependencies (Prisma, NestJS, etc.)
- Link workspace packages (`@smart-collab/*`)
- Generate Prisma clients

### Step 2: Setup Notification Service (Optional)

The notification-service files need to be organized:

```bash
# Option 1: Using Node.js setup script
node setup-monorepo.js

# Option 2: Using Python setup script
python setup-monorepo.py

# Option 3: Manual setup with Windows cmd
cd java-service\notification-service
mkdir src\main\java\com\smartcollab\notification
mkdir src\main\resources
move NotificationServiceApplication.java src\main\java\com\smartcollab\notification\
move application.yml src\main\resources\
```

### Step 3: Generate Prisma Client

```bash
# From root directory
pnpm prisma generate
```

This generates clients for all services using the shared schema.

### Step 4: Database Migration (Optional)

```bash
# Push schema to PostgreSQL database
pnpm prisma db push

# Or run migrations
pnpm prisma migrate dev
```

### Step 5: Start All Services

```bash
# From root directory - starts all services in parallel
pnpm dev:all

# Or start individual services:
pnpm --filter auth run dev
pnpm --filter project run dev
pnpm --filter realtime run dev
pnpm --filter api-gateway run dev
pnpm --filter frontend run dev
```

## 📁 Directory Structure

```
smart-collab/
├── prisma/                    # ✨ Shared Prisma schema
│   └── schema.prisma          # All PostgreSQL models
├── apps/
│   ├── auth/                  # Auth service (NestJS + MongoDB)
│   ├── project/               # Project service (NestJS + PostgreSQL)
│   ├── realtime/              # WebSocket service (NestJS)
│   ├── api-gateway/           # API Gateway (NestJS)
│   └── frontend/              # Frontend (Next.js)
├── libs/
│   ├── shared/                # Shared utilities (@smart-collab/shared)
│   ├── events/                # Event definitions (@smart-collab/events)
│   └── mailer/                # Mailer service (@smart-collab/mailer)
├── java-service/              # Java microservices
│   ├── pom.xml                # Parent POM for Maven
│   ├── home-service/          # Home service (Spring Boot)
│   └── notification-service/  # Notification service (Spring Boot)
├── node_modules/              # ✨ Shared workspace node_modules
├── pnpm-workspace.yaml        # Workspace configuration
├── package.json               # Root package.json
├── .npmrc                      # pnpm configuration
├── tsconfig.base.json         # Base TypeScript configuration
└── turbo.json                 # Turborepo configuration
```

## 🔧 Environment Variables

All environment variables are kept in each service's `.env` file:
- `apps/auth/.env`
- `apps/project/.env`
- `apps/realtime/.env`
- `apps/api-gateway/.env`
- `apps/frontend/.env`
- `java-service/home-service/.env`
- `java-service/notification-service/.env`
- `.env` (root level for shared variables)

The root `.env` is automatically loaded by the workspace.

## 📦 Workspace Configuration

### pnpm-workspace.yaml
```yaml
packages:
  - 'apps/*'
  - 'libs/*'
  - 'java-service/*'
```

### .npmrc (Hoisting Strategy)
```
shamefully-hoist=true
public-hoist-pattern[]=@prisma/*
public-hoist-pattern[]=@nestjs/*
public-hoist-pattern[]=rxjs
```

This ensures:
- All Prisma clients share one instance
- NestJS modules are properly shared
- RxJS operators are deduplicated
- No peer dependency conflicts

## 🔗 Using Workspace Dependencies

### Reference shared libraries:
```typescript
import { SharedService } from '@smart-collab/shared';
import { EventEmitter } from '@smart-collab/events';
import { MailerService } from '@smart-collab/mailer';
```

### Reference Prisma client:
```typescript
import { PrismaClient } from '@prisma/client';

// All services use the same instance
const prisma = new PrismaClient();
```

### Reference workspace packages:
```json
{
  "dependencies": {
    "@prisma/client": "workspace:*",
    "prisma": "workspace:*"
  }
}
```

## 📊 Database Models

The shared Prisma schema includes:

### Project Service (PostgreSQL)
- **Project** - Main project entity
- **ProjectMember** - Project membership
- **Board** - Kanban boards
- **Column** - Board columns
- **Card** - Task cards
- **CardComment** - Card comments
- **CardLabel** - Card labels
- **CardView** - Different card views (board, calendar, etc.)
- **Attachment** - File attachments
- **ChecklistItem** - Task checklists
- **EventStatistic** - Analytics data

### Auth Service (MongoDB)
- Uses separate MongoDB database
- Models: User, RefreshToken, Post, Comment, Reaction, Notification, Follower

## 🧪 Running Tests

```bash
# Run all tests
pnpm -r run test

# Run tests for specific service
pnpm --filter project run test

# Run with coverage
pnpm -r run test:cov
```

## 🏗️ Building for Production

```bash
# Build all services
pnpm build:all

# Build specific service
pnpm --filter api-gateway run build

# Build Java services
cd java-service
mvn clean package
```

## 🐛 Troubleshooting

### Issue: "Cannot find module '@prisma/client'"
**Solution:** Run `pnpm install` from root directory

### Issue: Prisma client not generating
**Solution:** Run `pnpm prisma generate`

### Issue: Port already in use
**Solution:** Change port in `.env` files or kill processes on those ports

### Issue: Database connection failed
**Solution:** Check `.env` DATABASE_URL and ensure PostgreSQL is running

### Issue: node_modules in app folders
**Solution:** Delete old `node_modules` in `apps/*/node_modules` - they're not needed with workspace setup

## 📚 Useful Commands

```bash
# Clean install
pnpm install --force

# Update all dependencies
pnpm update --recursive

# Check dependency tree
pnpm list

# View workspace packages
pnpm list --depth=0

# Run Prisma Studio (database GUI)
pnpm prisma studio

# Generate new Prisma migration
pnpm prisma migrate dev --name <migration_name>

# Format all code
pnpm -r run format

# Lint all code
pnpm -r run lint
```

## 🔒 Security Notes

⚠️ **Important:** The `.env` files in this repository contain placeholder/demo credentials. 
Replace with actual credentials before deploying to production:
- Database passwords
- API keys (JWT, OpenAI, Google OAuth)
- Email credentials
- Redis/RabbitMQ credentials

## 📖 Additional Resources

- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Spring Boot Documentation](https://spring.io/projects/spring-boot)

## ✅ Verification Checklist

- [ ] Node.js and pnpm installed
- [ ] Ran `pnpm install` successfully
- [ ] No node_modules in individual app folders
- [ ] Prisma client generated (`pnpm prisma generate`)
- [ ] All environment variables configured
- [ ] Database connections verified
- [ ] Can start services (`pnpm dev:all`)
- [ ] API Gateway runs on http://localhost:3000

---

**Happy coding! 🚀**
