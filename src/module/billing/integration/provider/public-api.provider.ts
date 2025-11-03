import { Injectable } from '@nestjs/common'
import { SubscriptionStatus } from '@billingModule/core/model/subscription.model'
import { SubscriptionService } from '@billingModule/core/service/subscription.service'
import { BillingSubscriptionStatusApi } from '@sharedModules/integration/interface/billing-integration.interface'

@Injectable()
export class BillingPublicApiProvider implements BillingSubscriptionStatusApi {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  public async isUserSubscriptionActive(userId: string): Promise<boolean> {
    const subscription =
      await this.subscriptionService.getSubscriptionByUserId(userId)

    return subscription?.status === SubscriptionStatus.Active ? true : false
  }
}
