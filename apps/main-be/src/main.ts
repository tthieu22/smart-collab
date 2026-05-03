import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MainBeModule } from './app.module';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import * as express from 'express';
import { getRabbitMQOptions } from '../../api-gateway/src/config/rabbitmq.config';

async function bootstrap() {
  const logger = new Logger('Main-BE (Consolidated)');
  const app = await NestFactory.create(MainBeModule);
  const configService = app.get(ConfigService);

  const port =  8000;
  const frontendUrl = configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

  // --- HTTP Config (Gateway) ---
  app.enableCors({
    origin: [frontendUrl, 'http://localhost:3000', 'https://smart-collab-frontend.vercel.app'],
    credentials: true,
  });
  app.use(cookieParser());
  app.use(helmet({
    contentSecurityPolicy: false, // Disable for development convenience
  }));
  app.use(compression());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  
  app.useGlobalPipes(new ValidationPipe({ 
    whitelist: true, 
    transform: true,
    transformOptions: { enableImplicitConversion: true }
  }));
  
  app.setGlobalPrefix('api', { exclude: ['health', '/'] });

  // --- Microservices Config (RabbitMQ) ---
  // Listening to all relevant queues in one process
  app.connectMicroservice(getRabbitMQOptions('auth_queue_v2', configService));
  app.connectMicroservice(getRabbitMQOptions('project_queue', configService));
  app.connectMicroservice(getRabbitMQOptions('ai_queue', configService));
  app.connectMicroservice(getRabbitMQOptions('home_requests_queue_v2', configService));

  await app.startAllMicroservices();
  await app.listen(port);
  
  logger.log(`🚀 Unified Backend (Monolith) running on port ${port}`);
  logger.log(`🔗 Frontend URL: ${frontendUrl}`);
}
bootstrap();
