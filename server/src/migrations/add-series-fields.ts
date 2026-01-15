import pool from '../db.js';

/**
 * Migration: Add series and series_order columns to posts table
 * Safe to run multiple times - uses IF NOT EXISTS
 */
async function migrate() {
  const client = await pool.connect();

  try {
    console.log('🔄 Running migration: add-series-fields...');

    // Add series column if it doesn't exist
    await client.query(`
      ALTER TABLE posts
      ADD COLUMN IF NOT EXISTS series VARCHAR(255)
    `);
    console.log('✅ Added series column');

    // Add series_order column if it doesn't exist
    await client.query(`
      ALTER TABLE posts
      ADD COLUMN IF NOT EXISTS series_order NUMERIC(10,2)
    `);
    console.log('✅ Added series_order column');

    // Create index on series for fast filtering (if not exists)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_posts_series ON posts(series) WHERE series IS NOT NULL
    `);
    console.log('✅ Created series index');

    console.log('✅ Migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
