import { Inject, Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { DefaultTypeOrmRepository } from '@sharedModules/persistence/typeorm/repository/default-typeorm.repository'
import { Video } from '../entity/video.entity'

@Injectable()
export class VideoRepository extends DefaultTypeOrmRepository<Video> {
  constructor(@Inject(DataSource) readonly dataSource: DataSource) {
    super(Video, dataSource)
  }
}
