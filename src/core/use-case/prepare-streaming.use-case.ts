import { PrismaService } from '@src/persistence/prisma/prisma.service'

export class PrepareStreamingUseCase {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(videoId: string) {
    const video = await this.prismaService.video.findUnique({
      where: { id: videoId },
    })

    return video?.url
  }
}
