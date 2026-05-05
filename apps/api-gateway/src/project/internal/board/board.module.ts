import { Module } from '@nestjs/common';
import { BoardService } from './board.service';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [BoardService],
  exports: [BoardService],
})
export class BoardModule {}
