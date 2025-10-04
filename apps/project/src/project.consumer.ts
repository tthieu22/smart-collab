import { Injectable } from '@nestjs/common';
import { RabbitSubscribe, AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { PrismaService } from '../prisma/prisma.service';

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
    queue: 'project-service',
  })
  async handleCreateProject(msg: { correlationId: string; name: string; description?: string; ownerId: string }) {
    console.log('📩 [Project Service] Received project.create:', msg);

    try {
      // Tạo project và connect owner
      const project = await this.prisma.project.create({
        data: {
          name: msg.name,
          description: msg.description,
          owner: { connect: { id: msg.ownerId } },
        },
      });

      // Tạo folderPath
      const folderPath = `${msg.name.replace(/\s+/g, '_')}_${project.id}`;
      const updatedProject = await this.prisma.project.update({
        where: { id: project.id },
        data: { folderPath },
      });

      // Thêm owner vào ProjectMember
      const ownerMember = await this.prisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: msg.ownerId,
          role: 'ADMIN',
        },
      });

      // Fetch lại project kèm members và owner để trả về đầy đủ thông tin
      const fullProject = await this.prisma.project.findUnique({
        where: { id: project.id },
        include: {
          owner: true,
          members: { include: { user: true } },
        },
      });

      // Emit sự kiện
      await this.amqpConnection.publish('smart-collab', 'project.created', {
        correlationId: msg.correlationId,
        status: 'success',
        project: fullProject,
      });

      console.log('✅ Project created with owner as member:', ownerMember);
    } catch (error) {
      console.error('❌ Error in handleCreateProject:', error);

      await this.amqpConnection.publish('smart-collab', 'project.created', {
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
    queue: 'project-service',
  })
  async handleUpdateProject(msg: { correlationId: string; projectId: string; name?: string; description?: string }) {
    console.log('📩 [Project Service] project.update:', msg);

    const dataToUpdate: { name?: string; description?: string } = {};
    if (msg.name) dataToUpdate.name = msg.name;
    if (msg.description !== undefined) dataToUpdate.description = msg.description;

    const project = await this.prisma.project.update({
      where: { id: msg.projectId },
      data: dataToUpdate,
    });

    // Fetch lại project với members và owner
    const fullProject = await this.prisma.project.findUnique({
      where: { id: project.id },
      include: {
        owner: true,
        members: { include: { user: true } },
      },
    });

    await this.amqpConnection.publish('smart-collab', 'project.updated', {
      correlationId: msg.correlationId,
      status: 'success',
      project: fullProject,
    });

    console.log('♻️ Project updated & event emitted:', fullProject);
  }

  // ================= DELETE PROJECT =================
  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'project.delete',
    queue: 'project-service',
  })
  async handleDeleteProject(msg: { correlationId: string; projectId: string }) {
    console.log('📩 [Project Service] project.delete:', msg);

    const project = await this.prisma.project.delete({
      where: { id: msg.projectId },
    });

    await this.amqpConnection.publish('smart-collab', 'project.deleted', {
      correlationId: msg.correlationId,
      status: 'success',
      project: { id: project.id, deletedAt: new Date() },
    });

    console.log('🗑️ Project deleted & event emitted:', project.id);
  }

  // ================= ADD MEMBER =================
  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'project.member.add',
    queue: 'project-service',
  })
  async handleAddMember(msg: { correlationId: string; projectId: string; userId: string; role?: string }) {
    console.log('📩 [Project Service] project.member.add:', msg);

    const member = await this.prisma.projectMember.create({
      data: {
        projectId: msg.projectId,
        userId: msg.userId,
        role: msg.role || 'MEMBER',
      },
    });

    const fullMember = await this.prisma.projectMember.findUnique({
      where: { id: member.id },
      include: { user: true },
    });

    await this.amqpConnection.publish('smart-collab', 'project.member_added', {
      correlationId: msg.correlationId,
      status: 'success',
      member: fullMember,
    });

    console.log('➕ Member added & event emitted:', fullMember);
  }

  // ================= REMOVE MEMBER =================
  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'project.member.remove',
    queue: 'project-service',
  })
  async handleRemoveMember(msg: { correlationId: string; projectId: string; userId: string }) {
    console.log('📩 [Project Service] project.member.remove:', msg);

    const member = await this.prisma.projectMember.findFirst({
      where: { projectId: msg.projectId, userId: msg.userId },
    });

    if (member) {
      await this.prisma.projectMember.delete({ where: { id: member.id } });

      await this.amqpConnection.publish('smart-collab', 'project.member_removed', {
        correlationId: msg.correlationId,
        status: 'success',
        member: { projectId: msg.projectId, userId: msg.userId },
      });

      console.log('➖ Member removed & event emitted:', member);
    }
  }

  // ================= UPDATE MEMBER ROLE =================
  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'project.member.update_role',
    queue: 'project-service',
  })
  async handleUpdateMemberRole(msg: { correlationId: string; projectId: string; userId: string; role: string }) {
    console.log('📩 [Project Service] project.member.update_role:', msg);

    const member = await this.prisma.projectMember.findFirst({
      where: { projectId: msg.projectId, userId: msg.userId },
    });

    if (member) {
      const updatedMember = await this.prisma.projectMember.update({
        where: { id: member.id },
        data: { role: msg.role },
      });

      const fullMember = await this.prisma.projectMember.findUnique({
        where: { id: updatedMember.id },
        include: { user: true },
      });

      await this.amqpConnection.publish('smart-collab', 'project.member_role_updated', {
        correlationId: msg.correlationId,
        status: 'success',
        member: fullMember,
      });

      console.log('🔄 Member role updated & event emitted:', fullMember);
    }
  }

  // ================= GET PROJECT WITH MEMBERS =================
  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'project.get',
    queue: 'project-service',
  })
  async handleGetProject(msg: { correlationId: string; projectId: string }) {
    console.log('📩 [Project Service] project.get:', msg);

    const project = await this.prisma.project.findUnique({
      where: { id: msg.projectId },
      include: {
        owner: true,
        members: { include: { user: true } },
      },
    });

    await this.amqpConnection.publish('smart-collab', 'project.fetched', {
      correlationId: msg.correlationId,
      status: 'success',
      project,
    });

    console.log('📦 Project fetched & event emitted:', project);
  }

  // ================= LIST PROJECTS =================
  async handleListProjects(msg: { correlationId: string }) {
    console.log('📩 [Project Service] project.list:', msg);

    const projects = await this.prisma.project.findMany({
      include: {
        owner: true,
        members: { include: { user: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    await this.amqpConnection.publish('smart-collab', 'project.listed', {
      correlationId: msg.correlationId,
      status: 'success',
      projects,
    });
  }
}
