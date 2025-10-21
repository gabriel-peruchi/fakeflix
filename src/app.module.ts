import { Module } from '@nestjs/common'
import { ContentManagementService } from '@src/core/service/content-management.service'
import { MediaPlayerService } from '@src/core/service/media-player.service'
import { ContentRepository } from '@src/persistence/repository/content.repository'
import { VideoRepository } from '@src/persistence/repository/video.repository'
import { MediaPlayerController } from '@src/http/rest/controller/media-player.controller'
import { PersistenceModule } from '@src/persistence/persistence.module'
import { VideoUploadController } from '@src/http/rest/controller/video-upload.controller'
import { HttpClient } from '@src/infra/http/client/http.client'
import { ConfigModule } from '@src/infra/module/config/config.module'
import { ExternalMovieRatingClient } from '@src/http/rest/client/external-movie-rating/external-movie-rating.client'

@Module({
  imports: [PersistenceModule.forRoot(), ConfigModule.forRoot()],
  controllers: [VideoUploadController, MediaPlayerController],
  providers: [
    ContentManagementService,
    MediaPlayerService,
    ContentRepository,
    VideoRepository,
    ExternalMovieRatingClient,
    HttpClient,
  ],
})
export class AppModule {}
