import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './filters/all-exception.filter';
import { SuccessInterceptor } from './interceptors/success.interceptor';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as bodyParser from 'body-parser';
import dayjs from 'dayjs';

async function bootstrap() {
  const utc = require('dayjs/plugin/utc');
  const customParseFormat = require('dayjs/plugin/customParseFormat');
  dayjs.extend(utc);
  dayjs.extend(customParseFormat);
  
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const httpAdapter = app.get(HttpAdapterHost);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  app.useStaticAssets(join(process.cwd(), './uploads'), { prefix: '/static' });
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
  app.enableCors({ origin: true });
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));
  app.useGlobalInterceptors(new SuccessInterceptor());
  await app.listen(process.env.BUSINESS_PORT || 9000);
}
bootstrap();
