import { Module } from '@nestjs/common'
import { ContentPersistenceModule } from '@contentModule/persistence/content-persistence.module'
import { ConfigModule } from '@sharedModules/config/config.module'
import { MediaPlayerController } from '@contentModule/http/rest/controller/media-player.controller'
import { ContentRepository } from '@contentModule/persistence/repository/content.repository'
import { VideoRepository } from '@contentModule/persistence/repository/video.repository'
import { ExternalMovieRatingClient } from '@contentModule/http/client/external-movie-rating/external-movie-rating.client'
import { HttpClientModule } from '@sharedModules/http-client/http-client.module'
import { AdminMovieController } from './http/rest/controller/admin-movie.controller'
import { AdminTvShowController } from './http/rest/controller/admin-tv-show.controller'
import { AgeRecommendationService } from './core/service/age-recommendation.service'
import { VideoProcessorService } from './core/service/video-processor.service'
import { EpisodeLifecycleService } from './core/service/episode-lifecycle.service'
import { CreateMovieUseCase } from './core/use-case/create-movie.use-case'
import { CreateTvShowEpisodeUseCase } from './core/use-case/create-tv-show-episode.use-case'
import { CreateTvShowUseCase } from './core/use-case/create-tv-show.use-case'
import { GetStreamingURLUseCase } from './core/use-case/get-streaming-url.use-case'
import { ContentDistributionService } from './core/service/content-distribution.service'
import { VideoSummaryAdapter } from './core/adapter/video-summary.adapter.interface'
import { VideoTranscriptAdapter } from './core/adapter/video-transcript.adapter.interface'
import { VideoRecommendationAdapter } from './core/adapter/video-recommendation.adapter.interface'
import { GeminiTextExtractorClient } from './http/client/gemini/gemini-text-extractor.client'
import { AuthModule } from '@sharedModules/auth/auth.module'
import { LoggerModule } from '@sharedModules/logger/logger.module'
import { BullModule } from '@nestjs/bullmq'
import { ConfigService } from '@sharedModules/config/service/config.service'
import { QUEUES } from './queue/queue.constant'
import { ContentAgeRecommendationService } from './core/service/content-age-recommendation.service'
import { GenerateSummaryForVideoUseCase } from './core/use-case/generate-summary-for-video.use-case'
import { SetAgeRecommendationUseCase } from './core/use-case/set-age-recommendation.use-case'
import { TranscribeVideoUseCase } from './core/use-case/transcribe-video.use-case'
import { VideoAgeRecommendationConsumer } from './queue/consumer/video-age-recommendation.queue-consumer'
import { VideoSummaryConsumer } from './queue/consumer/video-summary.queue-consumer'
import { VideoTranscriptionConsumer } from './queue/consumer/video-transcription.queue-consumer'
import { VideoProcessingJobProducer } from './queue/producer/video-processing-job.queue-producer'

@Module({
  imports: [
    ContentPersistenceModule,
    ConfigModule.forRoot(),
    HttpClientModule,
    AuthModule,
    LoggerModule,
    BullModule.forRootAsync({
      imports: [ConfigModule.forRoot()],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get('redis.host'),
          port: configService.get('redis.port'),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: QUEUES.VIDEO_SUMMARY },
      { name: QUEUES.VIDEO_TRANSCRIPT },
      { name: QUEUES.VIDEO_AGE_RECOMMENDATION },
    ),
  ],
  controllers: [
    AdminMovieController,
    MediaPlayerController,
    AdminTvShowController,
  ],
  providers: [
    {
      provide: VideoSummaryAdapter,
      useClass: GeminiTextExtractorClient,
    },
    {
      provide: VideoTranscriptAdapter,
      useClass: GeminiTextExtractorClient,
    },
    {
      provide: VideoRecommendationAdapter,
      useClass: GeminiTextExtractorClient,
    },
    ContentRepository,
    VideoRepository,
    ExternalMovieRatingClient,
    AgeRecommendationService,
    VideoProcessorService,
    EpisodeLifecycleService,
    CreateMovieUseCase,
    CreateTvShowEpisodeUseCase,
    CreateTvShowUseCase,
    GetStreamingURLUseCase,
    ContentDistributionService,
    TranscribeVideoUseCase,
    VideoSummaryConsumer,
    VideoAgeRecommendationConsumer,
    VideoTranscriptionConsumer,
    VideoProcessingJobProducer,
    SetAgeRecommendationUseCase,
    GenerateSummaryForVideoUseCase,
    TranscribeVideoUseCase,
    ContentAgeRecommendationService,
  ],
})
export class ContentModule {}
