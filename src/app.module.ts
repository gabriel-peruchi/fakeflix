import { Module } from '@nestjs/common'
import { PrismaService } from './persistence/prisma/prisma.service'
import { ContentController } from './http/rest/controller/content.controller'
import { MediaPlayerService } from './core/service/media-player.service'
import { ContentManagementService } from './core/service/content-management.service'
import { ContentRepository } from './persistence/repository/content.repository'
import { MediaPlayerController } from './http/rest/controller/media-player.controller'
import { VideoRepository } from './persistence/repository/video.repository'

@Module({
  imports: [],
  controllers: [ContentController, MediaPlayerController],
  providers: [
    PrismaService,
    ContentManagementService,
    MediaPlayerService,
    ContentRepository,
    VideoRepository,
  ],
})
export class AppModule {}
