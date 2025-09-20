import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';
import { ConfigService } from '@nestjs/config';
import { getRabbitMQMicroserviceOptions } from './config/rabbitmq.config';

async function bootstrap() {
  const app = await NestFactory.create(AuthModule);
  const configService = app.get(ConfigService);

  // Kết nối microservice tới RabbitMQ
  app.connectMicroservice(getRabbitMQMicroserviceOptions('auth_queue', configService));

  await app.startAllMicroservices();
  await app.listen(3001);
}
bootstrap();
