import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThrottlerGuard } from '@nestjs/throttler';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const logger = new Logger('API Gateway');
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin:
      process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL
        : 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  });

  const configService = app.get(ConfigService);
  app.use((req: any, res: any, next: any) => {
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`,
    );
    next();
  });

  // Security middleware
  app.use(cookieParser());
  app.use(helmet());
  app.use(compression());

  // Global validation pipe
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

  // Global prefix
  app.setGlobalPrefix('api', {
    exclude: ['health', 'health/ready'],
  });

  // Rate limiting guard
  // app.useGlobalGuards(app.get(ThrottlerGuard));

  const port = configService.get<number>('port') || 8000;

  await app.listen(port);

  logger.log(`🚀 API Gateway is running on: http://localhost:${port}`);
  logger.log(`📊 Health check: http://localhost:${port}/health`);
  logger.log(`🔧 Environment: ${configService.get<string>('nodeEnv')}`);
}

bootstrap().catch((error) => {
  console.error('❌ Error starting API Gateway:', error);
  process.exit(1);
});
