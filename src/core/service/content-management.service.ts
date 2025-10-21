import { Injectable } from '@nestjs/common'
import { ContentRepository } from '@src/persistence/repository/content.repository'
import { Content } from '@src/persistence/entity/content.entity'
import { ContentType } from '../enum/content-type.enum'
import { Movie } from '@src/persistence/entity/movie.entity'
import { Video } from '@src/persistence/entity/video.entity'
import { Thumbnail } from '@src/persistence/entity/thumbnail.entity'
import { ExternalMovieRatingClient } from '@src/http/rest/client/external-movie-rating/external-movie-rating.client'

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
