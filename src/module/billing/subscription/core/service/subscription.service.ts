import { Injectable, NotFoundException } from '@nestjs/common'
import { PlanRepository } from '@billingModule/subscription/persistence/repository/plan.repository'
import { SubscriptionRepository } from '@billingModule/subscription/persistence/repository/subscription.repository'
import { SubscriptionStatus } from '../enum/subscription-status.enum'
import { ClsService } from 'nestjs-cls'
import { SubscriptionEntity } from '@billingModule/subscription/persistence/entity/subscription.entity'

@Injectable()
export class SubscriptionService {
  constructor(
    private clsService: ClsService,
    private readonly planRepository: PlanRepository,
    private readonly subscriptionRepository: SubscriptionRepository,
  ) {}

  async createSubscription({
    planId,
  }: {
    planId: string
  }): Promise<SubscriptionEntity> {
    const plan = await this.planRepository.findOneById(planId)

    if (!plan) {
      throw new NotFoundException(`Plan with id ${planId} not found`)
    }

    const userId = this.clsService.get('userId')

    const subscription = new SubscriptionEntity({
      plan,
      userId: userId,
      status: SubscriptionStatus.Active,
      startDate: new Date(),
      autoRenew: true,
    })

    await this.subscriptionRepository.save(subscription)

    return subscription
  }

  async isUserSubscriptionActive(userId: string): Promise<boolean> {
    const subscription =
      await this.subscriptionRepository.findOneByUserId(userId)
    return subscription?.status === SubscriptionStatus.Active
  }

  async getSubscriptionByUserId(
    userId: string,
  ): Promise<SubscriptionEntity | null> {
    return this.subscriptionRepository.findOneByUserId(userId)
  }
}
