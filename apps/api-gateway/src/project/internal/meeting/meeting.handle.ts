import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MeetingService } from './meeting.service';

@Controller()
export class MeetingHandler {
  private readonly logger = new Logger(MeetingHandler.name);

  constructor(private readonly meetingService: MeetingService) {}

  @MessagePattern({ cmd: 'project.meeting.create' })
  async handleCreateMeeting(@Payload() payload: any) {
    this.logger.log(`[project.meeting.create] Payload: ${JSON.stringify(payload)}`);
    try {
      const result = await this.meetingService.createMeeting({
        projectId: payload.projectId,
        createdById: payload.userId,
        participants: payload.payload.participants,
        title: payload.payload.title,
        contextId: payload.payload.contextId,
      });
      return { success: true, data: result };
    } catch (error: any) {
      this.logger.error(`Failed to create meeting: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  @MessagePattern({ cmd: 'project.meeting.get_all' })
  async handleGetMeetings(@Payload() payload: any) {
    try {
      const result = await this.meetingService.getMeetings(payload.projectId);
      return { success: true, data: result };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
}
