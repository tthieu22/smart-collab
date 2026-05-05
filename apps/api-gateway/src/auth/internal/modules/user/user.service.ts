import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';
import { CreateGoogleUserDto } from './dto/create-google-user.dto';
import { MailerService } from '@nestjs-modules/mailer';
import dayjs from 'dayjs';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailerService: MailerService,
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
        createdAt: new Date(),
      },
    });

    // Send verification email
    try {
      await this.mailerService.sendMail({
        to: createdUser.email,
        subject: 'Verify your email',
        text: `Your verification code is: ${emailVerificationCode}`,
      });
    } catch (err) {
      console.error('Failed to send verification email', err);
    }

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
        createdAt: true,
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
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findInternalUser(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
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

    await this.createLog(id, 'UPDATE_PROFILE', 'Updated profile information');

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return updatedUser;
  }

  async remove(id: string): Promise<void> {
    const result = await this.prisma.user.delete({ where: { id } });
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

  async checkEmails(emails: string[]) {
    const users = await this.prisma.user.findMany({
      where: { email: { in: emails } },
      select: { id: true, email: true, firstName: true, lastName: true, avatar: true },
    });
    return users;
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

  async getSuggestions(userId: string, page: number = 1, limit: number = 5, filter?: string) {
    if (!userId) return { items: [], total: 0 };
    
    const skip = (page - 1) * limit;

    let followingIds: string[] = [];
    try {
      const following = await this.prisma.follower.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      });
      followingIds = following.map((f: any) => f.followingId).filter(Boolean);
    } catch (err) {
      console.error('[getSuggestions] Failed to fetch following list', err);
    }
    
    const excludeIds = [userId, ...followingIds].filter(id => !!id);

    let suggestions: any[] = [];
    let total = 0;

    if (filter === 'ACTIVE') {
      total = await this.prisma.user.count({ where: { id: { notIn: excludeIds } } });
      suggestions = await this.prisma.user.findMany({
        where: { id: { notIn: excludeIds } },
        orderBy: { loginCount: 'desc' },
        skip, take: limit,
        select: { 
          id: true, email: true, firstName: true, lastName: true, avatar: true, bio: true, loginCount: true, location: true, createdAt: true,
          _count: { select: { followers: true, following: true } }
        }
      });
    } else if (filter === 'NEW') {
      total = await this.prisma.user.count({ where: { id: { notIn: excludeIds } } });
      suggestions = await this.prisma.user.findMany({
        where: { id: { notIn: excludeIds } },
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
        select: { 
          id: true, email: true, firstName: true, lastName: true, avatar: true, bio: true, loginCount: true, location: true, createdAt: true,
          _count: { select: { followers: true, following: true } }
        }
      });
    } else {
      // Default behavior
      total = await this.prisma.user.count({ where: { id: { notIn: excludeIds } } });
      suggestions = await this.prisma.user.findMany({
        where: { id: { notIn: excludeIds } },
        orderBy: { loginCount: 'desc' },
        skip, take: limit,
        select: { 
          id: true, email: true, firstName: true, lastName: true, avatar: true, bio: true, loginCount: true, location: true, createdAt: true,
          _count: { select: { followers: true, following: true } }
        }
      });
    }

    const suggestionsWithFollowing = suggestions.map(u => ({
      ...u,
      isFollowing: followingIds.includes(u.id)
    }));

    return { items: suggestionsWithFollowing, total };
  }

  async toggleFollow(followerId: string, followingId: string) {
    if (followerId === followingId) throw new Error('Cannot follow yourself');

    const existing = await this.prisma.follower.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });

    if (existing) {
      await this.prisma.follower.delete({
        where: { id: existing.id },
      });
      return { followed: false };
    } else {
      await this.prisma.follower.create({
        data: { followerId, followingId },
      });
      return { followed: true };
    }
  }

  async getFollowRelation(targetId: string, observerId?: string) {
    const followersData = await this.prisma.follower.findMany({
      where: { followingId: targetId },
      include: {
        follower: {
          select: { id: true, email: true, firstName: true, lastName: true, avatar: true, bio: true }
        }
      }
    });

    const followingData = await this.prisma.follower.findMany({
      where: { followerId: targetId },
      include: {
        following: {
          select: { id: true, email: true, firstName: true, lastName: true, avatar: true, bio: true }
        }
      }
    });

    const followers = followersData.map((f: any) => ({
      ...f.follower,
      name: `${f.follower.firstName || ''} ${f.follower.lastName || ''}`.trim() || f.follower.email,
      username: f.follower.email.split('@')[0],
    }));

    const following = followingData.map((f: any) => ({
      ...f.following,
      name: `${f.following.firstName || ''} ${f.following.lastName || ''}`.trim() || f.following.email,
      username: f.following.email.split('@')[0],
    }));

    const followingIds = following.map((u: any) => u.id);
    const friends = followers.filter((u: any) => followingIds.includes(u.id));

    return {
      followers,
      following,
      friends,
      followersCount: followers.length,
      followingCount: following.length,
      isFollowing: observerId ? followers.some((u: any) => u.id === observerId) : false,
    };
  }
}
