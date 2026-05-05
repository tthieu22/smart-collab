import { Module } from '@nestjs/common';
import { MessageHandlersModule } from './message-handlers/message-handlers.module';
@Module({
  imports: [
    MessageHandlersModule,
  ],
})
export class AuthModule {}
