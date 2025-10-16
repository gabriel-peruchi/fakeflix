import { Inject, Injectable } from '@nestjs/common'
import { DefaultTypeOrmRepository } from '@src/infra/module/typeorm/repository/default-typeorm.repository'
import { DataSource } from 'typeorm'
import { Video } from '../entity/video.entity'

@Injectable()
export class VideoRepository extends DefaultTypeOrmRepository<Video> {
  constructor(@Inject(DataSource) readonly dataSource: DataSource) {
    super(Video, dataSource)
  }
}
