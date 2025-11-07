import { DynamicModule, Module } from '@nestjs/common'
import { Content } from './entity/content.entity'
import { Episode } from './entity/episode.entity'
import { Movie } from './entity/movie.entity'
import { Thumbnail } from './entity/thumbnail.entity'
import { TvShow } from './entity/tv-show.entity'
import { Video } from './entity/video.entity'
import { ContentRepository } from './repository/content.repository'
import { MovieRepository } from './repository/movie.repository'
import { VideoRepository } from './repository/video.repository'
import { TypeOrmPersistenceModule } from '@sharedModules/persistence/typeorm/typeorm-persistence.module'
import { EpisodeRepository } from './repository/episode.repository'
import { TransactionManager } from './transaction.manager'
import { DataSource } from 'typeorm'

@Module({})
export class PersistenceModule {
  static forRoot(opts?: { migrations?: string[] }): DynamicModule {
    const { migrations } = opts || {}

    return {
      module: PersistenceModule,
      imports: [
        TypeOrmPersistenceModule.forRoot({
          migrations,
          entities: [Content, Movie, Thumbnail, Video, TvShow, Episode],
        }),
      ],
      providers: [
        {
          provide: ContentRepository,
          useFactory: (dataSource: DataSource) => {
            return new ContentRepository(dataSource.manager)
          },
          inject: [DataSource],
        },
        {
          provide: MovieRepository,
          useFactory: (dataSource: DataSource) => {
            return new MovieRepository(dataSource.manager)
          },
          inject: [DataSource],
        },
        {
          provide: VideoRepository,
          useFactory: (dataSource: DataSource) => {
            return new VideoRepository(dataSource.manager)
          },
          inject: [DataSource],
        },
        {
          provide: EpisodeRepository,
          useFactory: (dataSource: DataSource) => {
            return new EpisodeRepository(dataSource.manager)
          },
          inject: [DataSource],
        },
        TransactionManager,
      ],
      exports: [
        ContentRepository,
        MovieRepository,
        VideoRepository,
        EpisodeRepository,
        TransactionManager,
      ],
    }
  }
}
