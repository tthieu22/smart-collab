import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('api/tasks')
@UseGuards(JwtAuthGuard)
export class TaskController {
  constructor(
    @Inject('TASK_SERVICE') private taskClient: ClientProxy,
  ) {}

  @Get()
  async getTasks(@Request() req: any) {
    try {
      const result = await this.taskClient.send('task.findAll', { userId: req.user.userId }).toPromise();
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch tasks',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async getTask(@Param('id') id: string, @Request() req: any) {
    try {
      const result = await this.taskClient.send('task.findOne', { 
        id, 
        userId: req.user.userId 
      }).toPromise();
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch task',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  async createTask(@Body() createTaskDto: any, @Request() req: any) {
    try {
      const result = await this.taskClient.send('task.create', {
        ...createTaskDto,
        userId: req.user.userId,
      }).toPromise();
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create task',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  async updateTask(@Param('id') id: string, @Body() updateTaskDto: any, @Request() req: any) {
    try {
      const result = await this.taskClient.send('task.update', {
        id,
        ...updateTaskDto,
        userId: req.user.userId,
      }).toPromise();
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update task',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  async deleteTask(@Param('id') id: string, @Request() req: any) {
    try {
      const result = await this.taskClient.send('task.remove', {
        id,
        userId: req.user.userId,
      }).toPromise();
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to delete task',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
