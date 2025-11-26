import { GetStreamingURLUseCase } from '@contentModule/core/use-case/get-streaming-url.use-case'
import {
  Controller,
  Get,
  Header,
  HttpStatus,
  Param,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common'
import path from 'path'
import fs from 'fs'
import { Request, Response } from 'express'
import { AuthGuard } from '@sharedModules/auth/guard/auth.guard'

@Controller('stream')
export class MediaPlayerController {
  constructor(
    private readonly getStreamingURLUseCase: GetStreamingURLUseCase,
  ) {}

  @Get(':videoId')
  @UseGuards(AuthGuard)
  @Header('Content-Type', 'video/mp4')
  async streamVideo(
    @Param('videoId') videoId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<any> {
    const videoUrl = await this.getStreamingURLUseCase.execute(videoId)

    const videoPath = path.join('.', videoUrl)
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
