import { HttpStatus, INestApplication } from '@nestjs/common'
import { TestingModule } from '@nestjs/testing'
import fs from 'node:fs'
import request from 'supertest'
import nock, { cleanAll } from 'nock'
import { createNestApp } from '@testInfra/test-e2e.setup'
import { ContentModule } from '@contentModule/content.module'
import { testDbClient } from '@testInfra/knex.database'
import { Tables } from '@testInfra/enum/table.enum'
import { CONTENT_TEST_FIXTURES } from '@contentModule/__test__/test.constant'

describe('AdminMovieController (e2e)', () => {
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
    await testDbClient(Tables.Thumbnail).del()
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

  describe('/movie (POST)', () => {
    it('should upload a video', async () => {
      // nock has support to native fetch only in 14.0.0-beta.6 https://github.com/nock/nock/issues/2397
      nock('https://api.themoviedb.org/3', {
        encodedQueryParams: true,
        reqheaders: {
          Authorization: (): boolean => true,
        },
      })
        .defaultReplyHeaders({ 'access-control-allow-origin': '*' })
        .get(`/search/keyword`)
        .query({ query: 'Test video', page: '1' })
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

      const video = {
        title: 'Test video',
        description: 'This is a test video',
        videoUrl: 'uploads/test.mp4',
        thumbnailUrl: 'uploads/test.jpg',
        sizeInKb: 1430145,
        duration: null,
      }

      await request(app.getHttpServer())
        .post('/admin/movie')
        .attach('video', `${CONTENT_TEST_FIXTURES}/sample.mp4`)
        .attach('thumbnail', `${CONTENT_TEST_FIXTURES}/sample.jpg`)
        .field('title', video.title)
        .field('description', video.description)
        .expect(HttpStatus.CREATED)
        .expect((response) => {
          expect(response.body).toMatchObject({
            title: video.title,
            description: video.description,
            url: expect.stringContaining('mp4'),
          })
        })
    })

    it('throws an error if thumbnail is not provided', async () => {
      const video = {
        title: 'Test video',
        description: 'This is a test video',
      }

      await request(app.getHttpServer())
        .post('/admin/movie')
        .attach('video', `${CONTENT_TEST_FIXTURES}/sample.mp4`)
        .field('title', video.title)
        .field('description', video.description)
        .expect(HttpStatus.BAD_REQUEST)
        .expect({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Video and thumbnail are required.',
        })
    })

    it('does not allow non mp4 video files', async () => {
      const video = {
        title: 'Test video',
        description: 'This is a test video',
      }

      await request(app.getHttpServer())
        .post('/admin/movie')
        .attach('video', `${CONTENT_TEST_FIXTURES}/sample.mp3`)
        .attach('thumbnail', `${CONTENT_TEST_FIXTURES}/sample.jpg`)
        .field('title', video.title)
        .field('description', video.description)
        .expect(HttpStatus.BAD_REQUEST)
        .expect({
          statusCode: 400,
          error: 'Bad Request',
          message:
            'Invalid file type. Only video/mp4 and image/jpeg are supported.',
        })
    })
  })
})
