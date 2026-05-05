import { Controller, Get, UseGuards, Req, Param, Patch, Body, Query, Post } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthService } from '../auth/auth.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  async getMe(@Req() req: any) {
    return this.authService.getCurrentUser({ userId: req.user.userId });
  }

  @Get(':id')
  async getUser(@Param('id') userId: string) {
    return this.authService.getCurrentUser({ userId });
  }

  @Patch('profile')
  async updateProfile(@Req() req: any, @Body() data: any) {
    return this.authService.updateProfile({ userId: req.user.userId, data });
  }

  @Get()
  async searchUsers(@Query('q') q: string) {
    return this.authService.searchUsers({ q });
  }

  @Post('check-emails')
  async checkEmails(@Body('emails') emails: string[]) {
    return this.authService.checkEmails({ emails });
  }
}
