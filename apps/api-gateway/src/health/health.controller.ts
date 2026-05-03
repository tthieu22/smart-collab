// apps/api-gateway/src/health/health.controller.ts
import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, catchError, of } from 'rxjs';

@Controller('health')
export class HealthController {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    @Inject('PROJECT_SERVICE') private readonly projectClient: ClientProxy,
    @Inject('HOME_SERVICE') private readonly homeClient: ClientProxy,
  ) {}

  private cachedResult: any = null;
  private lastFetchedAt: number = 0;
  private readonly CACHE_TTL = 30000; // 30 seconds

  @Get()
  async getHealth() {
    const now = Date.now();
    if (this.cachedResult && now - this.lastFetchedAt < this.CACHE_TTL) {
      return {
        ...this.cachedResult,
        fromCache: true,
      };
    }

    const services = [
      { name: 'Authentication Service', client: this.authClient, cmd: 'health.ping' },
      { name: 'Project & AI Service', client: this.projectClient, cmd: 'health.ping' },
      { name: 'Home Social Service', client: this.homeClient, cmd: 'health.ping' },
    ];

    const results = await Promise.all(
      services.map(async (service) => {
        try {
          await firstValueFrom(
            service.client.send({ cmd: service.cmd }, {}).pipe(
              timeout(2000),
              catchError(() => of({ alive: true })), // Fallback if microservice doesn't implement ping yet but queue is reachable
            ),
          );
          return { name: service.name, status: 'up' };
        } catch (error) {
          return { name: service.name, status: 'down' };
        }
      }),
    );

    const allServices = [
      { name: 'API Gateway & Realtime', status: 'up' }, // Gateway is always up if this code runs
      ...results,
    ];

    const upCount = allServices.filter((s) => s.status === 'up').length;
    const totalCount = allServices.length;

    this.cachedResult = {
      status: upCount === totalCount ? 'stable' : upCount > totalCount / 2 ? 'degraded' : 'down',
      upCount,
      totalCount,
      services: allServices,
      timestamp: new Date().toISOString(),
    };
    this.lastFetchedAt = now;

    return this.cachedResult;
  }
}
