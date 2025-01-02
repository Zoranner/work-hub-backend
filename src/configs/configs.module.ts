import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Config } from './entities/config.entity';
import { ConfigsService } from './configs.service';

@Module({
  imports: [TypeOrmModule.forFeature([Config, User])],
  controllers: [],
  providers: [ConfigsService],
  exports: [ConfigsService],
})
export class ConfigsModule {}
