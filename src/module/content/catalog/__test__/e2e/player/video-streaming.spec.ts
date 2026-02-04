import { HttpStatus, INestApplication } from '@nestjs/common'
import { TestingModule } from '@nestjs/testing'
import { videoFactory } from '@contentModule/__test__/factory/video.factory'
import { CONTENT_TEST_FIXTURES } from '@contentModule/__test__/test.constant'
import { ContentCatalogModule } from '@contentModule/catalog/content-catalog.module'
import { faker } from '@faker-js/faker'
import { Tables } from '@testInfra/enum/table.enum'
import { testDbClient } from '@testInfra/knex.database'
import { createNestApp } from '@testInfra/test-e2e.setup'
import fs from 'fs'
import { cleanAll } from 'nock'
import request from 'supertest'

// tradeoff: mock dependency on another dependency
const fakeUserId = faker.string.uuid()
jest.mock('jsonwebtoken', () => ({
  verify: (_token: string, _secret: string, _options: any, callback: any) => {
    callback(null, { sub: fakeUserId })
  },
}))

describe('VideoStreamingController (e2e)', () => {
  let moduleFixture: TestingModule
  let app: INestApplication

  beforeAll(async () => {
    const nestTestSetup = await createNestApp([ContentCatalogModule])
    app = nestTestSetup.app
    moduleFixture = nestTestSetup.module
  })

  beforeEach(() => {
    jest
      .useFakeTimers({ advanceTimers: true })
      .setSystemTime(new Date('2023-01-01'))
  })

  afterEach(async () => {
    await testDbClient(Tables.VideoMetadata).del()
    await testDbClient(Tables.Video).del()
    await testDbClient(Tables.Movie).del()
    await testDbClient(Tables.Content).del()
    cleanAll()
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
      const video = videoFactory.build({
        url: `${CONTENT_TEST_FIXTURES}/sample.mp4`,
      })

      await testDbClient(Tables.Video).insert(video)

      const videoId = video.id
      const videoSize = 1430145
      const videoRange = `bytes=0-${videoSize - 1}`

      const response = await request(app.getHttpServer())
        .get(`/stream/${videoId}`)
        .set('Authorization', `Bearer fake-token`)
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
        .set('Authorization', `Bearer fake-token`)
        .expect(HttpStatus.NOT_FOUND)
    })
  })
})
