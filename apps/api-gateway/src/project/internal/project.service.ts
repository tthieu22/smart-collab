import { Injectable, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BoardService } from './board/board.service';
import { ProjectMessage } from './dto/project.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ProjectService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly boardService: BoardService,
    private readonly eventEmitter: EventEmitter2,
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

  /** 🛡️ HELPER: Check Project Access Control */
  private async checkProjectAccess(projectId: string, userId: string | undefined, action: 'view' | 'edit' | 'admin' = 'view') {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });

    if (!project) throw new NotFoundException('Không tìm thấy dự án');

    const isOwner = userId === project.ownerId;
    const isMember = userId ? project.members.some((m: any) => m.userId === userId && m.status === 'ACCEPTED') : false;

    // Admin action (e.g., delete, change visibility?)
    if (action === 'admin') {
      if (!isOwner) throw new ForbiddenException('Chỉ chủ sở hữu mới có quyền thực hiện hành động này.');
      return project;
    }

    // Edit action
    if (action === 'edit') {
      if (isOwner) return project;
      if (project.visibility === 'PRIVATE') throw new ForbiddenException('Dự án riêng tư. Chỉ chủ sở hữu mới có quyền chỉnh sửa.');
      if (isMember) return project;
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa dự án này.');
    }

    // View action
    if (action === 'view') {
      if (project.visibility === 'PUBLIC') return project;
      if (isOwner) return project;
      if (project.visibility === 'PRIVATE') throw new ForbiddenException('Dự án riêng tư. Chỉ chủ sở hữu mới có quyền xem.');
      if (isMember) return project;
      throw new ForbiddenException('Bạn không có quyền xem dự án này.');
    }

    return project;
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
    await this.checkProjectAccess(msg.projectId!, msg.userId, 'edit');

    const file = msg.files?.[0];
    const updated = await this.prisma.project.update({
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

    // 📣 Phát tín hiệu realtime cập nhật project
    this.eventEmitter.emit('realtime.project.updated', {
      project: updated,
    });

    return updated;
  }

  async deleteProject(projectId: string, userId?: string) {
    await this.checkProjectAccess(projectId, userId, 'admin');
    const deleted = await this.prisma.project.update({ 
      where: { id: projectId },
      data: { deletedAt: new Date() }
    });

    this.eventEmitter.emit('realtime.project.deleted', { projectId });
    return deleted;
  }

  async restoreProject(projectId: string, userId?: string) {
    await this.checkProjectAccess(projectId, userId, 'admin');
    const restored = await this.prisma.project.update({ 
      where: { id: projectId },
      data: { deletedAt: null }
    });

    this.eventEmitter.emit('realtime.project.restored', { project: restored });
    return restored;
  }

  async getRecycleBin(projectId: string) {
    const [boards, columns, cards] = await Promise.all([
      this.prisma.board.findMany({
        where: { projectId, deletedAt: { not: null } },
        orderBy: { deletedAt: 'desc' },
      }),
      this.prisma.column.findMany({
        where: { projectId, deletedAt: { not: null } },
        include: { board: { select: { title: true } } },
        orderBy: { deletedAt: 'desc' },
      }),
      this.prisma.card.findMany({
        where: { projectId, deletedAt: { not: null } },
        include: { 
          column: { select: { title: true } },
          project: { select: { name: true } }
        },
        orderBy: { deletedAt: 'desc' },
      }),
    ]);

    const items = [
      ...boards.map((b: any) => ({ ...b, type: 'board' })),
      ...columns.map((c: any) => ({ ...c, type: 'column' })),
      ...cards.map((c: any) => ({ ...c, type: 'card' })),
    ].sort((a, b) => new Date(b.deletedAt!).getTime() - new Date(a.deletedAt!).getTime());

    return items;
  }

  async getProjectStructure(projectId: string, userId?: string) {
    const project = await this.checkProjectAccess(projectId, userId, 'view');

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
          where: { deletedAt: null },
          orderBy: { position: 'asc' },
          select: {
            id: true,
            title: true,
            type: true,
            position: true,
            columns: {
              where: { deletedAt: null },
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
                  where: { deletedAt: null },
                  orderBy: { position: 'asc' },
                  select: {
                    id: true,
                    projectId: true,
                    columnId: true,
                    title: true,
                    description: true,
                    status: true,
                    startDate: true,
                    deadline: true,
                    priority: true,
                    dependencyId: true,
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
                    members: true,
                    labels: true,
                    checklist: true,
                    comments: true,
                    attachments: true,
                    customFieldValues: {
                      include: { field: true }
                    },
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
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        type: true,
        position: true,
        columns: {
          where: { deletedAt: null },
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
              where: { deletedAt: null },
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
                members: true,
                labels: true,
              },
            },
          },
        },
      },
    });

    (structure as any).boards.push(...specialBoards);

    (structure as any).boards.forEach((board: any) => {
      board.columns.forEach((col: any) => (col as any).boardId = board.id);
    });

    return this.mapMembers(structure);
  }

  async addMember(projectId: string, userId: string, role: string = 'MEMBER', userName?: string, userAvatar?: string, addedBy?: string, userEmail?: string) {
    await this.checkProjectAccess(projectId, addedBy, 'edit');

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
      this.eventEmitter.emit('notification.create', {
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

    this.eventEmitter.emit('realtime.project.updated', {
      project: this.mapMembers(fullProject)
    });

    return { success: true, message: 'Member added successfully', data: member };
  }

  async removeMember(projectId: string, userId: string, removedBy?: string) {
    await this.checkProjectAccess(projectId, removedBy, 'edit');
    await this.prisma.projectMember.deleteMany({
      where: { projectId, userId },
    });

    // Notify realtime
    const fullProject = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true }
    });

    this.eventEmitter.emit('realtime.project.updated', {
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

    this.eventEmitter.emit('realtime.project.updated', {
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
      deletedAt: null,
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } },
      ],
    };

    if (search) {
      const words = search.trim().split(/\s+/);
      where.AND = words.map(word => ({
        name: { contains: word, mode: 'insensitive' }
      }));
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

    const existing = new Set(existingBoards.map((b: any) => b.type));

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

  async getAnalytics(userId: string, projectId?: string) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const baseWhere: any = {};
    if (projectId) {
      baseWhere.projectId = projectId;
    } else {
      baseWhere.OR = [
        { createdById: userId },
        { members: { some: { userId } } }
      ];
    }

    // Heuristic for 'DONE' tasks: status is 'DONE' OR column title contains 'done'/'hoàn thành'
    const doneFilter = {
      OR: [
        { status: 'DONE' },
        { 
          column: { 
            title: { 
              contains: 'done', 
              mode: 'insensitive' as const 
            } 
          } 
        },
        { 
          column: { 
            title: { 
              contains: 'hoàn thành', 
              mode: 'insensitive' as const 
            } 
          } 
        }
      ]
    };

    const [completedThisWeek, completedLastWeek, createdThisWeek] = await Promise.all([
      this.prisma.card.count({
        where: { ...baseWhere, ...doneFilter, updatedAt: { gte: sevenDaysAgo } }
      }),
      this.prisma.card.count({
          where: { ...baseWhere, ...doneFilter, updatedAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } }
      }),
      this.prisma.card.count({
          where: { ...baseWhere, createdAt: { gte: sevenDaysAgo } }
      })
    ]);

    // Boost with NaN fix
    let boost = 0;
    if (completedLastWeek === 0) {
      boost = completedThisWeek > 0 ? 100 : 0;
    } else {
      boost = ((completedThisWeek - completedLastWeek) / completedLastWeek) * 100;
    }

    const trend = boost > 0 ? 'up' : boost < 0 ? 'down' : 'neutral';

    let topPerformer = null;
    let streak = 0;

    if (projectId) {
      // Calculate Top Performer for team
      const performers = await this.prisma.card.groupBy({
        by: ['updatedById', 'updatedByName', 'updatedByAvatar'],
        where: { ...baseWhere, ...doneFilter, updatedAt: { gte: sevenDaysAgo } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 1
      });
      if (performers.length > 0 && performers[0].updatedById) {
        topPerformer = {
          name: performers[0].updatedByName || 'User',
          avatar: performers[0].updatedByAvatar,
          count: performers[0]._count.id
        };
      }
    } else {
      // Calculate Streak for personal (days in a row with at least 1 card done)
      // Simple heuristic: check last 30 days
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const completions = await this.prisma.card.findMany({
        where: {
          ...baseWhere,
          ...doneFilter,
          updatedAt: { gte: thirtyDaysAgo }
        },
        select: { updatedAt: true },
        orderBy: { updatedAt: 'desc' }
      });

      const doneDays = new Set(completions.map((c: any) => 
        new Date(c.updatedAt).toISOString().split('T')[0]
      ));

      let current = new Date(startOfToday);
      while (doneDays.has(current.toISOString().split('T')[0])) {
        streak++;
        current.setDate(current.getDate() - 1);
      }
      // If none done today, check if yesterday was done to continue the streak count (standard practice)
      if (streak === 0) {
          let yesterday = new Date(startOfToday);
          yesterday.setDate(yesterday.getDate() - 1);
          while (doneDays.has(yesterday.toISOString().split('T')[0])) {
              streak++;
              yesterday.setDate(yesterday.getDate() - 1);
          }
      }
    }

    const dailyStats = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      
      const startOfDay = new Date(d);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(d);
      endOfDay.setHours(23, 59, 59, 999);

      const completedCount = await this.prisma.card.count({
        where: { 
          ...baseWhere, 
          ...doneFilter, 
          updatedAt: { gte: startOfDay, lte: endOfDay } 
        }
      });

      const createdCount = await this.prisma.card.count({
        where: { 
          ...baseWhere, 
          createdAt: { gte: startOfDay, lte: endOfDay } 
        }
      });

      dailyStats.push({
        date: startOfDay.toLocaleDateString('vi-VN', { weekday: 'short' }),
        completed: completedCount,
        created: createdCount
      });
    }

    return {
      boost: Math.round(boost * 10) / 10,
      completed: completedThisWeek,
      target: Math.max(createdThisWeek, 5),
      isTeamMode: !!projectId,
      trend,
      topPerformer,
      streak,
      dailyStats
    };
  }

  async getTopCollaborators() {
    const topMembers = await this.prisma.projectMember.groupBy({
      by: ['userId'],
      _count: {
        projectId: true,
      },
      orderBy: {
        _count: {
          projectId: 'desc',
        },
      },
      take: 20,
    });

    return topMembers.map((m: any) => m.userId);
  }
}
