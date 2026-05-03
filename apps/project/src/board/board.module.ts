import { Module } from '@nestjs/common';
import { BoardService } from './board.service';
import { ProjectPrismaModule } from '../../prisma/project.module'; // hoặc đường dẫn chính xác của bạn
import { SharedRabbitMQModule } from '../config/rabbitmq.module';
import { BoardConsumer } from './board.consumer';

@Module({
  imports: [ProjectPrismaModule, SharedRabbitMQModule], // 👈 thêm dòng này
  providers: [BoardService,
    BoardConsumer],
  exports: [BoardService],
})
export class BoardModule {}
