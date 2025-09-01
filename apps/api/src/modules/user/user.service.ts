import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
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
        ...createUserDto,
        password: hashedPassword,
        emailVerificationCode,
        emailVerificationCodeExpires,
      },
    });

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
        role: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
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
        role: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
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
        role: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

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
  }
}
