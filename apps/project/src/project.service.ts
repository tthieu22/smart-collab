import { Injectable } from '@nestjs/common';
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
    // 1️⃣ Tạo project
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

    // 2️⃣ Cập nhật folderPath
    const folderPath = `${this.slugify(msg.name!)}_${project.id}`;
    await this.prisma.project.update({
      where: { id: project.id },
      data: { folderPath },
    });

    // 3️⃣ Tạo member owner
    await this.prisma.projectMember.create({
      data: { projectId: project.id, userId: msg.ownerId!, role: 'ADMIN' },
    });

    // 4️⃣ Tạo board mặc định
    const defaultBoard = await this.boardService.createBoard({
      projectId: project.id,
      ownerId: msg.ownerId,
      type: 'board',
      title: 'Main Board',
    });

    // 5️⃣ Trả về full project
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

  async getProjectStructure(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
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
        description: true,
        ownerId: true,
        folderPath: true,
        visibility: true,
        color: true,
        background: true,
        publicId: true,
        fileUrl: true,
        fileType: true,
        fileSize : true,
        originalFilename: true,
        uploadedById: true,
      },
    });

    if (!project) return null;

    // Thêm boardId cho mỗi column
    project.boards.forEach((board) => {
      board.columns.forEach((column) => {
        (column as any).boardId = board.id;
      });
    });

    return project;
  }

  async getAllProjects() {
    return this.prisma.project.findMany({
      include: { members: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
