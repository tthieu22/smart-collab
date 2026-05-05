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

  // ===== ENV SAFE HANDLING =====
  const payloadLimit =
    configService.get<string>('PAYLOAD_LIMIT') || '50mb';

  const frontendUrl =
    configService.get<string>('FRONTEND_URL') || 'https://tthieu-smart-collab.vercel.app/';

  // ⚠️ FIX CRITICAL: Render always provides string PORT
  const port = parseInt(process.env.PORT || '8000', 10);

  // ===== CORS =====
  app.enableCors({
    origin:
      process.env.NODE_ENV === 'production'
        ? frontendUrl
        : 'https://tthieu-smart-collab.vercel.app/',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  });

  // ===== REQUEST LOGGING =====
  app.use((req: any, res: any, next: any) => {
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`,
    );
    next();
  });

  // ===== SECURITY =====
  app.use(cookieParser());
  app.use(helmet());
  app.use(compression());

  // ===== BODY LIMIT =====
  app.use('/api', express.json({ limit: payloadLimit }));
  app.use(
    '/api',
    express.urlencoded({ limit: payloadLimit, extended: true }),
  );

  // ===== GLOBAL PIPE =====
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ===== GLOBAL INTERCEPTOR =====
  app.useGlobalInterceptors(new MongoIdInterceptor());

  // ===== GLOBAL PREFIX =====
  app.setGlobalPrefix('api', {
    exclude: ['health', 'health/ready'],
  });

  // ===== START SERVER =====
  await app.listen(port, '0.0.0.0');

  logger.log(`🔧 Environment: ${process.env.NODE_ENV}`);
  logger.log(`🚀 Payload limit: ${payloadLimit}`);
  logger.log(`🌐 Frontend URL: ${frontendUrl}`);
  logger.log(`🔥 Server running on port: ${port}`);
}

bootstrap().catch((error) => {
  console.error('❌ Error starting API Gateway:', error);
  process.exit(1);
});