# 🛠️ Setup Guide - SmartCollab

This guide will walk you through the process of setting up **SmartCollab** for local development.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your machine:

1.  **Node.js**: `v18` or higher.
2.  **pnpm**: `v9.0.0` or higher (`npm install -g pnpm`).
3.  **Java Development Kit (JDK)**: `v21` (Required for Home Service).
4.  **Maven**: `v3.9+` (Optional, `mvnw` wrapper included).
5.  **Docker & Docker Compose**: For running databases and message brokers.

---

## 🚀 Step-by-Step Installation

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/tthieu22/smart-collab.git
cd smart-collab

# Install Node.js dependencies
pnpm install
```

### 2. Infrastructure Setup

SmartCollab relies on several backing services. Use Docker Compose to start them:

```bash
# Start PostgreSQL, MongoDB, Redis, and RabbitMQ
docker-compose up -d
```

| Service | Port | Use Case |
| :--- | :--- | :--- |
| **PostgreSQL** | 5432 | Project management data |
| **MongoDB** | 27017 | User identity & Social feed |
| **Redis** | 6379 | Caching & WebSocket adapter |
| **RabbitMQ** | 5672, 15672 | Async service communication |

### 3. Environment Configuration

You need to set up `.env` files for each service. Copy the example files (if provided) or create them manually:

#### Root `.env`
```env
# Database URLs for setup scripts
DATABASE_URL_PROJECT="postgresql://postgres:admin@localhost:5432/smartcollab?schema=public"
DATABASE_URL_AUTH="mongodb+srv://admin:admin@localhost:27017/smartcollab?authSource=admin"
```

#### Node.js Services (`apps/[service]/.env`)
Each app in `apps/` needs its own `.env`. Key variables include:
- `JWT_SECRET`: Random string for token signing.
- `DATABASE_URL`: Connection string to the respective DB.
- `RABBITMQ_URL`: `amqp://admin:admin@localhost:5672`
- `REDIS_URL`: `redis://localhost:6379`
- `FRONTEND_URL`: `http://localhost:3000`

#### Java Service (`java-service/home-service/.env`)
```env
SPRING_DATA_MONGODB_URI=mongodb://admin:admin@localhost:27017/smartcollab?authSource=admin
SPRING_RABBITMQ_HOST=localhost
SPRING_RABBITMQ_PORT=5672
SPRING_RABBITMQ_USERNAME=admin
SPRING_RABBITMQ_PASSWORD=admin
```

### 4. Database Initialization (Prisma)

Generate the Prisma clients for the Node.js services:

```bash
# Generate all clients
pnpm prisma:generate

# Push schemas to databases
pnpm --filter auth prisma db push
pnpm --filter project prisma db push
```

---

## 🏃 Running the Application

### Running All Services (Recommended)

Use the root workspace command to start all Node.js services and the frontend in parallel:

```bash
pnpm dev:all
```

### Running Specific Services

```bash
# Start only the API Gateway
pnpm --filter api-gateway dev

# Start the Frontend
pnpm --filter frontend dev
```

### Running Java Home Service

```bash
cd java-service/home-service
./mvnw spring-boot:run
```

---

## 🧪 Verification

1.  **Frontend**: Open [http://localhost:3000](http://localhost:3000)
2.  **API Gateway**: Visit [http://localhost:8000/api/health](http://localhost:8000/api/health)
3.  **RabbitMQ Management**: [http://localhost:15672](http://localhost:15672) (admin/admin)
4.  **Prisma Studio**: `pnpm --filter project prisma studio`

---

## 🔧 Troubleshooting

### 1. Prisma Client Errors
If you see "Cannot find module '@prisma/client/...' ", run:
```bash
pnpm prisma:generate
```

### 2. Port Conflicts
Ensure ports 3000, 8000, 3001, 3002, and 3003 are free.
- **Windows**: `netstat -ano | findstr :[PORT]` then `taskkill /F /PID [PID]`
- **Linux/Mac**: `lsof -i :[PORT]` then `kill -9 [PID]`

### 3. Java Build Failures
Ensure `JAVA_HOME` is set to JDK 21 and Maven is using it:
```bash
java -version
mvn -version
```

---

> [!TIP]
> For a deep dive into the system design, check out **[ARCHITECTURE.md](./ARCHITECTURE.md)**.
