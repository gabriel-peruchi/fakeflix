import { DefaultTypeOrmRepository } from '@sharedModules/persistence/typeorm/repository/default-typeorm.repository'
import { Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { Movie } from '../entity/movie.entity'
import { InjectDataSource } from '@nestjs/typeorm'

@Injectable()
export class MovieRepository extends DefaultTypeOrmRepository<Movie> {
  constructor(@InjectDataSource('content') dataSource: DataSource) {
    super(Movie, dataSource.manager)
  }
}
