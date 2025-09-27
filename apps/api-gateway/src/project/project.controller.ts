// apps/api-gateway/src/project/project.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ProjectService } from './project.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() body: any) {
    // body = { name: "SmartCollab", description: "Demo event flow" }
    return this.projectService.createProject(body);
  }
}
