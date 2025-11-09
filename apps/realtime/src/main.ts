// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { RealtimeModule } from './realtime.module';

async function bootstrap() {
  const app = await NestFactory.create(RealtimeModule);
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  const PORT = config.get<number>('REALTIME_PORT', 3003);
  const HOST = config.get<string>('REALTIME_HOST', '0.0.0.0');

  app.enableCors({ origin: true, credentials: true });

  const shutdown = async (signal: string) => {
    logger.warn(`Received ${signal}`);
    await app.close();
    process.exit(0);
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  await app.listen(PORT, HOST);
  logger.log(`Realtime Service RUNNING on ws://${HOST}:${PORT}`);
}
bootstrap().catch(err => {
  console.error(err);
  process.exit(1);
});