import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationService {
  async sendInApp(userId: string, message: string) {
    return { userId, message, status: 'sent' };
  }
}
