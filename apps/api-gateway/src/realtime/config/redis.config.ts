import { ConfigService } from '@nestjs/config';

export const redisConfig = (configService: ConfigService) => {
  const options: any = {
    host: configService.get<string>('REDIS_HOST') ?? '127.0.0.1',
    port: configService.get<number>('REDIS_PORT') ?? 6379,
  };

  const username = configService.get<string>('REDIS_USERNAME');
  const password = configService.get<string>('REDIS_PASSWORD');
  const db = configService.get<number>('REDIS_DB');

  if (username) options.username = username;
  if (password) options.password = password;
  if (db !== undefined) options.db = db;

  return {
    type: 'single' as const,
    options,
  };
};
