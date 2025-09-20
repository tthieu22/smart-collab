# API Gateway

API Gateway cho hệ thống Smart Collab, đóng vai trò là entry point chính cho tất cả các request từ frontend.

## Chức năng

- **Authentication**: JWT-based authentication với auth service
- **Authorization**: Route protection và user context
- **Service Discovery**: Proxy requests đến các microservices
- **Rate Limiting**: Giới hạn số lượng request
- **Security**: CORS, Helmet, Validation
- **Health Checks**: Monitoring endpoints

## Cấu hình Environment

Tạo file `.env` với các biến sau:

```env
# API Gateway Configuration
PORT=8000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=15m

# RabbitMQ Configuration
RABBITMQ_USER=admin
RABBITMQ_PASSWORD=admin
RABBITMQ_HOST=127.0.0.1
RABBITMQ_PORT=5672

# Microservices URLs (for future HTTP fallback)
AUTH_SERVICE_URL=http://localhost:3001
PROJECT_SERVICE_URL=http://localhost:3002
TASK_SERVICE_URL=http://localhost:3003
NOTIFICATION_SERVICE_URL=http://localhost:3004
REALTIME_SERVICE_URL=http://localhost:3005
AI_SERVICE_URL=http://localhost:3006
```

## API Endpoints

### Authentication (Public)
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Đăng xuất

### Projects (Protected)
- `GET /api/projects` - Lấy danh sách projects
- `GET /api/projects/:id` - Lấy project theo ID
- `POST /api/projects` - Tạo project mới
- `PUT /api/projects/:id` - Cập nhật project
- `DELETE /api/projects/:id` - Xóa project

### Tasks (Protected)
- `GET /api/tasks` - Lấy danh sách tasks
- `GET /api/tasks/:id` - Lấy task theo ID
- `POST /api/tasks` - Tạo task mới
- `PUT /api/tasks/:id` - Cập nhật task
- `DELETE /api/tasks/:id` - Xóa task

### Health Check (Public)
- `GET /health` - Health check
- `GET /health/ready` - Readiness check

## Chạy ứng dụng

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## Kiến trúc

API Gateway sử dụng:
- **RabbitMQ**: Giao tiếp với các microservices
- **JWT**: Xác thực và phân quyền
- **Passport**: Authentication strategies
- **Throttler**: Rate limiting
- **Helmet**: Security headers
- **Compression**: Response compression