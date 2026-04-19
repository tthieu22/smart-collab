import { Injectable, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BoardService } from './board/board.service';
import { ProjectMessage } from './dto/project.dto';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class ProjectService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly boardService: BoardService,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  private readonly logger = new Logger(ProjectService.name);

  private slugify(str: string): string {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9\s_-]/g, '')
      .trim()
      .replace(/\s+/g, '_')
      .toLowerCase();
  }

  private mapMembers(project: any) {
    if (project && project.members) {
      project.members = project.members.map((m: any) => ({
        ...m,
        user: {
          id: m.userId,
          firstName: m.userName || m.userEmail || 'User',
          avatar: m.userAvatar,
          email: m.userEmail,
        },
      }));
    }
    return project;
  }

  async createProject(msg: ProjectMessage) {
    const project = await this.prisma.project.create({
      data: {
        name: msg.name!,
        description: msg.description,
        ownerId: msg.ownerId!,
        color: msg.color,
        background: msg.background,
        visibility: msg.visibility ?? 'PRIVATE',
      },
    });

    await this.ensureDefaultBoards(msg.ownerId!);
    
    const folderPath = `${this.slugify(msg.name!)}_${project.id}`;
    await this.prisma.project.update({
      where: { id: project.id },
      data: { folderPath },
    });

    await this.prisma.projectMember.create({
      data: { 
        projectId: project.id, 
        userId: msg.ownerId!, 
        role: 'OWNER', // Change from ADMIN to OWNER for the creator
        userName: (msg as any).userName,
        userAvatar: (msg as any).userAvatar,
        userEmail: (msg as any).userEmail
      },
    });

    const defaultBoard = await this.boardService.createBoard({
      projectId: project.id,
      ownerId: msg.ownerId,
      type: 'board',
      title: 'Main Board',
    });

    const fullProject = await this.prisma.project.findUnique({
      where: { id: project.id },
      include: { members: true },
    });

    return { fullProject, defaultBoard };
  }

  async updateProject(msg: ProjectMessage) {
    const file = msg.files?.[0];
    return this.prisma.project.update({
      where: { id: msg.projectId! },
      data: {
        name: msg.name,
        description: msg.description,
        folderPath: msg.folderPath,
        color: msg.color,
        background: msg.background,
        publicId: file?.publicId,
        fileUrl: file?.url,
        fileType: file?.type,
        fileSize: file?.size,
        resourceType: file?.resourceType,
        originalFilename: file?.originalFilename,
        uploadedById: msg.uploadedById,
        visibility: msg.visibility,
      },
    });
  }

  async deleteProject(projectId: string) {
    return this.prisma.project.delete({ where: { id: projectId } });
  }

  async getProjectStructure(projectId: string, userId?: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });

    if (!project) throw new NotFoundException('Project not found');

    if (project.visibility !== 'PUBLIC') {
      if (!userId) throw new ForbiddenException('Access denied');

      if (project.ownerId !== userId) {
        const isMember = project.members.some(m => m.userId === userId);
        if (!isMember) throw new ForbiddenException('Access denied');
      }
    }

    // Ensure personal boards exist for the current user context.
    if (userId) {
      await this.ensureDefaultBoards(userId);
    } else {
      await this.ensureDefaultBoards(project.ownerId);
    }

    const structure = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        description: true,
        ownerId: true,
        folderPath: true,
        visibility: true,
        color: true,
        background: true,
        publicId: true,
        fileUrl: true,
        fileType: true,
        fileSize: true,
        originalFilename: true,
        uploadedById: true,
        members: true,
        boards: {
          orderBy: { position: 'asc' },
          select: {
            id: true,
            title: true,
            type: true,
            position: true,
            columns: {
              orderBy: { position: 'asc' },
              select: {
                id: true,
                boardId: true,
                title: true,
                position: true,
                metadata: true,
                createdAt: true,
                updatedAt: true,
                cards: {
                  orderBy: { position: 'asc' },
                  select: {
                    id: true,
                    projectId: true,
                    columnId: true,
                    title: true,
                    description: true,
                    status: true,
                    deadline: true,
                    priority: true,
                    position: true,
                    createdById: true,
                    createdByName: true,
                    createdByAvatar: true,
                    updatedById: true,
                    updatedByName: true,
                    updatedByAvatar: true,
                    createdAt: true,
                    updatedAt: true,
                    coverPublicId: true,
                    coverUrl: true,
                    coverFileType: true,
                    coverFileSize: true,
                    coverResourceType: true,
                    coverFilename: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const specialBoards = await this.prisma.board.findMany({
      where: {
        ownerId: userId ?? project.ownerId,
        projectId: null,
        type: { in: ['inbox', 'calendar'] },
      },
      select: {
        id: true,
        title: true,
        type: true,
        position: true,
        columns: {
          orderBy: { position: 'asc' },
          select: {
            id: true,
            boardId: true,
            title: true,
            position: true,
            metadata: true,
            createdAt: true,
            updatedAt: true,
            cards: {
              orderBy: { position: 'asc' },
              select: {
                id: true,
                projectId: true,
                columnId: true,
                title: true,
                description: true,
                status: true,
                deadline: true,
                priority: true,
                position: true,
                createdById: true,
                createdByName: true,
                createdByAvatar: true,
                updatedById: true,
                updatedByName: true,
                updatedByAvatar: true,
                createdAt: true,
                updatedAt: true,
                coverPublicId: true,
                coverUrl: true,
                coverFileType: true,
                coverFileSize: true,
                coverResourceType: true,
                coverFilename: true,
              },
            },
          },
        },
      },
    });

    structure!.boards.push(...specialBoards);

    structure!.boards.forEach(board => {
      board.columns.forEach(col => (col as any).boardId = board.id);
    });

    return this.mapMembers(structure);
  }

  async addMember(projectId: string, userId: string, role: string = 'MEMBER', userName?: string, userAvatar?: string, addedBy?: string, userEmail?: string) {
    const existing = await this.prisma.projectMember.findFirst({
      where: { projectId, userId },
    });
    if (existing) {
      return { success: true, message: 'User is already a member' };
    }
    const member = await this.prisma.projectMember.create({
      data: { projectId, userId, role, userName, userAvatar, userEmail, status: 'PENDING' },
    });

    // Notify home service about invitation
    try {
      const project = await this.prisma.project.findUnique({ where: { id: projectId } });
      this.amqpConnection.publish('notification_exchange', 'notification.create', {
        pattern: 'home.notification.create',
        data: {
          recipientId: userId,
          senderId: addedBy,
          type: 'PROJECT_INVITE',
          projectId: projectId,
          projectName: project!.name,
          content: `Bạn được mời tham gia dự án ${project!.name}`,
        }
      });
    } catch (err: any) {
      this.logger.error(`Failed to send invite notification: ${err.message}`);
    }

    // Notify realtime
    const fullProject = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true }
    });

    this.amqpConnection.publish('smart-collab', 'realtime.project.updated', {
      project: this.mapMembers(fullProject)
    });

    return { success: true, message: 'Member added successfully', data: member };
  }

  async removeMember(projectId: string, userId: string) {
    await this.prisma.projectMember.deleteMany({
      where: { projectId, userId },
    });

    // Notify realtime
    const fullProject = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true }
    });

    this.amqpConnection.publish('smart-collab', 'realtime.project.updated', {
      project: this.mapMembers(fullProject)
    });

    return { success: true, message: 'Member removed successfully' };
  }

  async respondInvite(projectId: string, userId: string, accept: boolean) {
    if (accept) {
      await this.prisma.projectMember.update({
        where: { projectId_userId: { projectId, userId } },
        data: { status: 'ACCEPTED', joinedAt: new Date() },
      });
    } else {
      await this.prisma.projectMember.delete({
        where: { projectId_userId: { projectId, userId } },
      });
    }

    // Notify realtime
    const fullProject = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true }
    });

    this.amqpConnection.publish('smart-collab', 'realtime.project.updated', {
      project: this.mapMembers(fullProject)
    });

    return { success: true, message: accept ? 'Invitation accepted' : 'Invitation declined' };
  }

  async getAllProjects(userId?: string, page: number = 1, limit: number = 10, search?: string) {
    if (!userId) {
      return { items: [], total: 0, page, limit };
    }

    const skip = (page - 1) * limit;
    
    const where: any = {
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } },
      ],
    };

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        include: { members: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.project.count({
        where,
      }),
    ]);

    return { items, total, page, limit };
  }

  private async ensureDefaultBoards(ownerId: string) {
    const DEFAULT_TYPES: Array<'inbox' | 'calendar'> = ['inbox', 'calendar'];

    // Tìm xem user đã có loại board nào
    const existingBoards = await this.prisma.board.findMany({
      where: {
        ownerId,
        projectId: null,
        type: { in: DEFAULT_TYPES },
      },
      select: { id: true, type: true },
    });

    const existing = new Set(existingBoards.map((b) => b.type));

    for (const type of DEFAULT_TYPES) {
      if (!existing.has(type)) {
        await this.boardService.createBoard({
          ownerId,
          type,
          title: type.charAt(0).toUpperCase() + type.slice(1),
        });
      }
    }

    // Backfill dữ liệu cũ: board đã tồn tại nhưng chưa có cột mặc định.
    for (const board of existingBoards) {
      const hasAnyColumn = await this.prisma.column.findFirst({
        where: { boardId: board.id },
        select: { id: true },
      });

      if (!hasAnyColumn) {
        await this.prisma.column.create({
          data: {
            boardId: board.id,
            projectId: null,
            title: board.type === 'inbox' ? 'Inbox' : 'Schedule',
            position: 0,
          },
        });
      }
    }
  }

}
