import { Module } from '@nestjs/common'
import { MediaPlayerService } from './core/service/media-player.service'
import { ContentManagementService } from './core/service/content-management.service'
import { ContentRepository } from './persistence/repository/content.repository'
import { MediaPlayerController } from './http/rest/controller/media-player.controller'
import { VideoRepository } from './persistence/repository/video.repository'
import { PersistenceModule } from './persistence/persistence.module'
import { VideoUploadController } from './http/rest/controller/video-upload.controller'

@Module({
  imports: [PersistenceModule.forRoot()],
  controllers: [VideoUploadController, MediaPlayerController],
  providers: [
    ContentManagementService,
    MediaPlayerService,
    ContentRepository,
    VideoRepository,
  ],
})
export class AppModule {}
