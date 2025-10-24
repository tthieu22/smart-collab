import { Injectable } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { RealtimeGateway } from '../realtime.gateway';
import { ProjectMessage } from './dto/project.dto';

@Injectable()
export class ProjectRealtimeConsumer {
  constructor(private readonly gateway: RealtimeGateway) {}

  // ------------------- Project Created -------------------
  @RabbitSubscribe({
    exchange: 'project-exchange',
    routingKey: 'project.created',
    queue: 'realtime-service.created',
  })
  async handleProjectCreated(msg: ProjectMessage) {
    console.log('📩 [Realtime] project.created:', msg);
    if (msg.projectId) {
      await this.gateway.emitToProject(msg.projectId, 'realtime.project.created', msg);
    } else if (msg.userId) {
      await this.gateway.emitToUser(msg.userId, 'realtime.project.created', msg);
    } else {
      this.gateway.server.emit('realtime.project.created', msg);
    }
  }

  // ------------------- Project Updated -------------------
  @RabbitSubscribe({
    exchange: 'project-exchange',
    routingKey: 'project.updated',
    queue: 'realtime-service.updated',
  })
  async handleProjectUpdated(msg: ProjectMessage) {
    console.log('📩 [Realtime] project.updated:', msg);
    if (msg.projectId) {
      await this.gateway.emitToProject(msg.projectId, 'realtime.project.updated', msg);
    } else if (msg.userId) {
      await this.gateway.emitToUser(msg.userId, 'realtime.project.updated', msg);
    } else {
      this.gateway.server.emit('realtime.project.updated', msg);
    }
  }

  // ------------------- Project Deleted -------------------
  @RabbitSubscribe({
    exchange: 'project-exchange',
    routingKey: 'project.deleted',
    queue: 'realtime-service.deleted',
  })
  async handleProjectDeleted(msg: ProjectMessage) {
    console.log('📩 [Realtime] project.deleted:', msg);
    if (msg.projectId) {
      await this.gateway.emitToProject(msg.projectId, 'realtime.project.deleted', msg);
    } else if (msg.userId) {
      await this.gateway.emitToUser(msg.userId, 'realtime.project.deleted', msg);
    } else {
      this.gateway.server.emit('realtime.project.deleted', msg);
    }
  }

  // ------------------- Project Fetched -------------------
  @RabbitSubscribe({
    exchange: 'project-exchange',
    routingKey: 'project.fetched',
    queue: 'realtime-service.fetched',
  })
  async handleProjectFetched(msg: ProjectMessage) {
    console.log('📩 [Realtime] project.fetched:', msg);
    const payload = {
      correlationId: msg.correlationId,
      status: 'success',
      project: msg.project,
    };

    if (msg.projectId) {
      await this.gateway.emitToProject(msg.projectId, 'realtime.project.fetched', payload);
    } else if (msg.userId) {
      await this.gateway.emitToUser(msg.userId, 'realtime.project.fetched', payload);
    } else {
      this.gateway.server.emit('realtime.project.fetched', payload);
    }
  }

  // ------------------- Project Listed -------------------
  @RabbitSubscribe({
    exchange: 'project-exchange',
    routingKey: 'project.listed',
    queue: 'realtime-service.listed',
  })
  async handleProjectListed(msg: ProjectMessage) {
    console.log('📩 [Realtime] project.listed:', msg);

    const payload = {
      correlationId: msg.correlationId,
      data: msg.projects || [],
    };

    // Nếu msg.userId có giá trị, emit tới user cụ thể
    if (msg.userId) {
      await this.gateway.emitToUser(msg.userId, 'realtime.project.listed', payload);
    } else {
      // fallback: emit toàn cục
      this.gateway.server.emit('realtime.project.listed', payload);
    }
  }

}
