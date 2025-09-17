1️⃣ Kiến trúc tổng quan
Frontend (React/Next.js)
        |
        | WebSocket / HTTP API
        v
Backend Node.js / NestJS / Express
        |
  ----------------------------
  |                          |
Prisma Client               MongoDB Client / Mongoose
(User, Role, Billing)       (Chat, Message, Notification)
  |
Redis (Pub/Sub, cache)
