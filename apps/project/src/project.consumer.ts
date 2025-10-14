import { Injectable } from '@nestjs/common';
import { RabbitSubscribe, AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectMessage } from './dto/project.dto';

@Injectable()
export class ProjectConsumer {
  constructor(
    private readonly amqpConnection: AmqpConnection,
    private readonly prisma: PrismaService,
  ) { }

  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'project.create',
    queue: 'project-service.create',
  })
  async handleCreateProject(msg: ProjectMessage) {
    console.log('📩 Received project.create:', msg);
    try {
      const project = await this.prisma.project.create({
        data: {
          name: msg.name!,
          description: msg.description,
          owner: { connect: { id: msg.ownerId! } },
          color: msg.color,
          background: msg.background,
          visibility: msg.visibility ?? "private",
        },
      });

      const slugify = (str: string) =>
        str
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') 
          .replace(/[^a-zA-Z0-9\s_-]/g, '') 
          .trim()
          .replace(/\s+/g, '_')
          .toLowerCase();

      const folderPath = `${slugify(msg.name!)}_${project.id}`;

      await this.prisma.project.update({
        where: { id: project.id },
        data: { folderPath },
      });

      await this.prisma.projectMember.create({
        data: { projectId: project.id, userId: msg.ownerId!, role: 'ADMIN' },
      });

      const fullProject = await this.prisma.project.findUnique({
        where: { id: project.id },
        include: { owner: true, members: { include: { user: true } } },
      });

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
      const file = msg.files?.[0];
      const updatedProject = await this.prisma.project.update({
        where: { id: msg.projectId! },
        data: {
          name: msg.name,
          description: msg.description,
          folderPath: msg.folderPath,
          color: msg.color,
          publicId: file?.publicId,
          fileUrl: file?.url,
          fileType: file?.type,
          fileSize: file?.size,
          resourceType: file?.resourceType,
          originalFilename: file?.originalFilename,
          uploadedById: msg.uploadedById,
        },
      });

      await this.amqpConnection.publish('project-exchange', 'project.updated', {
        correlationId: msg.correlationId,
        status: 'success',
        project: updatedProject,
      });
    } catch (error) {
      console.error('❌ Error in handleUpdateProject:', error);
      await this.amqpConnection.publish('project-exchange', 'project.updated', {
        correlationId: msg.correlationId,
        status: 'error',
        message: error,
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
      await this.prisma.project.delete({ where: { id: msg.projectId! } });
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
        message: error,
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
      const project = await this.prisma.project.findUnique({
        where: { id: msg.projectId! },
        include: { owner: true, members: { include: { user: true } } },
      });

      await this.amqpConnection.publish('project-exchange', 'project.fetched', {
        correlationId: msg.correlationId,
        status: 'success',
        project,
      });
    } catch (error) {
      console.error('❌ Error in handleGetProject:', error);
      await this.amqpConnection.publish('project-exchange', 'project.fetched', {
        correlationId: msg.correlationId,
        status: 'error',
        message: error,
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
      const projects = await this.prisma.project.findMany({
        include: { owner: true, members: { include: { user: true } } },
        // take: 5,          // Lấy tối đa 10 project
        skip: 0,           // Bỏ qua 0 project đầu tiên
        orderBy: {
          createdAt: 'desc' // Lấy theo thứ tự mới nhất
        },
      });

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
        message: error,
      });
    }
  }
}
