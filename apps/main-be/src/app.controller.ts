import { Controller, Get, Logger, OnModuleInit } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { HomeService } from '../../auth/src/modules/home/services/home.service';

@Controller()
export class AppController implements OnModuleInit {
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly homeService: HomeService) {}

  onModuleInit() {
    this.logger.log('🚀 AppController initialized - Monitoring MessagePatterns at root');
  }
  @Get('health')
  health() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      service: 'main-be-monolith'
    };
  }

  @Get()
  root() {
    return {
      message: 'Welcome to Smart-Collab Unified Backend API',
      version: '1.0.0',
      docs: '/api/docs'
    };
  }
}
