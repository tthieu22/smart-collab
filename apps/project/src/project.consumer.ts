import { Injectable } from '@nestjs/common';
import { RabbitSubscribe, AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { PrismaService } from '../prisma/prisma.service';

interface Correlation {
  correlationId: string;
}

interface ProjectMessage extends Correlation {
  projectId?: string;
  name?: string;
  description?: string;
  ownerId?: string;
  userId?: string;
  role?: string;
  folderPath?: string;
  color?: string;
  [key: string]: any;
}

@Injectable()
export class ProjectConsumer {
  constructor(
    private readonly amqpConnection: AmqpConnection,
    private readonly prisma: PrismaService,
  ) {}

  // ================= CREATE PROJECT =================
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
        },
      });

      const folderPath = `${msg.name!.replace(/\s+/g, '_')}_${project.id}`;
      await this.prisma.project.update({ where: { id: project.id }, data: { folderPath } });

      await this.prisma.projectMember.create({
        data: { projectId: project.id, userId: msg.ownerId!, role: 'ADMIN' },
      });

      const fullProject = await this.prisma.project.findUnique({
        where: { id: project.id },
        include: { owner: true, members: { include: { user: true } } },
      });

      await this.amqpConnection.publish('smart-collab', 'realtime.project.created', {
        correlationId: msg.correlationId,
        status: 'success',
        project: fullProject,
      });
    } catch (error) {
      console.error('❌ Error in handleCreateProject:', error);
      await this.amqpConnection.publish('smart-collab', 'realtime.project.created', {
        correlationId: msg.correlationId,
        status: 'error',
        message: error,
      });
    }
  }

  // ================= UPDATE PROJECT =================
  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'project.update',
    queue: 'project-service.update',
  })
  async handleUpdateProject(msg: ProjectMessage) {
    try {
      const updatedProject = await this.prisma.project.update({
        where: { id: msg.projectId! },
        data: {
          name: msg.name,
          description: msg.description,
          folderPath: msg.folderPath,
          color: msg.color,
          publicId: msg.publicId,
          fileUrl: msg.fileUrl,
          fileType: msg.fileType,
          fileSize: msg.fileSize,
          resourceType: msg.resourceType,
          originalFilename: msg.originalFilename,
          uploadedById: msg.uploadedById,
        },
      });

      await this.amqpConnection.publish('smart-collab', 'realtime.project.updated', {
        correlationId: msg.correlationId,
        status: 'success',
        project: updatedProject,
      });
    } catch (error) {
      console.error('❌ Error in handleUpdateProject:', error);
      await this.amqpConnection.publish('smart-collab', 'realtime.project.updated', {
        correlationId: msg.correlationId,
        status: 'error',
        message: error,
      });
    }
  }

  // ================= DELETE PROJECT =================
  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'project.delete',
    queue: 'project-service.delete',
  })
  async handleDeleteProject(msg: ProjectMessage) {
    try {
      await this.prisma.project.delete({ where: { id: msg.projectId! } });
      await this.amqpConnection.publish('smart-collab', 'realtime.project.deleted', {
        correlationId: msg.correlationId,
        status: 'success',
        projectId: msg.projectId,
      });
    } catch (error) {
      console.error('❌ Error in handleDeleteProject:', error);
      await this.amqpConnection.publish('smart-collab', 'realtime.project.deleted', {
        correlationId: msg.correlationId,
        status: 'error',
        message: error,
      });
    }
  }

  // ================= GET PROJECT =================
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

      await this.amqpConnection.publish('smart-collab', 'realtime.project.fetched', {
        correlationId: msg.correlationId,
        status: 'success',
        project,
      });
    } catch (error) {
      console.error('❌ Error in handleGetProject:', error);
      await this.amqpConnection.publish('smart-collab', 'realtime.project.fetched', {
        correlationId: msg.correlationId,
        status: 'error',
        message: error,
      });
    }
  }

  // ================= GET ALL PROJECTS =================
  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'project.get_all',
    queue: 'project-service.get_all',
  })
  async handleGetAllProjects(msg: ProjectMessage) {
    try {
      const projects = await this.prisma.project.findMany({
        include: { owner: true, members: { include: { user: true } } },
      });

      await this.amqpConnection.publish('smart-collab', 'realtime.project.listed', {
        correlationId: msg.correlationId,
        status: 'success',
        projects,
      });
    } catch (error) {
      console.error('❌ Error in handleGetAllProjects:', error);
      await this.amqpConnection.publish('smart-collab', 'realtime.project.listed', {
        correlationId: msg.correlationId,
        status: 'error',
        message: error,
      });
    }
  }

  // ================= ADD MEMBER =================
  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'project.member_added',
    queue: 'project-service.member_added',
  })
  async handleAddMember(msg: ProjectMessage) {
    try {
      const member = await this.prisma.projectMember.create({
        data: { projectId: msg.projectId!, userId: msg.userId!, role: msg.role || 'MEMBER' },
      });

      await this.amqpConnection.publish('smart-collab', 'realtime.project.member_added', {
        correlationId: msg.correlationId,
        status: 'success',
        projectId: msg.projectId,
        userId: msg.userId,
        member,
      });
    } catch (error) {
      console.error('❌ Error in handleAddMember:', error);
      await this.amqpConnection.publish('smart-collab', 'realtime.project.member_added', {
        correlationId: msg.correlationId,
        status: 'error',
        message: error,
      });
    }
  }

  // ================= REMOVE MEMBER =================
  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'project.member_removed',
    queue: 'project-service.member_removed',
  })
  async handleRemoveMember(msg: ProjectMessage) {
    try {
      await this.prisma.projectMember.delete({
        where: { projectId_userId: { projectId: msg.projectId!, userId: msg.userId! } },
      });

      await this.amqpConnection.publish('smart-collab', 'realtime.project.member_removed', {
        correlationId: msg.correlationId,
        status: 'success',
        projectId: msg.projectId,
        userId: msg.userId,
      });
    } catch (error) {
      console.error('❌ Error in handleRemoveMember:', error);
      await this.amqpConnection.publish('smart-collab', 'realtime.project.member_removed', {
        correlationId: msg.correlationId,
        status: 'error',
        message: error,
      });
    }
  }

  // ================= UPDATE MEMBER ROLE =================
  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'project.member_role_updated',
    queue: 'project-service.member_role_updated',
  })
  async handleUpdateMemberRole(msg: ProjectMessage) {
    try {
      const member = await this.prisma.projectMember.update({
        where: { projectId_userId: { projectId: msg.projectId!, userId: msg.userId! } },
        data: { role: msg.role! },
      });

      await this.amqpConnection.publish('smart-collab', 'realtime.project.member_role_updated', {
        correlationId: msg.correlationId,
        status: 'success',
        projectId: msg.projectId,
        userId: msg.userId,
        member,
      });
    } catch (error) {
      console.error('❌ Error in handleUpdateMemberRole:', error);
      await this.amqpConnection.publish('smart-collab', 'realtime.project.member_role_updated', {
        correlationId: msg.correlationId,
        status: 'error',
        message: error,
      });
    }
  }
}
