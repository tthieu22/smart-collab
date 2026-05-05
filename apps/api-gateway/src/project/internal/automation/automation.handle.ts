import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AutomationService } from './automation.service';

@Controller()
export class AutomationHandler {
  private readonly logger = new Logger(AutomationHandler.name);

  constructor(private readonly automationService: AutomationService) {}

  @MessagePattern({ cmd: 'project.automation.create' })
  async handleCreateRule(@Payload() payload: any) {
    try {
      const result = await this.automationService.createRule(payload);
      return { success: true, data: result };
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  }

  @MessagePattern({ cmd: 'project.automation.get_all' })
  async handleGetRules(@Payload() payload: any) {
    try {
      const result = await this.automationService.getRules(payload.projectId);
      return { success: true, data: result };
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  }

  @MessagePattern({ cmd: 'project.automation.delete' })
  async handleDeleteAutomation(@Payload() payload: any) {
    try {
      const result = await this.automationService.deleteRule(payload.ruleId);
      return { success: true, data: result };
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  }
}
