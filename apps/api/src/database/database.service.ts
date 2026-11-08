import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { astecSchema } from '@astec/database';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool;
  readonly db: ReturnType<typeof drizzle<typeof astecSchema>>;

  constructor() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is required.');
    }
    this.pool = new Pool({ connectionString: databaseUrl });
    this.db = drizzle({ client: this.pool, schema: astecSchema });
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
