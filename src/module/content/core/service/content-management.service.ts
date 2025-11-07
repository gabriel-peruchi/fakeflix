import { ExternalMovieRatingClient } from '@contentModule/http/rest/client/external-movie-rating/external-movie-rating.client'
import { Movie } from '@contentModule/persistence/entity/movie.entity'
import { ContentRepository } from '@contentModule/persistence/repository/content.repository'
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { Video } from '@contentModule/persistence/entity/video.entity'
import { Thumbnail } from '@contentModule/persistence/entity/thumbnail.entity'
import { EpisodeRepository } from '@contentModule/persistence/repository/episode.repository'
import { VideoMetadataService } from './video-metadata.service'
import { VideoProfanityFilterService } from './video-profanity-filter.service'
import { AgeRecommendationService } from './age-recommendation.service'
import { TvShow } from '@contentModule/persistence/entity/tv-show.entity'
import { CreateEpisodeRequestDto } from '@contentModule/http/rest/dto/request/create-episode-request.dto'
import { Episode } from '@contentModule/persistence/entity/episode.entity'
import { MovieContentModel } from '../model/movie-content.model'
import { TvShowContentModel } from '../model/tv-show-content.model'
import { TransactionManager } from '@contentModule/persistence/transaction.manager'

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
    private readonly episodeRepository: EpisodeRepository,
    private readonly videoMetadataService: VideoMetadataService,
    private readonly videoProfanityFilterService: VideoProfanityFilterService,
    private readonly ageRecommendationService: AgeRecommendationService,
    private readonly transactionManager: TransactionManager,
  ) {}

  async createMovie(data: CreateVideoData): Promise<MovieContentModel> {
    const externalRating = await this.externalMovieRatingClient.getRating(
      data.title,
    )

    const contentEntity = new MovieContentModel({
      title: data.title,
      description: data.description,
      ageRecommendation: null,
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

    return await this.contentRepository.saveMovie(contentEntity)
  }

  async createTvShow(tvShow: {
    //TODO add userId
    title: string
    description: string
    thumbnailUrl?: string
  }): Promise<TvShowContentModel> {
    const content = new TvShowContentModel({
      title: tvShow.title,
      description: tvShow.description,
      tvShow: new TvShow({}),
    })

    if (tvShow.thumbnailUrl && content.tvShow) {
      content.tvShow.thumbnail = new Thumbnail({
        url: tvShow.thumbnailUrl,
      })
    }

    return await this.contentRepository.saveTvShow(content)
  }

  async createEpisode(
    contentId: string,
    episodeData: CreateEpisodeRequestDto & {
      videoUrl: string
      videoSizeInKb: number
    },
  ): Promise<Episode> {
    // Problem: Requires too many repositories

    const content = await this.contentRepository.findTvShowContentById(
      contentId,
      ['tvShow'],
    )

    if (!content?.tvShow) {
      throw new NotFoundException(
        `TV Show with content id ${contentId} not found`,
      )
    }

    // Domain logic validation
    const episodeWithSameSeasonAndNumber =
      await this.episodeRepository.existsBy({
        season: episodeData.season,
        number: episodeData.number,
        tvShowId: content.tvShow.id,
      })

    if (episodeWithSameSeasonAndNumber) {
      throw new BadRequestException(
        `Episode with season ${episodeData.season} and number ${episodeData.number} already exists`,
      )
    }

    const lastEpisode =
      await this.episodeRepository.findOneLastByTvShowAndSeason(
        content.tvShow.id,
        episodeData.season,
      )

    if (lastEpisode && lastEpisode.number + 1 !== episodeData.number) {
      throw new BadRequestException(
        `Episode number should be ${lastEpisode.number + 1}`,
      )
    }

    // !Episode cannot be loaded with tvShow because of the number of records
    const episode = new Episode({
      title: episodeData.title,
      description: episodeData.description,
      season: episodeData.season,
      number: episodeData.number,
      tvShow: content.tvShow,
      video: new Video({
        url: episodeData.videoUrl,
        duration: await this.videoMetadataService.getVideoDurantaion(
          episodeData.videoUrl,
        ),
        sizeInKb: episodeData.videoSizeInKb,
      }),
    })

    // Assume it's async and will update the video later
    // TODO: implement the video profanity filter save non transactional
    await this.videoProfanityFilterService.filterProfanity(episode.video)

    const ageRecommendation =
      await this.ageRecommendationService.getAgeRecommendationForContent(
        episodeData.videoUrl,
      )

    content.ageRecommendation = ageRecommendation

    return await this.transactionManager.withTransaction(async () => {
      await this.transactionManager.transactionalContentRepository.saveTvShow(
        content,
      )
      await this.transactionManager.transactionalEpisodeRepository.save(episode)

      return episode
    })
  }
}
