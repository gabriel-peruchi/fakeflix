import { DefaultTypeOrmRepository } from '@sharedModules/persistence/typeorm/repository/default-typeorm.repository'
import { Episode } from '@contentModule/persistence/entity/episode.entity'
import { Injectable } from '@nestjs/common'
import { EntityManager } from 'typeorm'

@Injectable()
export class EpisodeRepository extends DefaultTypeOrmRepository<Episode> {
  constructor(readonly entityManager: EntityManager) {
    super(Episode, entityManager)
  }

  async findOneLastByTvShowAndSeason(
    tvShowId: string,
    season: number,
  ): Promise<Episode | null> {
    return this.findOneBy({
      where: {
        tvShowId,
        season,
      },
      order: {
        number: 'DESC',
      },
    })
  }
}
