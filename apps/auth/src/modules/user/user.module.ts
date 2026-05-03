import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { AuthPrismaModule } from '../../../prisma/prisma.module';
import { ClientsModule } from '@nestjs/microservices';
import { rabbitmqConfig } from '../../config/rabbitmq.config';

@Module({
  imports: [
    AuthPrismaModule,
    ClientsModule.register([
      {
        name: 'HOME_SERVICE',
        ...rabbitmqConfig('home_queue'),
      },
      {
        name: 'PROJECT_SERVICE',
        ...rabbitmqConfig('project_queue'),
      },
    ]),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
