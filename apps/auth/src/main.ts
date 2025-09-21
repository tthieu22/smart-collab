import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';
import { ConfigService } from '@nestjs/config';
import { getRabbitMQMicroserviceOptions } from './config/rabbitmq.config';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Auth Microservice');

  // Khởi tạo app HTTP để vẫn có thể expose healthcheck (tùy anh có cần không)
  const app = await NestFactory.create(AuthModule);

  const configService = app.get(ConfigService);

  // Kết nối microservice RabbitMQ
  app.connectMicroservice(
    getRabbitMQMicroserviceOptions('auth_queue', configService),
  );

  await app.startAllMicroservices();
  app
  .getHttpAdapter()
  .getInstance()
  .on('message', (msg: any) => {
    logger.log(`📩 Received raw message: ${msg.content.toString()}`);
  });

  await app.listen(configService.get<number>('PORT') || 3001);

  logger.log('🚀 Auth Microservice is running');
  logger.log('📊 Listening for messages on queue: auth_queue');
}

bootstrap().catch((error) => {
  console.error('❌ Error starting Auth Microservice:', error);
  process.exit(1);
});
