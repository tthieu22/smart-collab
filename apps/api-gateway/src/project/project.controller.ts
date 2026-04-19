import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Patch,
  Inject,
  Logger,
  Get,
  Param,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Project } from './dto/project.dto';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';

@Controller('projects')
@UseGuards(JwtAuthGuard) 
export class ProjectController {
  private readonly logger = new Logger(ProjectController.name);

  constructor(
    @Inject('PROJECT_SERVICE') private readonly projectClient: ClientProxy,
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
  ) {}

  /** CREATE PROJECT */
  @Post()
  async create(@Body() body: Project, @Req() req: any) {
    this.logger.log(`Received create project request: ${JSON.stringify(body)}`);
    const user = req.user;
    const dto = { 
      ...body, 
      ownerId: user.userId,
      userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      userAvatar: user.avatar,
      userEmail: user.email
    };
    this.logger.log(`Sending create project DTO: ${JSON.stringify(dto)}`);

    const result = await firstValueFrom(
      this.projectClient.send({ cmd: 'project.create' }, dto),
    );

    this.logger.log(`Create project response: ${JSON.stringify(result)}`);
    return result;
  }

  /** UPDATE PROJECT */
  @Patch('update')
  async update(@Body() body: Project) {
    this.logger.log(`Received update project request: ${JSON.stringify(body)}`);

    const result = await firstValueFrom(
      this.projectClient.send({ cmd: 'project.update' }, body),
    );

    this.logger.log(`Update project response: ${JSON.stringify(result)}`);
    return result;
  }

  /** GET PROJECT */
  @Post('get')
  async getProject(@Body() body: Project,  @Req() req: any) {
    this.logger.log(`Received get project request: ${JSON.stringify(body)}`);

    // User có thể không có, vì route public
    const userId = req.user?.userId;
    const dto = { ...body, userId };
    const result = await firstValueFrom(
      this.projectClient.send({ cmd: 'project.get' }, dto),
    );

    // this.logger.log(`Get project response: ${JSON.stringify(result)}`);
    return result;
  }

  /** GET ALL PROJECTS */
  @Post('get-all')
  async getAllProjects(@Body() body: { userId?: string, page?: number, limit?: number, search?: string }, @Req() req: any) {
    const userId = req.user?.userId;
    const page = body.page ? Number(body.page) : 1;
    const limit = body.limit ? Number(body.limit) : 10;
    const search = body.search;
    
    const dto = { ...body, userId, page, limit, search };
    this.logger.log(`Received get-all projects request: ${JSON.stringify(dto)}`);

    const result = await firstValueFrom(
      this.projectClient.send({ cmd: 'project.get_all' }, dto),
    );

    // this.logger.log(`Get-all projects response: ${JSON.stringify(result)}`);
    return result;
  }
  
  /** GET CARD BY ID */
  @Get('card')
  async getCardById(@Body() body: { cardId?: string }, @Req() req: any) {
    const userId = req.user?.userId;
    const dto = { ...body, userId };
    this.logger.log(`Received get-all projects request: ${JSON.stringify(dto)}`);

    const result = await firstValueFrom(
      this.projectClient.send({ cmd: 'project.get.card' }, dto),
    );

    // this.logger.log(`Get-all projects response: ${JSON.stringify(result)}`);
    return result;
  }


  /**
   * POST /projects/members
   * Body: { projectId: string, userId: string }
   */
  @Post('members')
  async addMember(@Body() body: { projectId: string; userId: string }, @Req() req: any) {
    const user = req.user;
    this.logger.log(`Adding member ${body.userId} to project ${body.projectId} by ${user.userId}`);
    
    // Fetch user info from AUTH_SERVICE to denormalize it in Project service
    let userData: any = null;
    try {
      userData = await firstValueFrom(
        this.authClient.send({ cmd: 'auth.me' }, { userId: body.userId }).pipe(timeout(3000))
      );
    } catch (err) {
      this.logger.warn(`Failed to fetch user info for ${body.userId}: ${err}`);
    }

    const userName = userData?.data ? `${userData.data.firstName || ''} ${userData.data.lastName || ''}`.trim() || userData.data.email : undefined;
    const userAvatar = userData?.data?.avatar;

    // Gọi microservice để thêm member vào project
    const result = await firstValueFrom(
      this.projectClient.send({ cmd: 'project.add_member' }, { 
        ...body, 
        addedBy: user.userId,
        userName,
        userAvatar,
        userEmail: userData?.data?.email
      }),
    );
    return result;
  }

  /**
   * POST /projects/invite-email
   * Body: { email: string, projectId: string, projectName: string }
   */
  @Post('invite-email')
  async inviteEmail(
    @Body() body: { email: string; projectId: string; projectName: string },
    @Req() req: any,
  ) {
    const inviterName = req.user?.username || req.user?.email || 'Một thành viên';
    this.logger.log(`Sending invite email to ${body.email} for project ${body.projectId}`);

    try {
      // 1. Cấu hình transporter (Lấy từ biến môi trường, mặc định dùng dummy)
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || 'demo@smartcollab.com',
          pass: process.env.SMTP_PASS || 'password',
        },
      });

      // 2. Đọc file template HTML
      const templatePath = path.join(__dirname, 'templates', 'invite-email.html');
      let htmlTemplate = '';
      if (fs.existsSync(templatePath)) {
        htmlTemplate = fs.readFileSync(templatePath, 'utf-8');
      } else {
        // Fallback nội dung nếu không tìm thấy file
        htmlTemplate = `<p>Bạn được mời tham gia dự án {{projectName}} bởi {{inviterName}}.</p><a href="{{inviteUrl}}">Tham gia ngay</a>`;
      }

      // 3. Tạo inviteUrl (Chuyển hướng đến trang Auth rồi tự động join project)
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const inviteUrl = `${frontendUrl}/auth/login?redirect=/projects/${body.projectId}&invite=true&email=${encodeURIComponent(body.email)}`;

      // In ra terminal để DEV có thể copy link tự test mà không cần mail thực tế
      this.logger.log(`\n\n--- MOCK EMAIL LINK ---\n${inviteUrl}\n-----------------------\n`);

      // 4. Thay thế các biến trong template
      htmlTemplate = htmlTemplate
        .replace(/{{projectName}}/g, body.projectName || 'Dự án mới')
        .replace(/{{inviterName}}/g, inviterName)
        .replace(/{{inviteUrl}}/g, inviteUrl);

      // 5. Gửi email
      // Ghi chú: Cần cấu hình SMTP thực tế trong file .env để hoạt động
      if (process.env.SMTP_USER) {
        await transporter.sendMail({
          from: `"Smart Collab" <${process.env.SMTP_USER}>`,
          to: body.email,
          subject: `[Smart Collab] Lời mời tham gia dự án: ${body.projectName}`,
          html: htmlTemplate,
        });
        this.logger.log(`Email sent successfully to ${body.email}`);
      } else {
        this.logger.warn('SMTP_USER is not configured. Email sending simulated.');
      }

      return { success: true, message: 'Email sent successfully (or simulated)' };
    } catch (error) {
      this.logger.error(`Failed to send email to ${body.email}`, error);
      return { success: false, message: 'Failed to send email', error: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * RESPOND TO PROJECT INVITE
   * POST /projects/:id/respond-invite
   * Body: { accept: boolean }
   */
  @Post(':id/respond-invite')
  async respondInvite(
    @Param('id') projectId: string,
    @Body() body: { accept: boolean },
    @Req() req: any,
  ) {
    const user = req.user;
    this.logger.log(`User ${user.userId} responding to invite for project ${projectId}: ${body.accept}`);
    
    const result = await firstValueFrom(
      this.projectClient.send({ cmd: 'project.member.respond_invite' }, { 
        projectId, 
        userId: user.userId, 
        accept: body.accept 
      }),
    );
    return result;
  }
}
