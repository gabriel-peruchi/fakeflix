import { TranscribeVideoUseCase } from '@contentModule/video-processor/core/use-case/transcribe-video.use-case'
import { QUEUES } from '@contentModule/shared/queue/queue.constant'
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq'
import { OnApplicationShutdown } from '@nestjs/common'
import { AppLogger } from '@sharedModules/logger/service/app-logger.service'
import { Job } from 'bullmq'
import { VideoRepository } from '@contentModule/shared/persistence/repository/video.repository'

@Processor(QUEUES.VIDEO_TRANSCRIPT)
export class VideoTranscriptionConsumer
  extends WorkerHost
  implements OnApplicationShutdown
{
  constructor(
    private readonly videoRepository: VideoRepository,
    private readonly transcribeVideoUseCase: TranscribeVideoUseCase,
    private readonly logger: AppLogger,
  ) {
    super()
  }

  async process(job: Job<{ videoId: string; url: string }, void>) {
    this.logger.log(`Processing transcript for video ID: ${job.data.videoId}`)

    const video = await this.videoRepository.findOneById(job.data.videoId, [
      'metadata',
    ])

    if (!video) {
      throw new Error(`Video with ID ${job.data.videoId} not found`)
    }

    try {
      await this.transcribeVideoUseCase.execute(video)
    } catch (error) {
      this.logger.error(
        `Error processing transcription for video ${video.id}`,
        {
          error,
          videoId: video.id,
        },
      )

      throw new Error(
        `Failed to process transcription for video ID ${video.id}`,
      )
    }
  }

  async onApplicationShutdown() {
    await this.worker.close(true)
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job failed: ${job.id}`, {
      job,
      error,
    })

    //Do something with the error, log it, send a notification, put in a dead letter queue, etc.
  }
}
