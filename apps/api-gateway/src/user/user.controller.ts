import { Controller, Get, Query, UseGuards, Inject, Logger, Patch, Body, Req, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { Request } from 'express';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
  ) {}

  @Get('me')
  async getMe(@Req() req: Request) {
    const user = req.user as any;
    const userId = user.userId || user.sub || user.id;
    return firstValueFrom(
      this.authClient.send({ cmd: 'auth.me' }, { userId })
    );
  }

  @Patch('me')
  async updateMe(@Req() req: Request, @Body() data: any) {
    const user = req.user as any;
    const userId = user.userId || user.sub || user.id;
    return firstValueFrom(
      this.authClient.send({ cmd: 'auth.updateProfile' }, { userId, data })
    );
  }

  @Get('search')
  async search(@Query('q') query: string) {
    this.logger.log(`Searching users with query: ${query}`);
    const result = await firstValueFrom(
      this.authClient.send({ cmd: 'auth.searchUsers' }, { query }),
    );
    return result;
  }

  @Get('suggestions')
  async getSuggestions(
    @Req() req: Request,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const user = req.user as any;
    const userId = user.userId || user.sub || user.id;
    return firstValueFrom(
      this.authClient.send({ cmd: 'auth.getSuggestions' }, { userId, page, limit })
    );
  }

  @Get(':id')
  async getOneUser(@Param('id') userId: string) {
    return firstValueFrom(
      this.authClient.send({ cmd: 'auth.findOneUser' }, { userId })
    );
  }
}
