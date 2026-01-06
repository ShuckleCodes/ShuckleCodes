import pool from './db.js';

/**
 * Initialize the database schema
 * This creates all the tables needed for your blog/content site
 */
export async function initDatabase() {
  const client = await pool.connect();

  try {
    console.log('🔨 Creating database tables...');

    // Create posts table
    // This will store your blog posts, tutorials, reviews, etc.
    await client.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        content TEXT NOT NULL,
        excerpt TEXT,
        category VARCHAR(100),
        tags TEXT[],
        published BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create index on slug for fast lookups by URL
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug)
    `);

    // Create index on published for filtering
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(published)
    `);

    console.log('✅ Database tables created successfully');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the initialization
initDatabase()
  .then(() => {
    console.log('✅ Database initialization complete');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Database initialization failed:', err);
    process.exit(1);
  });
