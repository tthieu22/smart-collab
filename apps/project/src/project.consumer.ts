import { Injectable } from '@nestjs/common';
import { RabbitSubscribe, AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ProjectService } from './project.service';
import { ProjectMessage } from './dto/project.dto';

@Injectable()
export class ProjectConsumer {
  constructor(
    private readonly amqpConnection: AmqpConnection,
    private readonly projectService: ProjectService,
  ) {}

  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'project.create',
    queue: 'project-service.create',
  })
  async handleCreateProject(msg: ProjectMessage) {
    try {
      const { fullProject, defaultBoard } =
        await this.projectService.createProject(msg);

      await this.amqpConnection.publish('project-exchange', 'project.created', {
        correlationId: msg.correlationId,
        status: 'success',
        project: fullProject,
      });
    } catch (error) {
      console.error('❌ Error in handleCreateProject:', error);
      await this.amqpConnection.publish('project-exchange', 'project.created', {
        correlationId: msg.correlationId,
        status: 'error',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'project.update',
    queue: 'project-service.update',
  })
  async handleUpdateProject(msg: ProjectMessage) {
    try {
      const updated = await this.projectService.updateProject(msg);
      await this.amqpConnection.publish('project-exchange', 'project.updated', {
        correlationId: msg.correlationId,
        status: 'success',
        project: updated,
      });
    } catch (error) {
      console.error('❌ Error in handleUpdateProject:', error);
      await this.amqpConnection.publish('project-exchange', 'project.updated', {
        correlationId: msg.correlationId,
        status: 'error',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'project.delete',
    queue: 'project-service.delete',
  })
  async handleDeleteProject(msg: ProjectMessage) {
    try {
      await this.projectService.deleteProject(msg.projectId!);
      await this.amqpConnection.publish('project-exchange', 'project.deleted', {
        correlationId: msg.correlationId,
        status: 'success',
        projectId: msg.projectId,
      });
    } catch (error) {
      console.error('❌ Error in handleDeleteProject:', error);
      await this.amqpConnection.publish('project-exchange', 'project.deleted', {
        correlationId: msg.correlationId,
        status: 'error',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'project.get',
    queue: 'project-service.get',
  })
  async handleGetProject(msg: ProjectMessage) {
    try {
      const project = await this.projectService.getProjectStructure(msg.projectId!);
      await this.amqpConnection.publish('project-exchange', 'project.fetched', {
        correlationId: msg.correlationId,
        status: 'success',
        project,
      });
    } catch (error) {
      await this.amqpConnection.publish('project-exchange', 'project.fetched', {
        correlationId: msg.correlationId,
        status: 'error',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'project.get_all',
    queue: 'project-service.get_all',
  })
  async handleGetAllProjects(msg: ProjectMessage) {
    try {
      const projects = await this.projectService.getAllProjects();
      await this.amqpConnection.publish('project-exchange', 'project.listed', {
        correlationId: msg.correlationId,
        status: 'success',
        projects,
      });
    } catch (error) {
      console.error('❌ Error in handleGetAllProjects:', error);
      await this.amqpConnection.publish('project-exchange', 'project.listed', {
        correlationId: msg.correlationId,
        status: 'error',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
