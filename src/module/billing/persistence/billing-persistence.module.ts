import { PlanRepository } from '@billingModule/persistence/repository/plan.repository'
import { SubscriptionRepository } from '@billingModule/persistence/repository/subscription.repository'
import { dataSourceOptionsFactory } from '@billingModule/persistence/typeorm-datasource.factory'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@sharedModules/config/config.module'
import { ConfigService } from '@sharedModules/config/service/config.service'
import { TypeOrmPersistenceModule } from '@sharedModules/persistence/typeorm/typeorm-persistence.module'

@Module({
  imports: [
    TypeOrmPersistenceModule.forRoot({
      imports: [ConfigModule.forRoot()],
      name: 'billing',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return dataSourceOptionsFactory(configService)
      },
    }),
  ],
  providers: [PlanRepository, SubscriptionRepository],
  exports: [PlanRepository, SubscriptionRepository],
})
export class BillingPersistenceModule {}
