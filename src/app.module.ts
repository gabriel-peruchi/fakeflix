import { IdentityModule } from '@identityModule/identity.module'
import { ContentModule } from '@contentModule/content.module'
import { Module } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo'

@Module({
  imports: [
    ContentModule,
    IdentityModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      autoSchemaFile: true,
      driver: ApolloDriver,
    }),
  ],
})
export class AppModule {}
