import { Injectable } from '@nestjs/common'
import { EntityManager } from 'typeorm'
import { DefaultTypeOrmRepository } from '@sharedModules/persistence/typeorm/repository/default-typeorm.repository'
import { Video } from '../entity/video.entity'

@Injectable()
export class VideoRepository extends DefaultTypeOrmRepository<Video> {
  constructor(readonly entityManager: EntityManager) {
    super(Video, entityManager)
  }
}
