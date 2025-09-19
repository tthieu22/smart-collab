import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './auth.module';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { rabbitmqConfig } from './config/rabbitmq.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  const nodeEnv = configService.get<string>('NODE_ENV') ?? 'development';
  const frontendUrl =
    configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
  const port = configService.get<number>('PORT') ?? 3001;

  // Log chỉ hiển thị khi NODE_ENV=developer
  if (nodeEnv === 'developer') {
    app.use((req: any, res: any, next: any) => {
      console.log(
        `[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`,
      );
      next();
    });
  }

  app.enableCors({
    origin: nodeEnv === 'production' ? frontendUrl : 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  });

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  // Kết nối microservice RabbitMQ
  app.connectMicroservice(rabbitmqConfig(configService, 'auth_queue'));

  await app.startAllMicroservices();
  await app.listen(port);
}
bootstrap();
