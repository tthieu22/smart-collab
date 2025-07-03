import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './schemas/user.schema';
import * as bcrypt from 'bcryptjs';
import { CreateGoogleUserDto } from './dto/create-google-user.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { randomBytes } from 'crypto';
import * as dayjs from 'dayjs';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly mailerService: MailerService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existing = await this.userModel.findOne({
      email: createUserDto.email,
    });
    if (existing) {
      throw new Error('Email already exists');
    }
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const emailVerificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    const emailVerificationCodeExpires = dayjs().add(15, 'minutes').toDate();
    const createdUser = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
      emailVerificationCode,
      emailVerificationCodeExpires,
    });
    const savedUser = await createdUser.save();
    await this.mailerService.sendMail({
      to: savedUser.email,
      subject: 'Verify your email',
      text: `Your verification code is: ${savedUser.emailVerificationCode}`,
    });
    const userObj = savedUser.toObject();
    delete userObj.password;
    delete userObj.emailVerificationCode;
    delete userObj.emailVerificationCodeExpires;
    return userObj;
  }

  async resendVerificationCode(email: string): Promise<void> {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }
    const emailVerificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    const emailVerificationCodeExpires = dayjs().add(15, 'minutes').toDate();

    user.emailVerificationCode = emailVerificationCode;
    user.emailVerificationCodeExpires = emailVerificationCodeExpires;
    await user.save();

    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Verify your email',
      text: `Your verification code is: ${emailVerificationCode}`,
    });
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .exec();
    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return updatedUser;
  }

  async remove(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async createGoogleUser(
    createGoogleUserDto: CreateGoogleUserDto,
  ): Promise<User> {
    const existing = await this.userModel.findOne({
      email: createGoogleUserDto.email,
    });
    if (existing) {
      throw new Error('Email already exists');
    }
    const createdUser = new this.userModel(createGoogleUserDto);
    return createdUser.save();
  }

  async changePassword(
    userId: string,
    dto: {
      oldPassword: string;
      newPassword: string;
      confirmNewPassword: string;
    },
  ): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (!user.password)
      throw new Error('Tài khoản này không hỗ trợ đổi mật khẩu');
    const isMatch = await bcrypt.compare(dto.oldPassword, user.password);
    if (!isMatch) throw new Error('Mật khẩu cũ không đúng');
    if (dto.newPassword !== dto.confirmNewPassword)
      throw new Error('Mật khẩu xác nhận không khớp');
    user.password = await bcrypt.hash(dto.newPassword, 10);
    await user.save();
  }
}
