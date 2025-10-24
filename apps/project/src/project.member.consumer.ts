import { Injectable } from '@nestjs/common';
import { RabbitSubscribe, AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectMessage } from './dto/project.dto';

type RoleType = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

@Injectable()
export class ProjectMemberConsumer {
  constructor(
    private readonly amqpConnection: AmqpConnection,
    private readonly prisma: PrismaService,
  ) {}

  private validateRole(role?: string): RoleType {
    const roles: RoleType[] = ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'];
    return roles.includes(role as RoleType) ? (role as RoleType) : 'MEMBER';
  }

  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'project.member_add',
    queue: 'project-service.member_add',
  })
  async handleAddMember(msg: ProjectMessage) {
    try {
      const role = this.validateRole(msg.role);

      const member = await this.prisma.projectMember.create({
        data: { projectId: msg.projectId!, userId: msg.userId!, role },
      });

      await this.amqpConnection.publish('project-exchange', 'project.member_added', {
        correlationId: msg.correlationId,
        status: 'success',
        projectId: msg.projectId,
        userId: msg.userId,
        member,
      });
    } catch (error) {
      console.error('❌ Error in handleAddMember:', error);
      await this.amqpConnection.publish('project-exchange', 'project.member_added', {
        correlationId: msg.correlationId,
        status: 'error',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'project.member_remove',
    queue: 'project-service.member_remove',
  })
  async handleRemoveMember(msg: ProjectMessage) {
    try {
      await this.prisma.projectMember.delete({
        where: { projectId_userId: { projectId: msg.projectId!, userId: msg.userId! } },
      });

      await this.amqpConnection.publish('project-exchange', 'project.member_removed', {
        correlationId: msg.correlationId,
        status: 'success',
        projectId: msg.projectId,
        userId: msg.userId,
      });
    } catch (error) {
      console.error('❌ Error in handleRemoveMember:', error);
      await this.amqpConnection.publish('project-exchange', 'project.member_removed', {
        correlationId: msg.correlationId,
        status: 'error',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  @RabbitSubscribe({
    exchange: 'smart-collab',
    routingKey: 'project.member_role_update',
    queue: 'project-service.member_role_update',
  })
  async handleUpdateMemberRole(msg: ProjectMessage) {
    try {
      const role = this.validateRole(msg.role);

      const member = await this.prisma.projectMember.update({
        where: { projectId_userId: { projectId: msg.projectId!, userId: msg.userId! } },
        data: { role },
      });

      await this.amqpConnection.publish('project-exchange', 'project.member_role_updated', {
        correlationId: msg.correlationId,
        status: 'success',
        projectId: msg.projectId,
        userId: msg.userId,
        member,
      });
    } catch (error) {
      console.error('❌ Error in handleUpdateMemberRole:', error);
      await this.amqpConnection.publish('project-exchange', 'project.member_role_updated', {
        correlationId: msg.correlationId,
        status: 'error',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
