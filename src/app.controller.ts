import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  UploadedFiles,
  UseInterceptors,
  NotFoundException,
} from '@nestjs/common'
import { AppService } from './app.service'
import { FileFieldsInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { randomUUID } from 'crypto'
import path, { extname } from 'path'
import { PrismaService } from './prisma.service'
import fs from 'fs'
import { Request, Response } from 'express'

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prismaService: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello()
  }

  @Post('video')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'video', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 },
      ],
      {
        dest: './uploads',
        storage: diskStorage({
          destination: './uploads',
          filename: (_req, file, cb) => {
            return cb(
              null,
              `${Date.now()}-${randomUUID()}${extname(file.originalname)}`,
            )
          },
        }),
        fileFilter: (_req, file, cb) => {
          if (file.mimetype !== 'video/mp4' && file.mimetype !== 'image/jpeg') {
            return cb(
              new BadRequestException(
                'Invalid file type. Only video/mp4 and image/jpeg are supported.',
              ),
              false,
            )
          }
          return cb(null, true)
        },
      },
    ),
  )
  async uploadVideo(
    @Req() _req: Request,
    @Body()
    contentData: {
      title: string
      description: string
    },
    @UploadedFiles()
    files: {
      video?: Express.Multer.File[]
      thumbnail?: Express.Multer.File[]
    },
  ): Promise<any> {
    const videoFile = files.video?.[0]
    const thumbnailFile = files.thumbnail?.[0]

    if (!videoFile || !thumbnailFile) {
      throw new BadRequestException('Video and thumbnail are required.')
    }

    return await this.prismaService.video.create({
      data: {
        id: randomUUID(),
        duration: 100,
        url: videoFile.path,
        title: contentData.title,
        createdAt: new Date(),
        updatedAt: new Date(),
        thumbnailUrl: thumbnailFile.path,
        description: contentData.description,
        sizeInKb: videoFile.size, // todo: ta em bytes
      },
    })
  }

  @Get('stream/:videoId')
  @Header('Content-Type', 'video/mp4')
  async streamVideo(
    @Param('videoId') videoId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<any> {
    const video = await this.prismaService.video.findUnique({
      where: { id: videoId },
    })

    if (!video) {
      throw new NotFoundException('Video not found.')
    }

    const videoPath = path.join('.', video.url)
    const videoSize = fs.statSync(videoPath).size

    const range = req.headers.range

    if (!range) {
      return res.writeHead(HttpStatus.OK, {
        'Content-Length': videoSize,
        'Content-Type': 'video/mp4',
      })
    }

    const parts = range.replace(/bytes=/, '').split('-') // bytes=0-499
    const start = parseInt(parts[0], 10)
    const end = parts[1] ? parseInt(parts[1], 10) : videoSize - 1
    const chunkSize = end - start + 1

    const fileStream = fs.createReadStream(videoPath, { start, end })

    res.writeHead(HttpStatus.PARTIAL_CONTENT, {
      'Content-Range': `bytes ${start}-${end}/${videoSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'video/mp4',
    })

    fileStream.pipe(res)
  }
}
