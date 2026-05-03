# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Cài đặt pnpm
RUN npm install -g pnpm

# Copy toàn bộ monorepo (vì các service phụ thuộc lẫn nhau)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/main-be/package.json ./apps/main-be/
COPY apps/api-gateway/package.json ./apps/api-gateway/
COPY apps/auth/package.json ./apps/auth/
COPY apps/project/package.json ./apps/project/
COPY apps/realtime/package.json ./apps/realtime/

# Cài đặt dependencies cho toàn bộ workspace
RUN pnpm install --frozen-lockfile

# Copy mã nguồn
COPY . .

# Tạo Prisma Clients cho các service
RUN pnpm --filter auth exec prisma generate
RUN pnpm --filter project exec prisma generate

# Build service main-be
RUN pnpm --filter main-be build

# Production stage
FROM node:20-alpine AS runtime
WORKDIR /app
RUN npm install -g pnpm

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/main-be/dist ./apps/main-be/dist
COPY --from=build /app/apps/main-be/package.json ./apps/main-be/
COPY --from=build /app/package.json ./

# Cài đặt production dependencies
RUN pnpm install --prod --frozen-lockfile

EXPOSE 8000

ENV NODE_ENV=production

CMD ["node", "apps/main-be/dist/src/main"]
