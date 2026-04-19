import { Controller, Get, Query, UseGuards, Inject, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
  ) {}

  @Get('search')
  async search(@Query('q') query: string) {
    this.logger.log(`Searching users with query: ${query}`);
    const result = await firstValueFrom(
      this.authClient.send({ cmd: 'auth.searchUsers' }, { query }),
    );
    return result;
  }
}
