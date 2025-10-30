import { Module } from '@nestjs/common'
import { SubscriptionService } from '@billingModule/core/service/subscription.service'
import { SubscriptionController } from '@billingModule/http/rest/controller/subscription.controller'
import { PersistenceModule } from '@billingModule/persistence/persistence.module'

@Module({
  imports: [PersistenceModule],
  providers: [SubscriptionService],
  controllers: [SubscriptionController],
  exports: [],
})
export class BillingModule {}
