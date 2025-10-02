import { Module } from '@nestjs/common'
import { PrismaService } from './persistence/prisma/prisma.service'
import { ContentController } from './http/rest/controller/content.controller'
import { MediaPlayerService } from './core/service/media-player.service'
import { ContentManagementService } from './core/service/content-management.service'

@Module({
  imports: [],
  controllers: [ContentController],
  providers: [PrismaService, ContentManagementService, MediaPlayerService],
})
export class AppModule {}
