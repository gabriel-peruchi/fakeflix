import { HttpStatus, INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { AppModule } from '@src/app.module'
import * as fs from 'node:fs'
import request from 'supertest'
import nock from 'nock'
import { VideoRepository } from '@contentModule/persistence/repository/video.repository'
import { MovieRepository } from '@contentModule/persistence/repository/movie.repository'
import { ContentRepository } from '@contentModule/persistence/repository/content.repository'

describe('ContentController (e2e)', () => {
  let moduleFixture: TestingModule
  let app: INestApplication
  let videoRepository: VideoRepository
  let movieRepository: MovieRepository
  let contentRepository: ContentRepository

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()

    videoRepository = moduleFixture.get<VideoRepository>(VideoRepository)
    movieRepository = moduleFixture.get<MovieRepository>(MovieRepository)
    contentRepository = moduleFixture.get<ContentRepository>(ContentRepository)
  })

  beforeEach(() => {
    jest
      .useFakeTimers({ advanceTimers: true })
      .setSystemTime(new Date('2023-01-01'))
  })

  afterEach(async () => {
    await videoRepository.deleteAll()
    await movieRepository.deleteAll()
    await contentRepository.deleteAll()
    nock.cleanAll()
  })

  afterAll(async () => {
    await moduleFixture.close()

    fs.rmSync('./uploads', {
      recursive: true,
      force: true,
    })
  })

  describe('/video (POST)', () => {
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
        duration: 100,
      }

      await request(app.getHttpServer())
        .post('/content/video')
        .attach('video', './test/fixtures/sample.mp4')
        .attach('thumbnail', './test/fixtures/sample.jpg')
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
        .post('/content/video')
        .attach('video', './test/fixtures/sample.mp4')
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
        .post('/content/video')
        .attach('video', './test/fixtures/sample.mp3')
        .attach('thumbnail', './test/fixtures/sample.jpg')
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
