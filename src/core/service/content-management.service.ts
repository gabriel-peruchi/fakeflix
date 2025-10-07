import { Injectable } from '@nestjs/common'
import { ContentRepository } from '@src/persistence/repository/content.repository'
import { ContentEntity, ContentType } from '../entity/content.entity'
import { MovieEntity } from '../entity/movie.entity'
import { VideoEntity } from '../entity/video.entity'
import { ThumbnailEntity } from '../entity/thumbnail.entity'

export interface CreateContentData {
  url: string
  title: string
  thumbnailUrl: string
  description: string
  sizeInKb: number
}

@Injectable()
export class ContentManagementService {
  constructor(private readonly contentRepository: ContentRepository) {}

  async createContent(data: CreateContentData) {
    const content = ContentEntity.createNew({
      title: data.title,
      type: ContentType.MOVIE,
      description: data.description,
      media: MovieEntity.createNew({
        video: VideoEntity.createNew({
          url: data.url,
          duration: 100,
          sizeInKb: data.sizeInKb,
        }),
        thumbnail: ThumbnailEntity.createNew({
          url: data.thumbnailUrl,
        }),
      }),
    })

    await this.contentRepository.create(content)

    return content
  }
}
