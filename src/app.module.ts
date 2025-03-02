import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MoviesModule } from './movies/movies.module';
import { TvshowsModule } from './tvshows/tvshows.module';
import { ListModule } from './list/list.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017', {
      dbName: 'stagedb',
      connectionErrorFactory: (err) => {
        console.error('Error mongoose', err);
        return err;
      },
    }),
    MoviesModule,
    TvshowsModule,
    ListModule,
  ],
})
export class AppModule {}
