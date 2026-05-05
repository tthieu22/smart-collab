import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { MongoIdInterceptor } from './common/interceptors/mongo-id.interceptor';
import cookieParser from 'cookie-parser';
import * as express from 'express';

async function bootstrap() {
  const logger = new Logger('API Gateway');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Lấy env từ ConfigService
  const payloadLimit = configService.get<string>('PAYLOAD_LIMIT') || '50mb';
  const frontendUrl = configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
  const port = configService.get<number>('PORT') || 8000;

  // CORS
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' ? frontendUrl : 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  });

  // Logging request
  app.use((req: any, res: any, next: any) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });

  // Security middleware
  app.use(cookieParser());
  app.use(helmet());
  app.use(compression());

  app.use('/api', express.json({ limit: payloadLimit }));
  app.use('/api', express.urlencoded({ limit: payloadLimit, extended: true }));

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global Interceptor for _id to id mapping
  app.useGlobalInterceptors(new MongoIdInterceptor());

  // Global prefix
  app.setGlobalPrefix('api', {
    exclude: ['health', 'health/ready'],
  });

  await app.listen(port, '0.0.0.0');
  logger.log(`🔧 Environment: ${configService.get<string>('NODE_ENV')}`);
  logger.log(`🚀 Payload limit: ${payloadLimit}`);
  logger.log(`🚀 Server running on port ${port}`);
}

bootstrap().catch((error) => {
  console.error('❌ Error starting API Gateway:', error);
  process.exit(1);
});
