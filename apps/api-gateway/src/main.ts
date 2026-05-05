import { NestFactory } from '@nestjs/core';
import {
  ValidationPipe,
  Logger,
  INestApplication,
  RequestMethod,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { MongoIdInterceptor } from './common/interceptors/mongo-id.interceptor';
import cookieParser from 'cookie-parser';
import * as express from 'express';
import { Request, Response, NextFunction } from 'express';

type CorsCallback = (err: Error | null, allow?: boolean) => void;

function normalizeUrl(url: string): string {
  return url.replace(/\/$/, '');
}

async function bootstrap(): Promise<void> {
  const logger = new Logger('API Gateway');

  const app: INestApplication = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // ===== ENV =====
  const payloadLimit: string =
    configService.get<string>('PAYLOAD_LIMIT') ?? '50mb';

  const frontendUrl: string =
    configService.get<string>('FRONTEND_URL') ??
    'https://tthieu-smart-collab.vercel.app';

  const backendUrl: string =
    configService.get<string>('BACKEND_URL') ??
    'https://smart-collab.onrender.com';

  const port: number = Number(process.env.PORT ?? 8000);

  // ===== ALLOWED ORIGINS =====
  const allowedOrigins: string[] = [
    'http://localhost:3000',
    'http://localhost:8000',
    normalizeUrl(frontendUrl),
    normalizeUrl(backendUrl),
  ];

  // ===== CORS =====
  app.enableCors({
    origin: (origin: string | undefined, callback: CorsCallback) => {
      if (!origin) return callback(null, true);

      const normalizedOrigin = normalizeUrl(origin);

      const isAllowed = allowedOrigins.includes(normalizedOrigin);

      if (isAllowed) {
        return callback(null, true);
      }

      logger.warn(`❌ Blocked CORS origin: ${origin}`);
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['set-cookie'],
    optionsSuccessStatus: 204,
  });

  // ===== REQUEST LOGGING (typed) =====
  app.use((req: Request, _res: Response, next: NextFunction): void => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });

  // ===== SECURITY =====
  app.use(cookieParser());
  app.use(helmet());
  app.use(compression());

  // ===== BODY LIMIT =====
  app.use('/api', express.json({ limit: payloadLimit }));
  app.use('/api', express.urlencoded({ limit: payloadLimit, extended: true }));

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

  // ===== INTERCEPTOR =====
  app.useGlobalInterceptors(new MongoIdInterceptor());

  // ===== GLOBAL PREFIX =====
  app.setGlobalPrefix('api', {
    exclude: [
      { path: 'health', method: RequestMethod.GET },
      { path: 'health/ready', method: RequestMethod.GET },
    ],
  });

  // ===== START =====
  await app.listen(port, '0.0.0.0');

  logger.log(`🔧 Environment: ${process.env.NODE_ENV ?? 'development'}`);
  logger.log(`🚀 Payload limit: ${payloadLimit}`);
  logger.log(`🌐 Frontend URL: ${frontendUrl}`);
  logger.log(`🌐 Backend URL: ${backendUrl}`);
  logger.log(`🔥 Server running on port: ${port}`);
}

bootstrap().catch((error: unknown) => {
  console.error('❌ Error starting API Gateway:', error);
  process.exit(1);
});