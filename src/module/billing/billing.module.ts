import { Module } from '@nestjs/common'
import { SubscriptionService } from '@billingModule/core/service/subscription.service'
import { SubscriptionController } from '@billingModule/http/rest/controller/subscription.controller'
import { PersistenceModule } from '@billingModule/persistence/persistence.module'
import { BillingPublicApiProvider } from './integration/provider/public-api.provider'
import { AuthModule } from '@sharedModules/auth/auth.module'

@Module({
  imports: [PersistenceModule, AuthModule],
  providers: [SubscriptionService, BillingPublicApiProvider],
  controllers: [SubscriptionController],
  exports: [BillingPublicApiProvider],
})
export class BillingModule {}
