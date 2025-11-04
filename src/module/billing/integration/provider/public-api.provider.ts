import { Injectable } from '@nestjs/common'
import { SubscriptionService } from '@billingModule/core/service/subscription.service'
import { BillingSubscriptionStatusApi } from '@sharedModules/integration/interface/billing-integration.interface'

@Injectable()
export class BillingPublicApiProvider implements BillingSubscriptionStatusApi {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  public async isUserSubscriptionActive(userId: string): Promise<boolean> {
    return this.subscriptionService.isUserSubscriptionActive(userId)
  }
}
