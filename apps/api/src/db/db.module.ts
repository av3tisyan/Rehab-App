import { Global, Module, type OnModuleDestroy, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { createDb, type Database } from './client';

export const DB = Symbol('DB');
export const DB_POOL = Symbol('DB_POOL');

/**
 * Global module exposing the Drizzle `Database` (inject with `@Inject(DB)`).
 * Closes the pool on shutdown.
 */
@Global()
@Module({
  providers: [
    {
      provide: DB_POOL,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.getOrThrow<string>('DATABASE_URL');
        return createDb(url);
      },
    },
    {
      provide: DB,
      inject: [DB_POOL],
      useFactory: (created: { pool: Pool; db: Database }) => created.db,
    },
  ],
  exports: [DB],
})
export class DbModule implements OnModuleDestroy {
  constructor(@Inject(DB_POOL) private readonly created: { pool: Pool; db: Database }) {}

  async onModuleDestroy(): Promise<void> {
    await this.created.pool.end();
  }
}
