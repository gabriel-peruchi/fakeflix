import { ExternalMovieRatingClient } from '@contentModule/http/rest/client/external-movie-rating/external-movie-rating.client'
import { Content } from '@contentModule/persistence/entity/content.entity'
import { Movie } from '@contentModule/persistence/entity/movie.entity'
import { ContentRepository } from '@contentModule/persistence/repository/content.repository'
import { Injectable } from '@nestjs/common'
import { ContentType } from '../enum/content-type.enum'
import { Video } from '@contentModule/persistence/entity/video.entity'
import { Thumbnail } from '@contentModule/persistence/entity/thumbnail.entity'

export interface CreateVideoData {
  url: string
  title: string
  thumbnailUrl: string
  description: string
  sizeInKb: number
}

@Injectable()
export class ContentManagementService {
  constructor(
    private readonly contentRepository: ContentRepository,
    private readonly externalMovieRatingClient: ExternalMovieRatingClient,
  ) {}

  async createMovie(data: CreateVideoData): Promise<Content> {
    const externalRating = await this.externalMovieRatingClient.getRating(
      data.title,
    )

    const contentEntity = new Content({
      title: data.title,
      description: data.description,
      type: ContentType.MOVIE,
      movie: new Movie({
        externalRating,
        video: new Video({
          url: data.url,
          duration: 10,
          sizeInKb: data.sizeInKb,
        }),
      }),
    })

    if (data.thumbnailUrl) {
      contentEntity.movie.thumbnail = new Thumbnail({
        url: data.thumbnailUrl,
      })
    }

    const content = await this.contentRepository.save(contentEntity)

    return content
  }
}
