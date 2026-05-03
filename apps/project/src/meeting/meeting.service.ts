import { Injectable, Logger, Inject } from '@nestjs/common';
import { ProjectPrismaService } from '../../prisma/prisma.service';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ChatService } from '../chat/chat.service';

import { google } from 'googleapis';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';

@Injectable()
export class MeetingService {
  private readonly logger = new Logger(MeetingService.name);

  constructor(
    private readonly prisma: ProjectPrismaService,
    private readonly amqpConnection: AmqpConnection,
    private readonly chatService: ChatService,
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
  ) {}

  async createMeeting(params: {
    projectId: string;
    createdById: string;
    participants: string[];
    title?: string;
    contextId?: string;
  }) {
    const { projectId, createdById, participants, title, contextId } = params;

    if (!createdById) {
      throw new Error('User ID (createdById) is required to create a meeting');
    }

    // 1. Get user tokens from Auth Service (Source of truth: MongoDB)
    let creator: any = null;
    try {
      const authResponse = await firstValueFrom(
        this.authClient.send({ cmd: 'auth.findInternalUser' }, { userId: createdById }).pipe(timeout(5000))
      );
      if (authResponse?.success) {
        creator = authResponse.data;
        this.logger.debug(`🔍 Creator Data from MongoDB: ${JSON.stringify(creator)}`);
      }
    } catch (err: any) {
      this.logger.error(`❌ Failed to fetch creator from Auth Service: ${err.message}`);
    }

    let meetLink = '';

    if (creator && creator.googleAccessToken) {
      try {
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET
        );

        oauth2Client.setCredentials({
          access_token: creator.googleAccessToken,
          refresh_token: creator.googleRefreshToken || undefined
        });

        // Resolve attendee emails from UserCache (still useful for bulk lookup)
        const attendeeRecords = await this.prisma.userCache.findMany({
          where: { id: { in: participants } },
          select: { email: true }
        });
        const attendees = attendeeRecords.map(u => ({ email: u.email }));

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        
        const event = await calendar.events.insert({
          calendarId: 'primary',
          conferenceDataVersion: 1,
          requestBody: {
            summary: title || 'Cuộc họp từ Smart Collab',
            description: `Cuộc họp trong dự án được tạo bởi ${creator.firstName || 'User'}`,
            start: { 
              dateTime: new Date().toISOString(),
              timeZone: 'UTC'
            },
            end: { 
              dateTime: new Date(Date.now() + 3600000).toISOString(),
              timeZone: 'UTC'
            },
            conferenceData: {
              createRequest: {
                requestId: `sc-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                conferenceSolutionKey: { type: 'hangoutsMeet' }
              }
            },
            attendees,
          }
        });

        meetLink = event.data.hangoutLink || event.data.conferenceData?.entryPoints?.[0]?.uri || '';
        if (meetLink) {
          this.logger.log(`✅ Google Meet created: ${meetLink}`);
        } else {
          this.logger.warn('⚠️ Google Meet link not found in response. Response data: ' + JSON.stringify(event.data));
        }
      } catch (err: any) {
        this.logger.error(`❌ Failed to create Google Meet via API: ${err.message}`);
        if (err.response?.data) {
          this.logger.error('API Error Details: ' + JSON.stringify(err.response.data));
        }
      }
    }

    if (!meetLink) {
      this.logger.warn('⚠️ Falling back to mock link generation');
      const randomStr = (len: number) => {
        const chars = 'abcdefghijklmnopqrstuvwxyz';
        let result = '';
        for (let i = 0; i < len; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      };
      meetLink = `https://meet.google.com/${randomStr(3)}-${randomStr(4)}-${randomStr(3)}`;
    }

    // 2. Save to DB
    const meeting = await this.prisma.projectMeeting.create({
      data: {
        projectId,
        createdById,
        participants,
        meetLink,
        title: title || 'Cuộc họp mới',
        contextId,
      },
    });

    // 3. Notify participants via Realtime (Socket.io)
    await this.amqpConnection.publish('smart-collab', 'realtime.meeting.invite', {
      projectId,
      meetingId: meeting.id,
      meetLink,
      participants,
      createdById,
      title: meeting.title,
    });

    // 4. Also post a system message in the chat
    await this.chatService.sendMessage({
      projectId,
      userId: createdById,
      content: `📹 Đã bắt đầu một cuộc họp mới: ${meeting.title}`,
      type: 'SYSTEM',
      metadata: {
        meetingId: meeting.id,
        meetLink,
        action: 'JOIN_MEETING'
      }
    });

    return meeting;
  }
}
