import { DataSource } from 'typeorm';
import { Global, InternalServerErrorException, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CustomLogger } from '../shared/services/custom-logger.service';
import { DbConnectivity } from '../common/enums/logging-tag.enum';
import { createDataSource } from '../config/database.config';

@Global()
@Module({
  imports: [],
  providers: [
    CustomLogger,
    {
      provide: DataSource,
      inject: [ConfigService, CustomLogger],
      useFactory: async (
        configService: ConfigService,
        logger: CustomLogger,
      ) => {
        try {
          const dataSource = createDataSource(configService);
          await dataSource.initialize();

          logger.log(
            DbConnectivity.DB_CONNECTIVITY,
            'Database connected successfully',
            {
              db_status: dataSource.isInitialized,
              context: 'DatabaseModule',
            },
          );

          return dataSource;
        } catch (error) {
          logger.error(
            DbConnectivity.DB_CONNECTIVITY,
            'Error connecting to database',
            error,
          );
          throw new InternalServerErrorException(
            'Error connecting to database',
          );
        }
      },
    },
  ],
  exports: [DataSource, CustomLogger],
})
export class DatabaseModule {}
