import { dataSourceOptionsFactory } from '@billingModule/persistence/typeorm-datasource.factory'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { ConfigModule } from '@sharedModules/config/config.module'
import { config } from 'dotenv'
import { DataSource } from 'typeorm'
config()

const getDataSource = async () => {
  const configModule = await NestFactory.createApplicationContext(
    ConfigModule.forRoot(),
  )
  const configService = configModule.get<ConfigService>(ConfigService)
  return new DataSource(dataSourceOptionsFactory(configService))
}

export default getDataSource()
