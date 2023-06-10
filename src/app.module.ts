import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { TypeOrmProviderModule } from '@providers/database.provider';
import { BaileysModule } from '@baileys/baileys.module';
import { RouterModule } from '@nestjs/core';
import { appRoutes } from './app.routes';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.${
        process.env.NODE_ENV == 'production' ? 'production' : 'development'
      }.env`,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().default('development'),
        TYPEORM_HOST: Joi.string().required(),
        TYPEORM_PORT: Joi.string().required(),
        TYPEORM_USERNAME: Joi.string().required(),
        TYPEORM_PASSWORD: Joi.string().required(),
        TYPEORM_DATABASE: Joi.string().required(),
      }),
    }),
    TypeOrmProviderModule,
    BaileysModule,
    RouterModule.register(appRoutes),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
