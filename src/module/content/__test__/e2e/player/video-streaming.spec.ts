import { CONTENT_TEST_FIXTURES } from '@contentModule/__test__/constants'
import { ContentModule } from '@contentModule/content.module'
import { CreateMovieUseCase } from '@contentModule/core/use-case/create-movie.use-case'
import { HttpStatus, INestApplication } from '@nestjs/common'
import { TestingModule } from '@nestjs/testing'
import { Tables } from '@testInfra/enum/table.enum'
import { testDbClient } from '@testInfra/knex.database'
import { createNestApp } from '@testInfra/test-e2e.setup'
import nock, { cleanAll } from 'nock'
import * as fs from 'node:fs'
import request from 'supertest'

describe('VideoStreamingController (e2e)', () => {
  let moduleFixture: TestingModule
  let app: INestApplication
  let createMovieUseCase: CreateMovieUseCase

  beforeAll(async () => {
    const nestTestSetup = await createNestApp([ContentModule])
    app = nestTestSetup.app
    moduleFixture = nestTestSetup.module

    createMovieUseCase =
      moduleFixture.get<CreateMovieUseCase>(CreateMovieUseCase)
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

      nock('https://generativelanguage.googleapis.com')
        .post('/v1beta/models/gemini-2.0-flash:generateContent')
        .query(true) // Match any query parameters
        .reply(200, {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      responseText: 'This is a test video summary.',
                    }),
                  },
                ],
              },
              finishReason: 'STOP',
              index: 0,
            },
          ],
        })

      nock('https://generativelanguage.googleapis.com')
        .post('/v1beta/models/gemini-2.0-flash:generateContent')
        .query(true) // Match any query parameters
        .reply(200, {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      responseText: 'This is a test video transcript.',
                    }),
                  },
                ],
              },
              finishReason: 'STOP',
              index: 0,
            },
          ],
        })

      nock('https://generativelanguage.googleapis.com')
        .post('/v1beta/models/gemini-2.0-flash:generateContent')
        .query(true) // Match any query parameters
        .reply(200, {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      ageRating: 12,
                      explanation:
                        'The video contains mild language and thematic elements appropriate for viewers 12 and above.',
                      categories: ['language', 'thematic elements'],
                    }),
                  },
                ],
              },
              finishReason: 'STOP',
              index: 0,
            },
          ],
        })

      const createMovie = await createMovieUseCase.execute({
        title: 'Test Video',
        description: 'This is a test video',
        videoUrl: `${CONTENT_TEST_FIXTURES}/sample.mp4`,
        thumbnailUrl: `${CONTENT_TEST_FIXTURES}/sample.jpg`,
        sizeInKb: 1430145,
      })

      const videoId = createMovie.movie.video.id
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
