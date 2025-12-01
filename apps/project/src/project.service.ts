import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BoardService } from './board/board.service';
import { ProjectMessage } from './dto/project.dto';

@Injectable()
export class ProjectService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly boardService: BoardService,
  ) {}

  private slugify(str: string): string {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9\s_-]/g, '')
      .trim()
      .replace(/\s+/g, '_')
      .toLowerCase();
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
      data: { projectId: project.id, userId: msg.ownerId!, role: 'ADMIN' },
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
        boards: {
          orderBy: { position: 'asc' },
          select: {
            id: true,
            title: true,
            type: true,
            position: true,
            columns: {
              orderBy: { position: 'asc' },
              select: { id: true, title: true, position: true },
            },
          },
        },
      },
    });

    const specialBoards = await this.prisma.board.findMany({
      where: {
        ownerId: project.ownerId,
        type: { in: ['inbox', 'calendar'] },
      },
      select: {
        id: true,
        title: true,
        type: true,
        position: true,
        columns: {
          orderBy: { position: 'asc' },
          select: { id: true, title: true, position: true },
        },
      },
    });

    structure!.boards.push(...specialBoards);

    structure!.boards.forEach(board => {
      board.columns.forEach(col => (col as any).boardId = board.id);
    });

    return structure;
  }

  async getAllProjects(userId?: string) {
    if (!userId) {
      return [];
    }

    return this.prisma.project.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      include: { members: true },
      orderBy: { createdAt: 'desc' },
    });
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
      select: { type: true },
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
  }

}
