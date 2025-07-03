import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('users')
@UsePipes(new ValidationPipe())
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    try {
      const user = await this.userService.create(createUserDto);
      return { success: true, data: user };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  @Roles('admin')
  async findAll() {
    try {
      const users = await this.userService.findAll();
      return { success: true, data: users };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req) {
    try {
      const user = await this.userService.findOne(req.user.userId);
      return { success: true, data: user };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateMe(@Req() req, @Body() updateUserDto: UpdateUserDto) {
    try {
      const user = await this.userService.update(
        req.user.userId,
        updateUserDto,
      );
      return { success: true, data: user };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id')
  @Roles('admin')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    try {
      const user = await this.userService.update(id, updateUserDto);
      return { success: true, data: user };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  @Roles('admin')
  async remove(@Param('id') id: string) {
    try {
      await this.userService.remove(id);
      return { success: true, data: null };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Post('resend-verification-code')
  async resendVerificationCode(@Body('email') email: string) {
    await this.userService.resendVerificationCode(email);
    return { success: true, message: 'Verification code resent' };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/change-password')
  async changePassword(
    @Req() req,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    try {
      await this.userService.changePassword(req.user.userId, changePasswordDto);
      return { success: true, message: 'Đổi mật khẩu thành công' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}
