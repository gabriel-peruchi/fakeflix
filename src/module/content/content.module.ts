import { Module } from '@nestjs/common'
import { PersistenceModule } from '@contentModule/persistence/persistence.module'
import { ConfigModule } from '@sharedModules/config/config.module'
import { MediaPlayerController } from '@contentModule/http/rest/controller/media-player.controller'
import { ContentManagementService } from '@contentModule/core/service/content-management.service'
import { MediaPlayerService } from '@contentModule/core/service/media-player.service'
import { ContentRepository } from '@contentModule/persistence/repository/content.repository'
import { VideoRepository } from '@contentModule/persistence/repository/video.repository'
import { ExternalMovieRatingClient } from '@contentModule/http/rest/client/external-movie-rating/external-movie-rating.client'
import { HttpClientModule } from '@sharedModules/http-client/http-client.module'
import { AdminMovieController } from './http/rest/controller/admin-movie.controller'
import { AdminTvShowController } from './http/rest/controller/admin-tv-show.controller'
import { AgeRecommendationService } from './core/service/age-recommendation.service'
import { VideoMetadataService } from './core/service/video-metadata.service'
import { VideoProfanityFilterService } from './core/service/video-profanity-filter.service'

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
    ContentManagementService,
    MediaPlayerService,
    ContentRepository,
    VideoRepository,
    ExternalMovieRatingClient,
    AgeRecommendationService,
    VideoMetadataService,
    VideoProfanityFilterService,
  ],
})
export class ContentModule {}
