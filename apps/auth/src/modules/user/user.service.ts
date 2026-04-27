import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';
import { CreateGoogleUserDto } from './dto/create-google-user.dto';
import { MailerService } from '@nestjs-modules/mailer';
import dayjs from 'dayjs';
import { syncCreateUser, syncDeleteUser, syncUpdateUser } from '../../message-handlers/common/sync.helper';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailerService: MailerService,
    @Inject('HOME_SERVICE') private readonly homeClient: ClientProxy,
    @Inject('PROJECT_SERVICE') private readonly projectClient: ClientProxy,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });
    if (existing) {
      throw new Error('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const emailVerificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    const emailVerificationCodeExpires = dayjs().add(15, 'minutes').toDate();

    const createdUser = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        firstName: createUserDto.firstName ?? null,
        lastName: createUserDto.lastName ?? null,
        avatar: createUserDto.avatar ?? null,
        password: hashedPassword,
        role: createUserDto.role ?? 'USER',
        isVerified: false,
        emailVerificationCode,
        emailVerificationCodeExpires,
      },
    });

    await syncCreateUser(createdUser);
    this.homeClient.emit({ cmd: 'home.user.sync' }, createdUser);

    // Send verification email
    await this.mailerService.sendMail({
      to: createdUser.email,
      subject: 'Verify your email',
      text: `Your verification code is: ${emailVerificationCode}`,
    });

    const { password, ...userWithoutPassword } = createdUser;
    return userWithoutPassword;
  }

  async resendVerificationCode(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error('User not found');
    }

    const emailVerificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    const emailVerificationCodeExpires = dayjs().add(15, 'minutes').toDate();

    // Update user with new verification code
    await this.prisma.user.update({
      where: { email },
      data: {
        emailVerificationCode,
        emailVerificationCodeExpires,
      },
    });

    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Verify your email',
      text: `Your verification code is: ${emailVerificationCode}`,
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        coverImage: true,
        bio: true,
        location: true,
        website: true,
        birthday: true,
        role: true,
        isVerified: true,
        emailNotifications: true,
        pushNotifications: true,
        loginCount: true,
      },
    });
  }

  async findOne(id: string) {
    if (!id) {
      throw new NotFoundException('User ID is required');
    }
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        coverImage: true,
        bio: true,
        location: true,
        website: true,
        birthday: true,
        role: true,
        isVerified: true,
        emailNotifications: true,
        pushNotifications: true,
        loginCount: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByGoogleId(googleId: string) {
    return this.prisma.user.findFirst({ where: { googleId } });
  }

  async verifyEmail(email: string, code: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error('User not found');
    }

    if (
      user.emailVerificationCode === code &&
      user.emailVerificationCodeExpires &&
      dayjs().isBefore(user.emailVerificationCodeExpires)
    ) {
      await this.prisma.user.update({
        where: { email },
        data: {
          isVerified: true,
          emailVerificationCode: null,
          emailVerificationCodeExpires: null,
        },
      });
      return true;
    }

    return false;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        coverImage: true,
        bio: true,
        location: true,
        website: true,
        birthday: true,
        role: true,
        isVerified: true,
        emailNotifications: true,
        pushNotifications: true,
        loginCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    await syncUpdateUser(updatedUser);
    this.homeClient.emit({ cmd: 'home.user.sync' }, updatedUser);

    await this.createLog(id, 'UPDATE_PROFILE', 'Updated profile information');

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return updatedUser;
  }

  async remove(id: string): Promise<void> {
    const result = await this.prisma.user.delete({ where: { id } });
    await syncDeleteUser(id);
    if (!result) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async createGoogleUser(createGoogleUserDto: CreateGoogleUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: createGoogleUserDto.email },
    });
    if (existing) {
      throw new Error('Email already exists');
    }

    // Nếu có googleId, kiểm tra xem đã tồn tại chưa
    if (createGoogleUserDto.googleId) {
      const existingGoogleUser = await this.prisma.user.findFirst({
        where: { googleId: createGoogleUserDto.googleId },
      });
      if (existingGoogleUser) {
        throw new Error('Google account already exists');
      }
    }

    return this.prisma.user.create({
      data: createGoogleUserDto,
    });
  }

  async changePassword(
    userId: string,
    dto: {
      oldPassword: string;
      newPassword: string;
      confirmNewPassword: string;
    },
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.password)
      throw new Error('Tài khoản này không hỗ trợ đổi mật khẩu');

    const isMatch = await bcrypt.compare(dto.oldPassword, user.password);
    if (!isMatch) throw new Error('Mật khẩu cũ không đúng');
    if (dto.newPassword !== dto.confirmNewPassword)
      throw new Error('Mật khẩu xác nhận không khớp');

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
    await this.createLog(userId, 'CHANGE_PASSWORD', 'Changed account password');
  }

  async search(query: string) {
    if (!query) return [];
    return this.prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: query, mode: 'insensitive' } },
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        coverImage: true,
        bio: true,
        location: true,
        website: true,
        birthday: true,
      },
      take: 20,
    });
  }

  async disconnectGoogle(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { googleId: null },
    });
  }

  async deleteAccount(userId: string, passwordConfirm?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.password && passwordConfirm) {
      const isMatch = await bcrypt.compare(passwordConfirm, user.password);
      if (!isMatch) throw new Error('Mật khẩu không đúng');
    }

    // Soft delete: set deletedAt
    await this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    });
    
    await this.createLog(userId, 'DELETE_ACCOUNT_REQUEST', 'Account marked for deletion (30 days grace period)');
    await syncDeleteUser(userId); // Sync to other services (maybe they handle soft delete too)
  }

  async incrementLoginCount(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { loginCount: { increment: 1 } },
    });
  }

  async createLog(userId: string, action: string, details?: string) {
    return this.prisma.auditLog.create({
      data: { userId, action, details },
    });
  }

  async getLogs(userId: string) {
    return this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async exportData(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        posts: true,
        comments: true,
        auditLogs: true,
        devices: true,
      },
    });
    if (!user) throw new Error('User not found');
    const { password, emailVerificationCode, ...safeData } = user;
    return safeData;
  }

  async getDevices(userId: string) {
    return this.prisma.device.findMany({
      where: { userId },
      orderBy: { lastUsed: 'desc' },
    });
  }

  async removeDevice(userId: string, deviceId: string) {
    return this.prisma.device.delete({
      where: { id: deviceId, userId },
    });
  }

  async getSuggestions(userId: string, page: number = 1, limit: number = 5) {
    if (!userId) return { items: [], total: 0 };
    
    const skip = (page - 1) * limit;

    try {
      const totalCount = await this.prisma.user.count();
      console.log(`[getSuggestions] Total users in system: ${totalCount}`);
    } catch (e) {
      console.error('[getSuggestions] Count failed', e);
    }

    // 1. Chuẩn bị danh sách loại trừ (bản thân + người đã theo dõi)
    let followingIds: string[] = [];
    try {
      const following = await this.prisma.follower.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      });
      followingIds = following.map((f) => f.followingId).filter(Boolean);
    } catch (err) {
      console.error('[getSuggestions] Failed to fetch following list', err);
    }
    
    const excludeIds = [userId, ...followingIds].filter(id => !!id);

    // 2. Lấy danh sách Top Collaborators từ Project Service
    let topCollaboratorIds: string[] = [];
    try {
      const res = await firstValueFrom(
        this.projectClient.send({ cmd: 'project.get_top_collaborators' }, {})
      );
      if (res && res.success) {
        topCollaboratorIds = (res.data || []).filter((id: string) => !excludeIds.includes(id));
      }
    } catch (err) {
      console.error('[getSuggestions] Failed to fetch project collaborators', err);
    }

    let suggestions: any[] = [];
    let total = 0;

    // 3. Ưu tiên 1: Lấy người dùng từ danh sách Top Collaborators
    if (topCollaboratorIds.length > 0) {
      const users = await this.prisma.user.findMany({
        where: { id: { in: topCollaboratorIds } },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          bio: true,
          loginCount: true,
        },
      });
      suggestions = users;
    }

    // 4. Ưu tiên 2: Bổ sung những người hoạt động tích cực (global)
    // Nếu suggestions chưa đủ nhiều (trong trường hợp fetch toàn bộ list cho trang Discovery)
    // hoặc đơn giản là lấy thêm để đủ limit
    const currentIds = suggestions.map(s => s.id);
    const moreActive = await this.prisma.user.findMany({
      where: {
        id: { notIn: [...excludeIds, ...currentIds] },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        loginCount: true,
      },
      orderBy: { loginCount: 'desc' },
      // Lấy thêm 1 đống để phục vụ phân trang nếu cần
      take: 100, 
    });
    
    const combined = [...suggestions, ...moreActive];
    total = combined.length;

    // 5. Dự phòng: Nếu vẫn quá ít, lấy những người mới tham gia
    if (combined.length < 2) {
      const currentCombinedIds = combined.map(s => s.id);
      const fallbacks = await this.prisma.user.findMany({
        where: {
          id: { notIn: [...excludeIds, ...currentCombinedIds] },
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          bio: true,
          loginCount: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
      combined.push(...fallbacks);
      total = combined.length;
    }

    // 6. Phân trang trên mảng tổng hợp (vì kết hợp từ nhiều nguồn/ưu tiên)
    const paginatedItems = combined.slice(skip, skip + limit);

    console.log(`[getSuggestions] Returning ${paginatedItems.length}/${total} items for page ${page}`);
    return { items: paginatedItems, total };
  }
}
