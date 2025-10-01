import { NestFactory } from '@nestjs/core';
import { RealtimeModule } from './realtime.module';

async function bootstrap() {
  const app = await NestFactory.create(RealtimeModule);
  await app.listen(3003);
  console.log('🚀 Realtime Service running on http://localhost:3003');
}
bootstrap();
