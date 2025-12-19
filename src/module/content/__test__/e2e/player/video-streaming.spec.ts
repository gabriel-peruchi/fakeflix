import { CONTENT_TEST_FIXTURES } from '@contentModule/__test__/test.constant'
import { videoFactory } from '@contentModule/__test__/factory/video.factory'
import { ContentModule } from '@contentModule/content.module'
import { HttpStatus, INestApplication } from '@nestjs/common'
import { TestingModule } from '@nestjs/testing'
import { Tables } from '@testInfra/enum/table.enum'
import { testDbClient } from '@testInfra/knex.database'
import { createNestApp } from '@testInfra/test-e2e.setup'
import nock, { cleanAll } from 'nock'
import * as fs from 'node:fs'
import request from 'supertest'
import { faker } from '@faker-js/faker'
import { contentFactory } from '@contentModule/__test__/factory/content.factory'
import { movieFactory } from '@contentModule/__test__/factory/movie.factory'

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
    const nestTestSetup = await createNestApp([ContentModule])
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
      // nock has support to native fetch only in 14.0.0-beta.6 https://github.com/nock/nock/issues/2397
      nock('https://api.themoviedb.org/3', {
        encodedQueryParams: true,
        reqheaders: {
          Authorization: (): boolean => true,
        },
      })
        .defaultReplyHeaders({ 'access-control-allow-origin': '*' })
        .get(`/search/keyword`)
        .query({ query: 'Test Video', page: '1' })
        .reply(200, { results: [{ id: '1' }] })

      nock('https://api.themoviedb.org/3', {
        encodedQueryParams: true,
        reqheaders: {
          Authorization: (): boolean => true,
        },
      })
        .defaultReplyHeaders({ 'access-control-allow-origin': '*' })
        .get(`discover/movie`)
        .query({ with_keywords: '1' })
        .reply(200, { results: [{ vote_average: 8.5 }] })

      const content = contentFactory.build()
      const movie = movieFactory.build({ contentId: content.id })
      const video = videoFactory.build({
        movieId: movie.id,
        url: `${CONTENT_TEST_FIXTURES}/sample.mp4`,
      })

      await testDbClient(Tables.Content).insert(content)
      await testDbClient(Tables.Movie).insert(movie)
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
