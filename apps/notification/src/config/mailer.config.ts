import { ConfigService } from '@nestjs/config';

export const mailerConfig = (configService: ConfigService) => ({
  transport: {
    host: configService.get<string>('SMTP_HOST') ?? 'smtp.gmail.com',
    port: configService.get<number>('SMTP_PORT') ?? 587,
    secure: false,
    auth: {
      user: configService.get<string>('SMTP_USER'),
      pass: configService.get<string>('SMTP_PASS'),
    },
  },
  defaults: {
    from: configService.get<string>('SMTP_FROM') ?? 'noreply@smartnexus.com',
  },
});
