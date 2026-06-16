import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { createRedisConfig } from '../../config/redis.config';
import { RedisService } from './redis.service';
import { REDIS_CLIENT } from './redis.constants';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService) => {
        const redisConfig = createRedisConfig(configService);
        const client = new Redis(redisConfig);

        client.on('connect', () => {
          console.log('[RedisModule] Connected to Redis');
        });

        client.on('error', (error) => {
          console.error('[RedisModule] Redis connection error:', error);
        });

        return client;
      },
      inject: [ConfigService],
    },
    RedisService,
  ],
  exports: [REDIS_CLIENT, RedisService],
})
export class RedisModule {}
