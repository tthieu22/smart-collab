// prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { ProjectPrismaService } from './prisma.service';

@Global() // dùng Global để khỏi phải import nhiều lần
@Module({
  providers: [ProjectPrismaService],
  exports: [ProjectPrismaService],
})
export class ProjectPrismaModule {}
