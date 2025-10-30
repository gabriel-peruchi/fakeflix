import { IdentityModule } from '@identityModule/identity.module'
import { ContentModule } from '@contentModule/content.module'
import { Module } from '@nestjs/common'

@Module({
  imports: [ContentModule, IdentityModule],
})
export class AppModule {}
