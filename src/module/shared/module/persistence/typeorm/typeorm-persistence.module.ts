import { DynamicModule, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DefaultEntity } from './entity/default.entity'
import { TypeOrmMigrationService } from './service/typeorm-migration.service'
import { ConfigService } from '@sharedModules/config/service/config.service'
import { ConfigModule } from '@sharedModules/config/config.module'

@Module({})
export class TypeOrmPersistenceModule {
  static forRoot(options: {
    migrations?: string[]
    entities?: Array<typeof DefaultEntity>
  }): DynamicModule {
    return {
      module: TypeOrmPersistenceModule,
      imports: [
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule.forRoot()],
          inject: [ConfigService],
          useFactory: async (configService) => {
            return {
              type: 'postgres',
              logging: false,
              autoLoadEntities: false,
              synchronize: false,
              migrationsTableName: 'typeorm_migrations',
              // types are inferred by the compiler and zod
              ...configService.get('database'),
              ...options,
            }
          },
        }),
      ],
      providers: [TypeOrmMigrationService],
      exports: [TypeOrmMigrationService],
    }
  }
}
