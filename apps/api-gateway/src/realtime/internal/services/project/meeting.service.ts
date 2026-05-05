import { Injectable } from '@nestjs/common';
import { ProjectService } from '../../../../project/project.service';

@Injectable()
export class MeetingService {
  constructor(
    private readonly projectService: ProjectService,
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

    return this.projectService.send({ cmd: 'project.meeting.create' }, payload);
  }
}
