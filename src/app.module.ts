import { join } from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConfigsModule } from './configs/configs.module';
import { GiteaBridgesModule } from './bridges/gitea-bridges/gitea-bridges.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.local.env'],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: parseInt(process.env.POSTGRES_PORT),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_NAME,
      schema: process.env.BUSINESS_POSTGRE_SCHEMA,
      entities: [join(__dirname, '**', '*.entity.{ts,js}')],
      // dropSchema: true,
      synchronize: true,
      logging: false,
    }),
    ScheduleModule.forRoot(),
    ConfigsModule,
    AuthModule,
    UsersModule,
    GiteaBridgesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
