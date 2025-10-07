import { Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Project, Member } from './dto/project.dto'; // dùng interface duy nhất

@Injectable()
export class ProjectService {
  constructor(private readonly amqp: AmqpConnection) {}

  private sendEvent(event: string, payload: any) {
    console.log(`📤 Sending event "${event}" to exchange "smart-collab":`, payload);
    return this.amqp.publish('smart-collab', event, payload);
  }

  /** Project actions */
  async createProject(dto: Project) {
    await this.sendEvent('project.create', dto);
    console.log('📤 Event queued:', dto);

    return {
      status: 'queued',
      correlationId: dto.correlationId,
      message: 'Project creation requested',
      data: dto,
    };
  }

  async updateProject(dto: Project) {
    await this.sendEvent('project.update', dto);
    console.log('📤 Event queued:', dto);

    return {
      status: 'queued',
      correlationId: dto.correlationId,
      message: 'Project update requested',
      data: dto,
    };
  }

  async deleteProject(dto: Project) {
    await this.sendEvent('project.delete', dto);
    console.log('📤 Event queued:', dto);

    return {
      status: 'queued',
      correlationId: dto.correlationId,
      message: 'Project deletion requested',
      data: dto,
    };
  }

  async getProject(dto: Project) {
    await this.sendEvent('project.get', dto);
    console.log('📤 Event queued:', dto);

    return {
      status: 'queued',
      correlationId: dto.correlationId,
      message: 'Fetch project requested',
      data: dto,
    };
  }

  async getAllProjects(dto: { correlationId: string }) {
    await this.sendEvent('project.get_all', dto);
    console.log('📤 Event queued:', dto);

    return {
      status: 'queued',
      correlationId: dto.correlationId,
      message: 'Fetch all projects requested',
      data: dto,
    };
  }

  /** Member actions */
  async addMember(dto: Member) {
    await this.sendEvent('project.member_add', dto);
    console.log('📤 Event queued:', dto);

    return {
      status: 'queued',
      correlationId: dto.correlationId,
      message: 'Add member requested',
      data: dto,
    };
  }

  async removeMember(dto: Member) {
    await this.sendEvent('project.member_remov', dto);
    console.log('📤 Event queued:', dto);

    return {
      status: 'queued',
      correlationId: dto.correlationId,
      message: 'Remove member requested',
      data: dto,
    };
  }

  async updateMemberRole(dto: Member) {
    await this.sendEvent('project.member_role_update', dto);
    console.log('📤 Event queued:', dto);

    return {
      status: 'queued',
      correlationId: dto.correlationId,
      message: 'Update member role requested',
      data: dto,
    };
  }
}
