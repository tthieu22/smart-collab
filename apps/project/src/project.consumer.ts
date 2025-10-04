import { Injectable } from '@nestjs/common';
import { RabbitSubscribe, AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

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
    console.log('📩 [Project Service] project.create:', msg);

    // Tạo project trước để lấy id
    const project = await this.prisma.project.create({
      data: {
        name: msg.name,
        description: msg.description,
        ownerId: msg.ownerId,
      },
    });

    // Tạo folderPath dựa trên name + id
    const folderPath = `${msg.name.replace(/\s+/g, '_')}_${project.id}`;

    // Cập nhật project với folderPath
    const updatedProject = await this.prisma.project.update({
      where: { id: project.id },
      data: { folderPath }  as Prisma.ProjectUncheckedUpdateInput,
    });

    await this.amqpConnection.publish('smart-collab', 'project.created', {
      correlationId: msg.correlationId,
      status: 'success',
      project: updatedProject,
    });

    console.log('✅ Project created & event emitted:', updatedProject);
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

    // Cập nhật project nhưng không đổi folderPath
    const project = await this.prisma.project.update({
      where: { id: msg.projectId },
      data: dataToUpdate,
    });

    await this.amqpConnection.publish('smart-collab', 'project.updated', {
      correlationId: msg.correlationId,
      status: 'success',
      project,
    });

    console.log('♻️ Project updated & event emitted:', project);
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
      project: {
        id: project.id,
        deletedAt: new Date(),
      },
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

    await this.amqpConnection.publish('smart-collab', 'project.member_added', {
      correlationId: msg.correlationId,
      status: 'success',
      member,
    });

    console.log('➕ Member added & event emitted:', member);
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

      await this.amqpConnection.publish('smart-collab', 'project.member_role_updated', {
        correlationId: msg.correlationId,
        status: 'success',
        member: updatedMember,
      });

      console.log('🔄 Member role updated & event emitted:', updatedMember);
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
      include: { members: true, owner: true },
    });

    await this.amqpConnection.publish('smart-collab', 'project.fetched', {
      correlationId: msg.correlationId,
      status: 'success',
      project,
    });

    console.log('📦 Project fetched & event emitted:', project);
  }

  async handleListProjects(msg: { correlationId: string }) {
    console.log('📩 [Project Service] project.list:', msg);

    const projects = await this.prisma.project.findMany({
      include: { members: true, owner: true },
      orderBy: { createdAt: 'desc' },
    });

    await this.amqpConnection.publish('smart-collab', 'project.listed', {
      correlationId: msg.correlationId,
      status: 'success',
      projects,
    });
  }

}
