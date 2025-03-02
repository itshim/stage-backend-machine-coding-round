import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import 'reflect-metadata';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: '*',
    credentials: true,
  });
  const config = new DocumentBuilder()
    .setTitle('Stage Api docs')
    .setDescription(
      'Have all the routes documentation for user, movies and tvshows',
    )
    .setVersion('1.0')
    .addServer('http://127.0.0.1:3000', 'Default Server')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      exceptionFactory: (errors) => {
        return new BadRequestException(
          errors.map((err) => ({
            field: err.property,
            errors: Object.values(err.constraints),
          })),
        );
      },
    }),
  );
  app.use(cookieParser());
  await app.listen(3001);
}
bootstrap();
