import { MiddlewareConsumer, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ListController } from './list.controller';
import { ListService } from './list.service';
import { User, UserSchema } from '../models/user.schema';
import { Movie, MovieSchema } from 'src/models/movie.schema';
import { TVShow, TVShowSchema } from 'src/models/tvshow.schema';
import { AuthorizeMiddleware } from 'src/authorize/authorize.middleware';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Movie.name, schema: MovieSchema }]),
    MongooseModule.forFeature([{ name: TVShow.name, schema: TVShowSchema }]),
  ],
  controllers: [ListController],
  providers: [ListService],
})
export class ListModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthorizeMiddleware).forRoutes('*');
  }
}
