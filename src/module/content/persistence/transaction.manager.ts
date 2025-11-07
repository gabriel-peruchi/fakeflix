import { ContentRepository } from '@contentModule/persistence/repository/content.repository'
import { EpisodeRepository } from '@contentModule/persistence/repository/episode.repository'
import { Inject, Injectable, Scope } from '@nestjs/common'
import { DataSource } from 'typeorm'

@Injectable({
  scope: Scope.TRANSIENT,
})
export class TransactionManager {
  transactionalContentRepository: ContentRepository
  transactionalEpisodeRepository: EpisodeRepository

  constructor(@Inject(DataSource) readonly dataSource: DataSource) {}

  async withTransaction<T>(work: () => Promise<T>): Promise<T> {
    // Start a transaction
    return this.dataSource.transaction(async (transactionManager) => {
      // Re-init repositories with the transaction-aware manager.
      this.transactionalContentRepository = new ContentRepository(
        transactionManager,
      )
      this.transactionalEpisodeRepository = new EpisodeRepository(
        transactionManager,
      )

      // Execute the work. If this throws, the transaction is rolled back.
      return work()
    })
  }
}
