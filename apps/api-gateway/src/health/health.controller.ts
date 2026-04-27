// apps/api-gateway/src/health/health.controller.ts
import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, catchError, of } from 'rxjs';

@Controller('health')
export class HealthController {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    @Inject('PROJECT_SERVICE') private readonly projectClient: ClientProxy,
    @Inject('AI_SERVICE') private readonly aiClient: ClientProxy,
    @Inject('HOME_SERVICE') private readonly homeClient: ClientProxy,
  ) {}

  private cachedResult: any = null;
  private lastFetchedAt: number = 0;
  private readonly CACHE_TTL = 60000; // 60 seconds

  @Get()
  async getHealth() {
    const now = Date.now();
    if (this.cachedResult && now - this.lastFetchedAt < this.CACHE_TTL) {
      return {
        ...this.cachedResult,
        fromCache: true,
        remainingTtl: Math.round((this.CACHE_TTL - (now - this.lastFetchedAt)) / 1000),
      };
    }

    const services = [
      { name: 'Auth Service', client: this.authClient },
      { name: 'Project Service', client: this.projectClient },
      { name: 'AI Engine', client: this.aiClient },
      { name: 'Home Service', client: this.homeClient },
    ];

    const results = await Promise.all(
      services.map(async (service) => {
        try {
          const res = await firstValueFrom(
            service.client.send({ cmd: 'health.ping' }, {}).pipe(
              timeout(2000),
              catchError((err) => {
                if (err.name === 'TimeoutError') {
                    throw err;
                }
                return of({ alive: true });
              }),
            ),
          );
          return { name: service.name, status: 'up' };
        } catch (error) {
          return { name: service.name, status: 'down' };
        }
      }),
    );

    const allServices = [
      { name: 'API Gateway', status: 'up' },
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
