import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'
import { DefaultEntity } from '@sharedModules/persistence/typeorm/entity/default.entity'
import { Discount } from '@billingModule/discount/persistence/entity/discount.entity'
import { Subscription } from './subscription.entity'

@Entity({ name: 'BillingSubscriptionDiscount' })
export class SubscriptionDiscount extends DefaultEntity<SubscriptionDiscount> {
  @Column()
  subscriptionId: string

  @Column()
  discountId: string

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  appliedAt: Date

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date | null

  @Column({ type: 'int', nullable: true })
  remainingMonths: number | null

  @ManyToOne(() => Subscription, (subscription) => subscription.discounts)
  @JoinColumn({ name: 'subscriptionId' })
  subscription: Subscription

  @ManyToOne(() => Discount, (discount) => discount.subscriptionDiscounts)
  @JoinColumn({ name: 'discountId' })
  discount: Discount
}
