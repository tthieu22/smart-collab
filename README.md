# SmartCollab - Monorepo Project Management System

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js->=18-green)
![pnpm](https://img.shields.io/badge/pnpm->=9.0.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)
![License](https://img.shields.io/badge/License-MIT-green)

**A comprehensive monorepo for collaborative project management with real-time updates, microservices architecture, and AI integration.**

Repository: https://github.com/tthieu22/smart-collab

[Features](#-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [Documentation](#-documentation)

</div>

## 🌟 Features

### Core Capabilities
- ✅ **Project Management** - Create and manage projects with boards, columns, and cards
- ✅ **AI-Powered Project Creation** - Auto-generate project structure from prompts
- ✅ **Real-time Collaboration** - WebSocket-powered live updates
- ✅ **User Authentication** - JWT-based auth with Google OAuth
- ✅ **Team Management** - Project members and roles
- ✅ **File Attachments** - Upload and manage files via Cloudinary
- ✅ **Activity Tracking** - Event statistics and audit logs
- ✅ **Email Notifications** - Automated email alerts

### Technical Highlights
- ✅ **Monorepo with pnpm Workspaces** - Shared node_modules, zero duplication
- ✅ **Unified Prisma Schema** - Single source of truth for data models
- ✅ **Multi-service Architecture** - 5 Node.js + 2 Java microservices
- ✅ **Production-Ready** - Docker Compose, CI/CD ready
- ✅ **Type-Safe** - Full TypeScript coverage
- ✅ **Scalable** - Event-driven with RabbitMQ

## 📋 Services Overview

| Service | Type | Port | Database | Purpose |
|---------|------|------|----------|---------|
| **Frontend** | Next.js | 3000 | - | Web UI |
| **API Gateway** | NestJS | 3100 | - | Request routing & auth |
| **Project Service** | NestJS | 3002 | PostgreSQL | Project management |
| **Auth Service** | NestJS | 3001 | MongoDB | User management |
| **Realtime Service** | NestJS + Socket.io | 3003 | Redis | WebSocket server |
| **Home Service** | Spring Boot | 3002 | MongoDB | Feed & social |
| **Notification Service** | Spring Boot | 3004 | MongoDB | Email & notifications |

## 🚀 Quick Start

### Prerequisites
```bash
# Install Node.js >= 18
# Install pnpm >= 9.0.0
npm install -g pnpm

# Install Docker (optional but recommended)
# Install Java 21 (for Spring Boot services)
```

### Setup (Windows)
```bash
# 1. Navigate to project
cd C:\Users\hieut\Desktop\smart-collab

# 2. Run setup script
setup.bat

# 3. Start all services
pnpm dev:all
```

### Setup (macOS/Linux)
```bash
# 1. Navigate to project
cd ~/smart-collab

# 2. Run setup script
bash setup.sh

# 3. Start all services
pnpm dev:all
```

### Manual Setup
```bash
# 1. Install dependencies (creates shared node_modules)
pnpm install

# 2. Generate Prisma client
pnpm prisma generate

# 3. Setup databases (optional - uses Docker)
docker-compose up -d

# 4. Start all services in parallel
pnpm dev:all

# Or start individual services:
pnpm --filter project run dev
pnpm --filter auth run dev
pnpm --filter frontend run dev
```

## 📁 Project Structure

```
smart-collab/
├── 📘 prisma/
│   └── schema.prisma              ⭐ Unified schema for PostgreSQL
│
├── 📱 apps/
│   ├── frontend/                  # Next.js web application
│   ├── auth/                      # Authentication service (NestJS)
│   ├── project/                   # Project management (NestJS)
│   ├── realtime/                  # WebSocket server (NestJS)
│   └── api-gateway/               # API Gateway (NestJS)
│
├── 📚 libs/                       # Shared libraries (workspace packages)
│   ├── shared/                    # Common utilities & types
│   ├── events/                    # Event definitions
│   └── mailer/                    # Email service
│
├── ☕ java-service/              # Spring Boot microservices
│   ├── home-service/              # Home feed service
│   └── notification-service/      # Notification service
│
├── 📦 node_modules/               # ⭐ Single shared node_modules
├── pnpm-workspace.yaml            # Workspace configuration
├── docker-compose.yml             # Local development databases
└── SETUP_GUIDE.md                 # Detailed setup instructions
```

## 🏗️ Architecture

### Monorepo Benefits
- **Single node_modules** - Saves disk space, faster installs
- **Dependency hoisting** - Shared dependencies (Prisma, NestJS)
- **Workspace packages** - Import local libraries with `@smart-collab/*`
- **Unified builds** - Turborepo for efficient builds

### Services Communication
```
Frontend → API Gateway → Microservices
           ↓
        RabbitMQ (async events)
           ↓
       All Services
```

### Database Schema
- **PostgreSQL** - Project, boards, cards, columns (relational data)
- **MongoDB** - Users, posts, comments, notifications (document data)
- **Redis** - Caching, sessions, rate limiting
- **RabbitMQ** - Async service-to-service communication

## 🔧 Commands

### Development
```bash
# Start all services in parallel
pnpm dev:all

# Start specific service
pnpm --filter auth run dev

# Watch and rebuild shared libraries
pnpm --filter @smart-collab/shared run dev
```

### Database
```bash
# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma db push

# Create new migration
pnpm prisma migrate dev --name add_new_feature

# Open Prisma Studio (database GUI)
pnpm prisma studio
```

### Building
```bash
# Build all services
pnpm build:all

# Build specific service
pnpm --filter api-gateway run build

# Build Java services
cd java-service
mvn clean package
```

### Testing & Linting
```bash
# Run all tests
pnpm -r run test

# Run linting
pnpm -r run lint

# Format code
pnpm -r run format
```

## 📚 Documentation

- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Complete setup instructions
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System design and components
- **[Database Schema](./prisma/schema.prisma)** - All data models

## 🔐 Environment Configuration

Each service has its own `.env` file for configuration:

```bash
# Core services (Node.js)
apps/auth/.env
apps/project/.env
apps/realtime/.env
apps/api-gateway/.env
apps/frontend/.env

# Java services
java-service/home-service/.env
java-service/notification-service/.env
```

**Important:** All `.env` files contain placeholder credentials. Replace with actual values before deployment.

## 📦 Dependencies

### Node.js Workspace Packages
```json
{
  "@smart-collab/shared": "Common utilities",
  "@smart-collab/events": "Event definitions",
  "@smart-collab/mailer": "Email service"
}
```

### External Services
- **Cloudinary** - Image hosting and CDN
- **Gmail SMTP** - Email delivery
- **Google OAuth** - Social authentication
- **OpenAI/Groq/Gemini** - AI services

## 🐛 Troubleshooting

### Issue: "Cannot find module '@prisma/client'"
```bash
# Solution: Regenerate Prisma client
pnpm prisma generate
```

### Issue: Port already in use
```bash
# Change port in .env file or kill process
# Windows: netstat -ano | findstr :3000
# macOS/Linux: lsof -i :3000
```

### Issue: Database connection failed
```bash
# Check .env DATABASE_URL and start databases
docker-compose up -d
```

### Issue: node_modules still in app folders
```bash
# Delete old node_modules (not needed with workspace)
rm -rf apps/*/node_modules
```

## 🚢 Deployment

### Docker Deployment
```bash
# Build Docker images for each service
docker build -t smart-collab-frontend apps/frontend
docker build -t smart-collab-api-gateway apps/api-gateway

# Run with Docker Compose
docker-compose -f docker-compose.prod.yml up
```

### Production Checklist
- [ ] Update `.env` files with production credentials
- [ ] Set up managed databases (PostgreSQL, MongoDB)
- [ ] Configure CDN for static assets
- [ ] Set up Redis cluster for high availability
- [ ] Configure RabbitMQ clustering
- [ ] Enable HTTPS and secure headers
- [ ] Setup monitoring and logging (ELK, Datadog, etc.)
- [ ] Configure backups

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- **Hiếu** - Backend Developer
- GitHub: https://github.com/tthieu22

## 🙏 Acknowledgments

- Built with [NestJS](https://nestjs.com/)
- Type-safe database with [Prisma](https://www.prisma.io/)
- Workspaces managed with [pnpm](https://pnpm.io/)
- Java backend with [Spring Boot](https://spring.io/projects/spring-boot)

## 📞 Support

For support, email support@smartcollab.com or open an issue in the GitHub repository.

---

<div align="center">

Made with ❤️ for collaborative teams

[GitHub](https://github.com/tthieu22/smart-collab) • [Documentation](./SETUP_GUIDE.md) • [Issues](https://github.com/tthieu22/smart-collab/issues)

</div>
