import { Injectable, NotFoundException } from '@nestjs/common'
import { PlanRepository } from '@billingModule/persistence/repository/plan.repository'
import { SubscriptionRepository } from '@billingModule/persistence/repository/subscription.repository'
import { Subscription } from '@billingModule/persistence/entity/subscription.entity'
import { SubscriptionStatus } from '../enum/subscription-status.enum'
import { ClsService } from 'nestjs-cls'

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
  }): Promise<Subscription> {
    const plan = await this.planRepository.findOneById(planId)

    if (!plan) {
      throw new NotFoundException(`Plan with id ${planId} not found`)
    }

    const userId = this.clsService.get('userId')

    const subscription = new Subscription({
      plan,
      userId: userId,
      status: SubscriptionStatus.ACTIVE,
      startDate: new Date(),
      autoRenew: true,
    })

    await this.subscriptionRepository.save(subscription)

    return subscription
  }

  async isUserSubscriptionActive(userId: string): Promise<boolean> {
    const subscription =
      await this.subscriptionRepository.findOneByUserId(userId)
    return subscription?.status === SubscriptionStatus.ACTIVE
  }

  async getSubscriptionByUserId(userId: string): Promise<Subscription | null> {
    return this.subscriptionRepository.findOneByUserId(userId)
  }
}
