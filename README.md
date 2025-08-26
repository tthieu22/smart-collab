# AuthNexus

A modern authentication system built with NestJS, Next.js, and MongoDB.

## 🚀 Features

- **Authentication**: JWT-based authentication with Google OAuth
- **User Management**: Complete user registration, login, and profile management
- **Modern Stack**: NestJS backend, Next.js frontend, MongoDB database
- **Monorepo**: Organized with Turbo and pnpm workspaces
- **Type Safety**: Full TypeScript support
- **Docker**: Containerized development and production

## 📋 Prerequisites

- Node.js >= 18
- pnpm >= 9.0.0
- MongoDB
- Redis (optional)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd authnexus
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up database**
   ```bash
   # Using Docker (recommended)
   docker-compose up -d mongodb redis
   
   # Or install MongoDB locally
   ```

5. **Generate Prisma client**
   ```bash
   pnpm db:generate
   ```

## 🚀 Development

### Start all services
```bash
pnpm dev
```

### Start individual services
```bash
# API only
pnpm --filter api dev

# Web only
pnpm --filter web dev
```

### Database commands
```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# Run migrations
pnpm db:migrate

# Open Prisma Studio
pnpm db:studio

# Seed database
pnpm db:seed
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm --filter api test:watch

# Run e2e tests
pnpm --filter api test:e2e
```

## 🔧 Build

```bash
# Build all packages
pnpm build

# Build individual packages
pnpm --filter api build
pnpm --filter web build
```

## 🐳 Docker

### Development
```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f
```

### Production
```bash
# Build and start all services
docker-compose -f docker-compose.yml up -d --build
```

## 📁 Project Structure

```
authnexus/
├── apps/
│   ├── api/                 # NestJS backend
│   │   ├── src/
│   │   │   ├── modules/     # Feature modules
│   │   │   ├── common/      # Shared utilities
│   │   │   └── prisma/      # Database schema
│   │   └── package.json
│   └── web/                 # Next.js frontend
│       ├── app/             # App router
│       ├── components/      # UI components
│       └── package.json
├── packages/
│   └── typescript-config/   # Shared TypeScript configs
├── docker/                  # Docker configurations
├── prisma/                  # Database schema
└── package.json
```

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="mongodb://localhost:27017/authnexus"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="7d"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:3001/auth/google/callback"

# Server
PORT=3001
NODE_ENV=development

# Frontend URL
FRONTEND_URL="http://localhost:3000"
```

## 📝 Available Scripts

### Root
- `pnpm dev` - Start all services in development
- `pnpm build` - Build all packages
- `pnpm lint` - Lint all packages
- `pnpm test` - Run all tests
- `pnpm format` - Format all code

### API
- `pnpm --filter api dev` - Start API in development
- `pnpm --filter api build` - Build API
- `pnpm --filter api test` - Run API tests

### Web
- `pnpm --filter web dev` - Start web app in development
- `pnpm --filter web build` - Build web app
- `pnpm --filter web lint` - Lint web app

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
