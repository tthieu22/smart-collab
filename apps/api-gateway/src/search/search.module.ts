import { Module, Global } from '@nestjs/common';
import { SearchController } from './search.controller';
import { ProjectModule } from '../project/project.module';
import { HomeModule } from '../home/home.module';

@Global()
@Module({
  imports: [
    ProjectModule,
    HomeModule,
  ],
  controllers: [SearchController],
})
export class SearchModule {}
