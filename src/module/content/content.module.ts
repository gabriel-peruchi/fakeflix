import { Module } from '@nestjs/common'
import { PersistenceModule } from '@contentModule/persistence/persistence.module'
import { ConfigModule } from '@sharedModules/config/config.module'
import { VideoUploadController } from '@contentModule/http/rest/controller/video-upload.controller'
import { MediaPlayerController } from '@contentModule/http/rest/controller/media-player.controller'
import { ContentManagementService } from '@contentModule/core/service/content-management.service'
import { MediaPlayerService } from '@contentModule/core/service/media-player.service'
import { ContentRepository } from '@contentModule/persistence/repository/content.repository'
import { VideoRepository } from '@contentModule/persistence/repository/video.repository'
import { ExternalMovieRatingClient } from '@contentModule/http/rest/client/external-movie-rating/external-movie-rating.client'
import { HttpClientModule } from '@sharedModules/http-client/http-client.module'

@Module({
  imports: [
    PersistenceModule.forRoot(),
    ConfigModule.forRoot(),
    HttpClientModule,
  ],
  controllers: [VideoUploadController, MediaPlayerController],
  providers: [
    ContentManagementService,
    MediaPlayerService,
    ContentRepository,
    VideoRepository,
    ExternalMovieRatingClient,
  ],
})
export class ContentModule {}
