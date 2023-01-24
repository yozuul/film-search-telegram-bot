import { resolve } from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { TelegrafModule } from 'nestjs-telegraf';
import * as LocalSession from 'telegraf-session-local';

import { User } from './user/user.model';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';

@Module({
  imports: [
     ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: '.env',
     }),
     SequelizeModule.forRoot({
        dialect: 'sqlite',
        storage: resolve('filmer.db'),
        models: [User],
        autoLoadModels: true,
        logging: false
     }),
     TelegrafModule.forRoot({
        middlewares: [
          new LocalSession({ database: 'session_db.json' })
        ],
        token: process.env.BOT_TOKEN,
     }),
     UserModule,
  ],
  providers: [AppService],
})
export class AppModule {}
