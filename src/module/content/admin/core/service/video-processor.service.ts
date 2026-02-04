import { VideoProcessingJobProducer } from '@contentModule/admin/queue/producer/video-processing-job.queue-producer'
import { Video } from '@contentModule/shared/persistence/entity/video.entity'
import { Injectable } from '@nestjs/common'

@Injectable()
export class VideoProcessorService {
  constructor(
    private readonly videoProcessingJobProducer: VideoProcessingJobProducer,
  ) {}

  async processMetadataAndModeration(video: Video) {
    // Triggers the async processing of video metadata and moderation
    return Promise.all([
      this.videoProcessingJobProducer.processSummary(video),
      this.videoProcessingJobProducer.processTranscript(video),
      this.videoProcessingJobProducer.processRecommendation(video),
    ])
  }
}
