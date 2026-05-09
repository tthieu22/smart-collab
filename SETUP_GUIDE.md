# SmartCollab Monorepo Setup Guide

## 🎯 Overview
This document provides a step-by-step guide to setting up and running the SmartCollab ecosystem. The project is organized as a **Modular Monolith** within a **pnpm workspace**, ensuring efficient dependency management and developer experience.

## 📋 Prerequisites
Ensure you have the following installed on your machine:
- **Node.js**: >= 18.x
- **pnpm**: >= 9.x
- **MongoDB**: A local instance or a MongoDB Atlas cluster.
- **Redis**: (Optional for local development, recommended for production scaling).

## 🚀 Step-by-Step Setup

### Step 1: Install Dependencies
From the project root, run:
```bash
pnpm install
```
This command installs all dependencies for both the Backend and Frontend, utilizing pnpm's efficient hoisting mechanism.

### Step 2: Configure Environment Variables
You need to set up `.env` files for the core applications.

1. **Backend (`apps/api-gateway/.env`):**
   ```bash
   DATABASE_URL="mongodb+srv://..."
   JWT_SECRET="your_jwt_secret"
   GOOGLE_CLIENT_ID="your_google_id"
   GROQ_API_KEY="your_groq_key"
   CLOUDINARY_URL="your_cloudinary_url"
   ```

2. **Frontend (`apps/frontend/.env.local`):**
   ```bash
   NEXT_PUBLIC_API_URL="http://localhost:8000"
   ```

### Step 3: Database Synchronization (Prisma)
SmartCollab uses Prisma with the MongoDB connector. You must generate the client and push the schema to your database.

```bash
# Generate the Prisma client for the backend
pnpm --filter api-gateway prisma generate

# Push the schema to MongoDB (Initial setup)
pnpm --filter api-gateway prisma db push
```

### Step 4: Launch the Application
You can start both the backend and frontend simultaneously using the workspace command:

```bash
# Start all applications in parallel
pnpm dev:all
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs) (if enabled)

---

## 📁 Monorepo Structure

```
smart-collab/
├── apps/
│   ├── api-gateway/       # ✨ Unified NestJS Backend
│   │   ├── prisma/        # MongoDB Schema
│   │   └── src/           # Modular logic (Auth, Project, AI, etc.)
│   └── frontend/          # ✨ Next.js 15 Frontend
├── libs/
│   └── shared/            # Common utilities
├── package.json           # Root workspace configuration
└── turbo.json             # Turborepo build cache settings
```

---

## 🔧 Useful Commands

### Backend Specifics
```bash
# Run only the backend
pnpm --filter api-gateway run dev

# Open Prisma Studio (Database GUI)
pnpm --filter api-gateway prisma studio
```

### Frontend Specifics
```bash
# Run only the frontend
pnpm --filter frontend run dev

# Build for production
pnpm --filter frontend run build
```

---

## 🐛 Troubleshooting

### Issue: "Prisma client not found"
**Solution:** Ensure you have run `pnpm --filter api-gateway prisma generate`. If you are using VS Code, you may need to restart the TypeScript server.

### Issue: "MongoDB connection timeout"
**Solution:** Verify your `DATABASE_URL` in `apps/api-gateway/.env`. If using MongoDB Atlas, ensure your IP address is whitelisted in the Atlas Network Access settings.

### Issue: "Port 8000 or 3000 already in use"
**Solution:** Change the `PORT` variable in the respective `.env` files or terminate the process running on those ports.
- **Windows:** `netstat -ano | findstr :8000` -> `taskkill /F /PID <PID>`
- **macOS/Linux:** `lsof -i :8000` -> `kill -9 <PID>`

---

## ✅ Post-Setup Checklist
- [ ] Dependencies installed (`pnpm install`)
- [ ] Environment variables configured in `apps/api-gateway/.env`
- [ ] Prisma client generated
- [ ] Database schema pushed to MongoDB
- [ ] Backend starts successfully on port 8000
- [ ] Frontend starts successfully on port 3000

---

**Happy coding! 🚀**
