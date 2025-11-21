import { Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { Content } from '../entity/content.entity'
import { DefaultTypeOrmRepository } from '@sharedModules/persistence/typeorm/repository/default-typeorm.repository'
import { MovieContentModel } from '@contentModule/core/model/movie-content.model'
import { TvShowContentModel } from '@contentModule/core/model/tv-show-content.model'
import { InjectDataSource } from '@nestjs/typeorm'

// TODO: It is recommended to implement two different repositories, MovieContentRepository and TvShowContentRepository.
@Injectable()
export class ContentRepository extends DefaultTypeOrmRepository<Content> {
  constructor(@InjectDataSource('content') dataSource: DataSource) {
    super(Content, dataSource.manager)
  }

  async save(): Promise<Content> {
    throw new Error('Method not implemented.')
  }

  async saveMovie(entity: MovieContentModel): Promise<MovieContentModel> {
    const content = new Content({
      id: entity.id,
      title: entity.title,
      description: entity.description,
      type: entity.type,
      movie: entity.movie,
    })
    await super.save(content)

    return new MovieContentModel({
      id: content.id,
      title: content.title,
      description: content.description,
      ageRecommendation: content.ageRecommendation,
      movie: content.movie!,
      createdAt: content.createdAt,
      updatedAt: content.updatedAt,
      deletedAt: content.deletedAt,
    })
  }

  async saveTvShow(entity: TvShowContentModel): Promise<TvShowContentModel> {
    const content = new Content({
      id: entity.id,
      title: entity.title,
      description: entity.description,
      type: entity.type,
      ageRecommendation: entity.ageRecommendation,
      tvShow: entity.tvShow,
    })
    await super.save(content)

    return new TvShowContentModel({
      id: content.id,
      title: content.title,
      description: content.description,
      tvShow: content.tvShow!,
      createdAt: content.createdAt,
      updatedAt: content.updatedAt,
      deletedAt: content.deletedAt,
    })
  }

  async findTvShowContentById(
    id: string,
    relations: string[],
  ): Promise<TvShowContentModel | null> {
    const content = await super.findOneById(id, relations)

    //Ensure the content is the type tvShow
    if (!content || !content.tvShow) {
      return null
    }

    return new TvShowContentModel({
      id: content.id,
      title: content.title,
      description: content.description,
      createdAt: content.createdAt,
      updatedAt: content.updatedAt,
      deletedAt: content.deletedAt,
      tvShow: content.tvShow,
    })
  }
}
