import { Module } from '@nestjs/common';
import { AuthMessageHandler } from './auth.message-handler';
import { UserModule } from '../modules/user/user.module';
import { OtcModule } from '../modules/otc/otc.module';
import { AuthModule as AuthServiceModule } from '../modules/auth/auth.module';

@Module({
  imports: [UserModule, OtcModule, AuthServiceModule],
  providers: [AuthMessageHandler],
  exports: [AuthMessageHandler],
})
export class MessageHandlersModule {}
