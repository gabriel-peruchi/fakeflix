import { VideoMetadata } from '@contentModule/persistence/entity/video-metadata.entity'
import { Video } from '@contentModule/persistence/entity/video.entity'
import { VideoMetadataRepository } from '@contentModule/persistence/repository/video-metadata.repository'
import { Inject, Injectable } from '@nestjs/common'
import { AppLogger } from '@sharedModules/logger/service/app-logger.service'
import { VideoTranscriptAdapter } from '../adapter/video-transcript.adapter.interface'

@Injectable()
export class TranscribeVideoUseCase {
  constructor(
    @Inject(VideoTranscriptAdapter)
    private readonly videoTranscript: VideoTranscriptAdapter,
    private readonly videoMetadataRepository: VideoMetadataRepository,
    private readonly logger: AppLogger,
  ) {}

  public async execute(video: Video): Promise<void> {
    const transcript = await this.videoTranscript.generateTranscript(video.url)

    if (!transcript) {
      throw new Error(
        `Failed to generate transcript for video with ID ${video.id}`,
      )
    }

    this.logger.log(`Generated transcript for video ID ${video.id}`, {
      transcript,
      videoId: video.id,
    })

    const metadata = await this.videoMetadataRepository.findOneBy({
      where: { video },
    })

    if (metadata) {
      metadata.transcript = transcript
      await this.videoMetadataRepository.save(metadata)
      return
    }

    const newMetadata = new VideoMetadata({
      transcript,
      video,
    })

    await this.videoMetadataRepository.save(newMetadata)
  }
}
