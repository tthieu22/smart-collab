import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async processEvent(projectId: string, triggerType: string, payload: any) {
    this.logger.log(`Processing automation trigger: ${triggerType} for project ${projectId}`);

    const rules = await this.prisma.automationRule.findMany({
      where: { projectId, triggerType, isActive: true },
    });

    for (const rule of rules) {
      try {
        if (this.checkConditions(rule.conditions, payload)) {
          await this.executeAction(rule.actionType, rule.actionConfig, payload);
        }
      } catch (err: any) {
        this.logger.error(`Failed to execute automation rule ${rule.id}: ${err.message}`);
      }
    }
  }

  private checkConditions(conditions: any, payload: any): boolean {
    if (!conditions) return true;
    // Simple implementation: check if columnId matches
    if (conditions.columnId && payload.destColumnId !== conditions.columnId) {
      return false;
    }
    return true;
  }

  private async executeAction(actionType: string, config: any, payload: any) {
    this.logger.log(`Executing action: ${actionType} with config: ${JSON.stringify(config)}`);

    switch (actionType) {
      case 'SET_PRIORITY':
        await this.prisma.card.update({
          where: { id: payload.cardId },
          data: { priority: config.priority },
        });
        break;
      case 'ADD_LABEL':
        // Implementation for adding label
        break;
      default:
        this.logger.warn(`Unknown action type: ${actionType}`);
    }
  }

  async createRule(params: any) {
    return this.prisma.automationRule.create({ data: params });
  }

  async getRules(projectId: string) {
    return this.prisma.automationRule.findMany({ where: { projectId } });
  }

  async deleteRule(ruleId: string) {
    return this.prisma.automationRule.delete({ where: { id: ruleId } });
  }
}
