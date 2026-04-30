import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class MeetingService {
  constructor(
    @Inject('PROJECT_SERVICE') private readonly projectClient: ClientProxy,
  ) {}

  async createMeeting(data: any, userId: string) {
    const payload = {
      projectId: data.projectId,
      userId,
      payload: {
        participants: data.payload?.participants,
        title: data.payload?.title,
        contextId: data.payload?.contextId,
      },
    };

    return firstValueFrom(
      this.projectClient.send({ cmd: 'project.meeting.create' }, payload),
    );
  }
}
