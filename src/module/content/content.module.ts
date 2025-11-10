import { Module } from '@nestjs/common'
import { PersistenceModule } from '@contentModule/persistence/persistence.module'
import { ConfigModule } from '@sharedModules/config/config.module'
import { MediaPlayerController } from '@contentModule/http/rest/controller/media-player.controller'
import { ContentRepository } from '@contentModule/persistence/repository/content.repository'
import { VideoRepository } from '@contentModule/persistence/repository/video.repository'
import { ExternalMovieRatingClient } from '@contentModule/http/rest/client/external-movie-rating/external-movie-rating.client'
import { HttpClientModule } from '@sharedModules/http-client/http-client.module'
import { AdminMovieController } from './http/rest/controller/admin-movie.controller'
import { AdminTvShowController } from './http/rest/controller/admin-tv-show.controller'
import { AgeRecommendationService } from './core/service/age-recommendation.service'
import { VideoProfanityFilterService } from './core/service/video-profanity-filter.service'
import { VideoProcessorService } from './core/service/video-processor.service'
import { EpisodeLifecycleService } from './core/service/episode-lifecycle.service'
import { CreateMovieUseCase } from './core/use-case/create-movie.use-case'
import { CreateTvShowEpisodeUseCase } from './core/use-case/create-tv-show-episode.use-case'
import { CreateTvShowUseCase } from './core/use-case/create-tv-show.use-case'
import { GetStreamingURLUseCase } from './core/use-case/get-streaming-url.use-case'
import { ContentDistributionService } from './core/service/content-distribution.service'

@Module({
  imports: [
    PersistenceModule.forRoot(),
    ConfigModule.forRoot(),
    HttpClientModule,
  ],
  controllers: [
    AdminMovieController,
    MediaPlayerController,
    AdminTvShowController,
  ],
  providers: [
    ContentRepository,
    VideoRepository,
    ExternalMovieRatingClient,
    AgeRecommendationService,
    VideoProfanityFilterService,
    VideoProcessorService,
    EpisodeLifecycleService,
    CreateMovieUseCase,
    CreateTvShowEpisodeUseCase,
    CreateTvShowUseCase,
    GetStreamingURLUseCase,
    ContentDistributionService,
  ],
})
export class ContentModule {}
