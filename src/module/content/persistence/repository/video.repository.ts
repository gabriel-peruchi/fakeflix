import { Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { DefaultTypeOrmRepository } from '@sharedModules/persistence/typeorm/repository/default-typeorm.repository'
import { Video } from '../entity/video.entity'
import { InjectDataSource } from '@nestjs/typeorm'

@Injectable()
export class VideoRepository extends DefaultTypeOrmRepository<Video> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(Video, dataSource.manager)
  }
}
