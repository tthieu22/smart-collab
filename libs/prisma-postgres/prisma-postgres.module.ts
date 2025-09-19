import { Global, Module } from '@nestjs/common';
import { PostgresPrismaService } from './prisma-postgres.service';

@Global()
@Module({
  providers: [PostgresPrismaService],
  exports: [PostgresPrismaService],
})
export class PostgresPrismaModule {}
