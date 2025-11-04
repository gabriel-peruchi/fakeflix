import { UserSubscriptionActiveResponseDto } from './../dto/response/user-subscription-active-response.dto'
import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Post,
} from '@nestjs/common'
import { NotFoundDomainException } from '@sharedLibs/core/exception/not-found-domain.exception'
import { SubscriptionService } from '@billingModule/core/service/subscription.service'
import { CreateSubscriptionRequestDto } from '@billingModule/http/rest/dto/request/create-subscription.dto'
import { plainToInstance } from 'class-transformer'
import { SubscriptionResponseDto } from '../dto/response/subscription-response.dto'

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post()
  async createSubscription(
    @Body() createSubscriptionRequest: CreateSubscriptionRequestDto,
  ): Promise<SubscriptionResponseDto> {
    try {
      const createdSubscription =
        await this.subscriptionService.createSubscription(
          createSubscriptionRequest,
        )

      //TODO validate
      return plainToInstance(
        SubscriptionResponseDto,
        { ...createdSubscription, ...{ plan: createdSubscription.Plan } },
        { excludeExtraneousValues: true },
      )
    } catch (error: any) {
      if (error instanceof NotFoundDomainException) {
        throw new NotFoundException(error.message)
      }

      console.error('Error creating subscription', error)
      throw new InternalServerErrorException()
    }
  }

  @Get('/user/:userId/active')
  async isUserSubscriptionActive(
    userId: string,
  ): Promise<UserSubscriptionActiveResponseDto> {
    const isActive =
      await this.subscriptionService.isUserSubscriptionActive(userId)

    return plainToInstance(
      UserSubscriptionActiveResponseDto,
      { isActive },
      { excludeExtraneousValues: true },
    )
  }
}
