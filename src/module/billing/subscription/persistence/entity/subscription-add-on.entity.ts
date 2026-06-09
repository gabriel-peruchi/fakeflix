import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'
import { DefaultEntity } from '@sharedModules/persistence/typeorm/entity/default.entity'
import { AddOn } from '@billingModule/subscription/persistence/entity/add-on.entity'
import { SubscriptionEntity } from './subscription.entity'

@Entity({ name: 'BillingSubscriptionAddOn' })
export class SubscriptionAddOnEntity extends DefaultEntity<SubscriptionAddOnEntity> {
  @Column()
  subscriptionId: string

  @Column()
  addOnId: string

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  startDate: Date

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date | null

  @Column({ default: 1 })
  quantity: number

  @ManyToOne(() => SubscriptionEntity, (subscription) => subscription.addOns)
  @JoinColumn({ name: 'subscriptionId' })
  subscription: SubscriptionEntity

  @ManyToOne(() => AddOn, (addOn) => addOn.subscriptionAddOns)
  @JoinColumn({ name: 'addOnId' })
  addOn: AddOn
}
