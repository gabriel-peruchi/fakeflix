import { Module } from '@nestjs/common'
import { SubscriptionService } from '@billingModule/core/service/subscription.service'
import { SubscriptionController } from '@billingModule/http/rest/controller/subscription.controller'
import { PersistenceModule } from '@billingModule/persistence/persistence.module'
import { BillingPublicApiProvider } from './integration/provider/public-api.provider'

@Module({
  imports: [PersistenceModule],
  providers: [SubscriptionService, BillingPublicApiProvider],
  controllers: [SubscriptionController],
  exports: [BillingPublicApiProvider],
})
export class BillingModule {}
