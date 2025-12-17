import { MovieContentModel } from '@contentModule/core/model/movie-content.model'
import { VideoProcessorService } from '@contentModule/core/service/video-processor.service'
import { ExternalMovieRatingClient } from '@contentModule/http/client/external-movie-rating/external-movie-rating.client'
import { Movie } from '@contentModule/persistence/entity/movie.entity'
import { Thumbnail } from '@contentModule/persistence/entity/thumbnail.entity'
import { Video } from '@contentModule/persistence/entity/video.entity'
import { ContentRepository } from '@contentModule/persistence/repository/content.repository'
import { Injectable } from '@nestjs/common'

export interface ExternalMovieRating {
  rating: number
}

@Injectable()
export class CreateMovieUseCase {
  constructor(
    private readonly contentRepository: ContentRepository,
    private readonly videoProcessorService: VideoProcessorService,
    private readonly externalMovieRatingClient: ExternalMovieRatingClient,
  ) {}

  async execute(video: {
    title: string
    videoUrl: string
    sizeInKb: number
    description: string
    thumbnailUrl?: string
  }): Promise<MovieContentModel> {
    const externalRating = await this.externalMovieRatingClient.getRating(
      video.title,
    )

    const contentModel = new MovieContentModel({
      title: video.title,
      description: video.description,
      ageRecommendation: null,
      movie: new Movie({
        externalRating: externalRating ?? null,
        video: new Video({
          url: video.videoUrl,
          sizeInKb: video.sizeInKb,
        }),
      }),
    })

    if (video.thumbnailUrl) {
      contentModel.movie.thumbnail = new Thumbnail({
        url: video.thumbnailUrl,
      })
    }

    const content = await this.contentRepository.saveMovie(contentModel)

    await this.videoProcessorService.processMetadataAndModeration(
      contentModel.movie.video,
    )

    return content
  }
}
