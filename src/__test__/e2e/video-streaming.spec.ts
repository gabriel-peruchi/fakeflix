import { HttpStatus, INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { AppModule } from '@src/app.module'
import { ContentManagementService } from '@src/core/service/content-management.service'
import { VideoRepository } from '@src/persistence/repository/video.repository'
import * as fs from 'node:fs'
import request from 'supertest'

describe('VideoStreamingController (e2e)', () => {
  let moduleFixture: TestingModule
  let app: INestApplication
  let videoRepository: VideoRepository
  let contentManagementService: ContentManagementService

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()

    contentManagementService = moduleFixture.get<ContentManagementService>(
      ContentManagementService,
    )
    videoRepository = moduleFixture.get<VideoRepository>(VideoRepository)
  })

  beforeEach(() => {
    jest
      .useFakeTimers({ advanceTimers: true })
      .setSystemTime(new Date('2023-01-01'))
  })

  afterEach(async () => {
    await videoRepository.deleteAll()
  })

  afterAll(async () => {
    await moduleFixture.close()

    fs.rmSync('./uploads', {
      recursive: true,
      force: true,
    })
  })

  describe('/stream/:videoId (GET)', () => {
    it('should stream a video', async () => {
      const createContent = await contentManagementService.createContent({
        title: 'Test Video',
        description: 'This is a test video',
        url: './test/fixtures/sample.mp4',
        thumbnailUrl: './test/fixtures/sample.jpg',
        sizeInKb: 1430145,
      })

      const videoId = createContent.getMedia()?.getVideo()?.getId()
      const videoSize = 1430145
      const videoRange = `bytes=0-${videoSize - 1}`

      const response = await request(app.getHttpServer())
        .get(`/stream/${videoId}`)
        .set('Range', videoRange)
        .expect(HttpStatus.PARTIAL_CONTENT)

      expect(response.headers['content-type']).toBe('video/mp4')
      expect(response.headers['content-length']).toBe(String(videoSize))
      expect(response.headers['accept-ranges']).toBe('bytes')
      expect(response.headers['content-range']).toBe(
        `bytes 0-${videoSize - 1}/${videoSize}`,
      )
    })

    it('returns 404 if the video is not found', async () => {
      await request(app.getHttpServer())
        .get('/content/stream/invalid-video-id')
        .expect(HttpStatus.NOT_FOUND)
    })
  })
})
