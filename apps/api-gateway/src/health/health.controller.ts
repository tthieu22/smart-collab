import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HealthCheck, HttpHealthIndicator, PrismaHealthIndicator } from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private prismaHealth: PrismaHealthIndicator,
    private prisma: PrismaService,
  ) {}

  @Get()
  @HealthCheck()
  async check() {
    try {
      // Kiểm tra DB nhanh
      await (this.prisma as any).$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        info: {
          api: { status: 'up' },
          database: { status: 'up' }
        },
        error: {},
        details: {
          api: { status: 'up' },
          database: { status: 'up' }
        }
      };
    } catch (err) {
      return {
        status: 'error',
        info: {
          api: { status: 'up' },
          database: { status: 'down' }
        },
        error: { message: (err as any).message },
        details: {
          api: { status: 'up' },
          database: { status: 'down' }
        }
      };
    }
  }
}
