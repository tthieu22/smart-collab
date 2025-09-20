export default () => ({
  port: parseInt(process.env.PORT, 10) || 8000,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  },
  
  // RabbitMQ Configuration
  rabbitmq: {
    user: process.env.RABBITMQ_USER || 'admin',
    password: process.env.RABBITMQ_PASSWORD || 'admin',
    host: process.env.RABBITMQ_HOST || '127.0.0.1',
    port: parseInt(process.env.RABBITMQ_PORT, 10) || 5672,
  },
  
  // Microservices URLs
  microservices: {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    project: process.env.PROJECT_SERVICE_URL || 'http://localhost:3002',
    task: process.env.TASK_SERVICE_URL || 'http://localhost:3003',
    notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004',
    realtime: process.env.REALTIME_SERVICE_URL || 'http://localhost:3005',
    ai: process.env.AI_SERVICE_URL || 'http://localhost:3006',
  },
});

