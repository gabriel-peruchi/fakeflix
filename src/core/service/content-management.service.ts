import { Injectable } from '@nestjs/common'
import { PrismaService } from '@src/persistence/prisma/prisma.service'
import { randomUUID } from 'node:crypto'

export interface CreateContentData {
  url: string
  title: string
  thumbnailUrl: string
  description: string
  sizeInKb: number
}

@Injectable()
export class ContentManagementService {
  constructor(private readonly prismaService: PrismaService) {}

  async createContent(data: CreateContentData) {
    const createdVideo = await this.prismaService.video.create({
      data: {
        id: randomUUID(),
        duration: 100,
        url: data.url,
        title: data.title,
        createdAt: new Date(),
        updatedAt: new Date(),
        thumbnailUrl: data.thumbnailUrl,
        description: data.description,
        sizeInKb: data.sizeInKb,
      },
    })

    return createdVideo
  }
}
