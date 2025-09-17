import { Module } from '@nestjs/common';
import { OtcService } from './otc.store';

@Module({
  providers: [OtcService],
  exports: [OtcService],
})
export class OtcModule {}
