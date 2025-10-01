import { NestFactory } from '@nestjs/core';
import { ProjectModule } from './project.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(ProjectModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Không mở HTTP port vì đây là service nền (event-driven)
  // Nếu muốn expose REST API thì dùng: await app.listen(3001);
  await app.listen(3002);
  console.log('🚀 Project Service running on http://localhost:3002');

  Logger.log('🚀 Project Service is running and listening to RabbitMQ events', 'Bootstrap');
}
bootstrap();
