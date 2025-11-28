import { Module } from '@nestjs/common'
import { UserManagementService } from './core/service/user-management.service'
import { AuthResolver } from './http/graphql/auth.resolver'
import { UserResolver } from './http/graphql/user.resolver'
import { UserRepository } from './persistence/repository/user.repository'
import { AuthService } from '@identityModule/core/service/authentication.service'
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo'
import { GraphQLModule } from '@nestjs/graphql'
import { BillingModule } from '@billingModule/billing.module'
import { BillingSubscriptionStatusApi } from '@sharedModules/integration/interface/billing-integration.interface'
import { BillingPublicApiProvider } from '@billingModule/integration/provider/public-api.provider'
import { IdentityPersistenceModule } from './persistence/identity-persistence.module'
import { AuthModule } from '@sharedModules/auth/auth.module'

@Module({
  imports: [
    IdentityPersistenceModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      autoSchemaFile: true,
      driver: ApolloDriver,
    }),
    BillingModule,
    AuthModule,
  ],
  providers: [
    {
      provide: BillingSubscriptionStatusApi,
      useExisting: BillingPublicApiProvider,
    },
    AuthService,
    AuthResolver,
    UserResolver,
    UserManagementService,
    UserRepository,
  ],
})
export class IdentityModule {}
