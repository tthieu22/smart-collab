import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiModule } from './ai/ai.module';
import { LlmService } from './llm/llm.service';
import { ModelRegistryService } from './llm/model-registry.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AiModule,
  ],
  providers: [LlmService, ModelRegistryService],
})
export class AppModule {}
