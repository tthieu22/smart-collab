import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('api/projects')
@UseGuards(JwtAuthGuard)
export class ProjectController {
  constructor(
    @Inject('PROJECT_SERVICE') private projectClient: ClientProxy,
  ) {}

  @Get()
  async getProjects(@Request() req: any) {
    try {
      const result = await this.projectClient.send('project.findAll', { userId: req.user.userId }).toPromise();
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch projects',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async getProject(@Param('id') id: string, @Request() req: any) {
    try {
      const result = await this.projectClient.send('project.findOne', { 
        id, 
        userId: req.user.userId 
      }).toPromise();
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch project',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  async createProject(@Body() createProjectDto: any, @Request() req: any) {
    try {
      const result = await this.projectClient.send('project.create', {
        ...createProjectDto,
        userId: req.user.userId,
      }).toPromise();
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create project',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  async updateProject(@Param('id') id: string, @Body() updateProjectDto: any, @Request() req: any) {
    try {
      const result = await this.projectClient.send('project.update', {
        id,
        ...updateProjectDto,
        userId: req.user.userId,
      }).toPromise();
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update project',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  async deleteProject(@Param('id') id: string, @Request() req: any) {
    try {
      const result = await this.projectClient.send('project.remove', {
        id,
        userId: req.user.userId,
      }).toPromise();
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to delete project',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
