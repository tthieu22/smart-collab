import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Patch,
  Logger,
  Get,
  Param,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { Project } from './dto/project.dto';
import { ProjectService } from './project.service';
import { AuthService } from '../auth/auth.service';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';

@Controller('projects')
@UseGuards(JwtAuthGuard) 
export class ProjectController {
  private readonly logger = new Logger(ProjectController.name);

  constructor(
    private readonly projectService: ProjectService,
    private readonly authService: AuthService,
  ) {}

  /** CREATE PROJECT */
  @Post()
  async create(@Body() body: Project, @Req() req: any) {
    const user = req.user;
    const dto = { 
      ...body, 
      ownerId: user.userId,
      userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      userAvatar: user.avatar,
      userEmail: user.email
    };
    return this.projectService.send({ cmd: 'project.create' }, dto);
  }

  /** UPDATE PROJECT */
  @Patch('update')
  async update(@Body() body: Project, @Req() req: any) {
    const user = req.user;
    const dto = { ...body, userId: user.userId };
    return this.projectService.send({ cmd: 'project.update' }, dto);
  }

  /** GET PROJECT */
  @Public()
  @Post('get')
  async getProject(@Body() body: Project,  @Req() req: any) {
    const userId = req.user?.userId;
    const dto = { ...body, userId };
    return this.projectService.send({ cmd: 'project.get' }, dto);
  }

  /** GET ALL PROJECTS */
  @Post('get-all')
  async getAllProjects(@Body() body: { userId?: string, page?: number, limit?: number, search?: string }, @Req() req: any) {
    const userId = req.user?.userId;
    const page = body.page ? Number(body.page) : 1;
    const limit = body.limit ? Number(body.limit) : 10;
    const search = body.search;
    const dto = { ...body, userId, page, limit, search };
    return this.projectService.send({ cmd: 'project.get_all' }, dto);
  }
  
  /** GET CARD BY ID */
  @Get('card')
  async getCardById(@Body() body: { cardId?: string }, @Req() req: any) {
    const userId = req.user?.userId;
    return this.projectService.send({ cmd: 'project.card.get' }, { ...body, userId });
  }

  /** ADD MEMBER */
  @Post('members')
  async addMember(@Body() body: { projectId: string; userId: string }, @Req() req: any) {
    const user = req.user;
    let userData = await this.authService.getCurrentUser({ userId: body.userId });
    
    const userName = userData?.data ? `${userData.data.firstName || ''} ${userData.data.lastName || ''}`.trim() || userData.data.email : undefined;
    const userAvatar = userData?.data?.avatar;

    return this.projectService.send({ cmd: 'project.add_member' }, { 
      ...body, 
      addedBy: user.userId,
      userName,
      userAvatar,
      userEmail: userData?.data?.email
    });
  }

  /** DELETE PROJECT */
  @Post('delete')
  async delete(@Body() body: { id: string }, @Req() req: any) {
    const userId = req.user.userId;
    return this.projectService.send({ cmd: 'project.delete' }, { projectId: body.id, userId });
  }

  /** REMOVE MEMBER */
  @Post('remove-member')
  async removeMember(@Body() body: { projectId: string; userId: string }, @Req() req: any) {
    const user = req.user;
    return this.projectService.send({ cmd: 'project.remove_member' }, { 
      projectId: body.projectId, 
      userId: body.userId, 
      removedBy: user.userId 
    });
  }

  /** INVITE EMAIL */
  @Post('invite-email')
  async inviteEmail(
    @Body() body: { email: string; projectId: string; projectName: string },
    @Req() req: any,
  ) {
    const inviterName = req.user?.username || req.user?.email || 'Một thành viên';
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || 'demo@smartcollab.com',
          pass: process.env.SMTP_PASS || 'password',
        },
      });

      const templatePath = path.join(__dirname, 'templates', 'invite-email.html');
      let htmlTemplate = '';
      if (fs.existsSync(templatePath)) {
        htmlTemplate = fs.readFileSync(templatePath, 'utf-8');
      } else {
        htmlTemplate = `<p>Bạn được mời tham gia dự án {{projectName}} bởi {{inviterName}}.</p><a href="{{inviteUrl}}">Tham gia ngay</a>`;
      }

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const inviteUrl = `${frontendUrl}/auth/login?redirect=/projects/${body.projectId}&invite=true&email=${encodeURIComponent(body.email)}`;

      htmlTemplate = htmlTemplate
        .replace(/{{projectName}}/g, body.projectName || 'Dự án mới')
        .replace(/{{inviterName}}/g, inviterName)
        .replace(/{{inviteUrl}}/g, inviteUrl);

      if (process.env.SMTP_USER) {
        await transporter.sendMail({
          from: `"Smart Collab" <${process.env.SMTP_USER}>`,
          to: body.email,
          subject: `[Smart Collab] Lời mời tham gia dự án: ${body.projectName}`,
          html: htmlTemplate,
        });
      }
      return { success: true, message: 'Email sent successfully (or simulated)' };
    } catch (error) {
      return { success: false, message: 'Failed to send email', error: error instanceof Error ? error.message : String(error) };
    }
  }

  /** RESPOND TO PROJECT INVITE */
  @Post(':id/respond-invite')
  async respondInvite(
    @Param('id') projectId: string,
    @Body() body: { accept: boolean },
    @Req() req: any,
  ) {
    const user = req.user;
    return this.projectService.send({ cmd: 'project.member.respond_invite' }, { 
      projectId, 
      userId: user.userId, 
      accept: body.accept 
    });
  }

  @Post('analytics')
  async getAnalytics(@Body() body: { projectId?: string }, @Req() req: any) {
    const userId = req.user.userId;
    return this.projectService.send({ cmd: 'project.analytics' }, { 
      userId, 
      projectId: body.projectId 
    });
  }

  /** RECYCLE BIN */
  @Get(':id/recycle-bin')
  async getRecycleBin(@Param('id') projectId: string) {
    return this.projectService.send({ cmd: 'project.recycle-bin.get_all' }, { projectId });
  }

  @Post(':id/restore')
  async restoreItem(@Param('id') projectId: string, @Body() body: { type: string; id: string }) {
    let cmd = 'project.restore';
    if (body.type === 'board') cmd = 'project.board.restore';
    if (body.type === 'column') cmd = 'project.column.restore';
    if (body.type === 'card') cmd = 'project.card.restore';
    
    return this.projectService.send({ cmd }, { 
      projectId, 
      cardId: body.id, 
      boardId: body.id, 
      columnId: body.id 
    });
  }

  /** CHAT */
  @Get(':id/chat')
  async getChatMessages(@Param('id') projectId: string, @Req() req: any) {
    const { skip, limit } = req.query;
    return this.projectService.send({ cmd: 'project.chat.get_all' }, { 
      projectId, 
      skip: skip ? Number(skip) : 0, 
      limit: limit ? Number(limit) : 20 
    });
  }

  @Post(':id/chat')
  async sendChatMessage(@Param('id') projectId: string, @Body() body: any, @Req() req: any) {
    const user = req.user;
    return this.projectService.send({ cmd: 'project.chat.send' }, { 
      projectId, 
      userId: user.userId, 
      payload: body 
    });
  }
}
