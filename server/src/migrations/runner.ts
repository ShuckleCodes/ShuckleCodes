import pool from '../db.js';

/**
 * Migration runner - automatically runs pending migrations on server startup
 * Tracks completed migrations in a database table to avoid re-running
 */

interface Migration {
  name: string;
  up: () => Promise<void>;
}

// Define all migrations in order
const migrations: Migration[] = [
  {
    name: '001_add_series_fields',
    up: async () => {
      const client = await pool.connect();
      try {
        // Add series column
        await client.query(`
          ALTER TABLE posts
          ADD COLUMN IF NOT EXISTS series VARCHAR(255)
        `);

        // Add series_order column
        await client.query(`
          ALTER TABLE posts
          ADD COLUMN IF NOT EXISTS series_order NUMERIC(10,2)
        `);

        // Create index on series
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_posts_series ON posts(series) WHERE series IS NOT NULL
        `);
      } finally {
        client.release();
      }
    },
  },
  // Add future migrations here:
  // {
  //   name: '002_next_migration',
  //   up: async () => { ... },
  // },
];

/**
 * Ensure the migrations tracking table exists
 */
async function ensureMigrationsTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

/**
 * Get list of already-executed migration names
 */
async function getExecutedMigrations(): Promise<Set<string>> {
  const result = await pool.query('SELECT name FROM _migrations');
  return new Set(result.rows.map(row => row.name));
}

/**
 * Mark a migration as executed
 */
async function markMigrationExecuted(name: string): Promise<void> {
  await pool.query('INSERT INTO _migrations (name) VALUES ($1)', [name]);
}

/**
 * Run all pending migrations
 * Safe to call on every server startup
 */
export async function runMigrations(): Promise<void> {
  try {
    // Ensure tracking table exists
    await ensureMigrationsTable();

    // Get already-executed migrations
    const executed = await getExecutedMigrations();

    // Find pending migrations
    const pending = migrations.filter(m => !executed.has(m.name));

    if (pending.length === 0) {
      console.log('✅ Database schema is up to date');
      return;
    }

    console.log(`🔄 Running ${pending.length} pending migration(s)...`);

    // Run each pending migration in order
    for (const migration of pending) {
      console.log(`   Running: ${migration.name}`);
      await migration.up();
      await markMigrationExecuted(migration.name);
      console.log(`   ✅ ${migration.name} complete`);
    }

    console.log('✅ All migrations complete');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}
