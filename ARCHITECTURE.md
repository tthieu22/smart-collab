# SmartCollab Monorepo Architecture

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (Next.js)                     │
│                   Port 3000                              │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│              API Gateway (NestJS)                        │
│              Port 3100                                   │
└──────────────┬──────────────────────┬───────────────────┘
               │                      │
   ┌───────────▼────────┐  ┌─────────▼────────┐
   │  Project Service   │  │  Auth Service    │
   │  (NestJS)          │  │  (NestJS)        │
   │  Port 3002         │  │  Port 3001       │
   │  PostgreSQL        │  │  MongoDB         │
   └───────────┬────────┘  └─────────┬────────┘
               │                      │
   ┌───────────▼────────┐  ┌─────────▼────────┐
   │ Realtime Service   │  │  Home Service    │
   │ (NestJS WebSocket) │  │  (Spring Boot)   │
   │ Port 3003          │  │  Port 3002       │
   └────────────────────┘  └──────────────────┘
               │
   ┌───────────▼────────┐
   │ Notification Svc   │
   │ (Spring Boot)      │
   │ Port 3004          │
   └────────────────────┘
```

## 📦 Service Description

### Frontend
- **Technology:** Next.js 14
- **Port:** 3000
- **Purpose:** Web UI for project management
- **Features:** Real-time updates via WebSocket, responsive design

### API Gateway
- **Technology:** NestJS
- **Port:** 3100
- **Purpose:** Central entry point, request routing, authentication
- **Features:** JWT validation, rate limiting, request logging

### Project Service
- **Technology:** NestJS
- **Port:** 3002
- **Database:** PostgreSQL
- **Purpose:** Project management (boards, cards, columns)
- **Models:** Project, Board, Card, Column, etc.

### Auth Service
- **Technology:** NestJS
- **Port:** 3001
- **Database:** MongoDB
- **Purpose:** User authentication and management
- **Features:** JWT, Google OAuth, email verification, refresh tokens

### Realtime Service
- **Technology:** NestJS + Socket.io
- **Port:** 3003
- **Purpose:** WebSocket server for real-time updates
- **Features:** Live collaboration, notifications, presence

### Home Service (Spring Boot)
- **Technology:** Spring Boot 3.3
- **Port:** 3002 (Java services can run on same or different ports)
- **Database:** MongoDB
- **Purpose:** Home feed and social features
- **Features:** Feed, posts, followers, notifications

### Notification Service (Spring Boot)
- **Technology:** Spring Boot 3.3
- **Port:** 3004
- **Database:** MongoDB
- **Purpose:** Send notifications (email, in-app, SMS)
- **Features:** Async processing, scheduled tasks, templating

## 🔌 Message Queue & Cache

### RabbitMQ
- **Purpose:** Async communication between services
- **Host:** 127.0.0.1:5672
- **Credentials:** admin/admin
- **Queues:**
  - `project.events` - Project updates
  - `user.notifications` - User notifications
  - `email.queue` - Email sending

### Redis
- **Purpose:** Caching and session storage
- **Host:** 127.0.0.1:6379
- **Use Cases:**
  - JWT token blacklist
  - Session cache
  - Real-time data cache
  - Rate limiting

## 📚 Shared Libraries

### @smart-collab/shared
- Common utilities and helpers
- Shared DTOs and types
- Database connection pooling
- Configuration management

### @smart-collab/events
- Event type definitions
- Event emitter patterns
- Message queue schemas

### @smart-collab/mailer
- Email templates
- Mail service implementation
- SMTP configuration

## 🗄️ Database Schema

### PostgreSQL (Project Service)
```sql
-- Main entities
Projects, ProjectMembers, Boards, Columns, Cards
CardComments, CardLabels, CardViews, Attachments
ChecklistItems, EventStatistics
```

### MongoDB (Auth & Social Services)
```javascript
// Users and authentication
Users, RefreshTokens

// Social features
Posts, Comments, Reactions, Notifications, Followers
```

## 🔐 Authentication Flow

1. User logs in via `/api/auth/login` (Auth Service)
2. Auth Service validates credentials
3. Returns JWT access token + refresh token
4. Client stores tokens
5. Every request includes Bearer token
6. API Gateway validates token
7. Request routed to appropriate service

## 🔄 Data Flow Example: Creating a Card

```
Frontend
  │
  ├─> POST /api/projects/:id/cards
  │
API Gateway
  │ (Validates JWT)
  │
Project Service
  │ (Saves to PostgreSQL)
  │
  ├─> Emit event to RabbitMQ
  │
Realtime Service
  │ (Receives event)
  │
  └─> Broadcast via WebSocket to all connected clients
```

## 🌐 External Services

### Cloudinary
- Image upload and storage
- Image transformation
- CDN delivery

### Email (SMTP)
- Gmail SMTP for email sending
- Used for notifications and verification

### OAuth Providers
- Google OAuth for social login

### AI Services
- OpenAI - Chat completions
- Gemini - Image analysis
- Groq - Fast inference
- Claude - Advanced reasoning

## ⚙️ Configuration Management

### Environment Variables
All services use `.env` files for configuration:
- Database connections
- API keys
- Service ports
- Message queue credentials
- Email credentials

### Shared Configuration
Root-level `.env` for variables used by multiple services.

## 📊 Monitoring & Logging

### Spring Boot Services
- Actuator endpoints: `/actuator/health`, `/actuator/metrics`
- Prometheus metrics: `/actuator/prometheus`
- Logs: Written to `java-service/logs/`

### NestJS Services
- Winston logger integration
- Request/response logging
- Error tracking

### Frontend
- Console logging
- Error boundary integration
- Analytics integration

## 🚀 Deployment Architecture

### Development
All services run locally on different ports.

### Production Recommendations
- Use Docker containers for each service
- Orchestrate with Kubernetes or Docker Compose
- Separate PostgreSQL and MongoDB instances
- Managed Redis and RabbitMQ services
- CDN for static assets
- Load balancer for API Gateway

## 📈 Scalability Considerations

### Horizontal Scaling
- Stateless services can run multiple instances
- Load balance via API Gateway
- Use RabbitMQ for service-to-service communication

### Database Scaling
- PostgreSQL: Read replicas for reporting
- MongoDB: Sharding for large collections
- Redis: Cluster mode for high availability

### Caching Strategy
- Cache frequently accessed data in Redis
- Implement cache invalidation on updates
- Use CDN for static assets

---

**Last Updated:** 2024
**Version:** 1.0
