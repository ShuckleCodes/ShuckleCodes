import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Destructure Pool from pg
const { Pool } = pg;

// Create a connection pool
// A pool maintains multiple database connections that can be reused
// This is much more efficient than creating a new connection for each query
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // Optional: connection pool settings
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection can't be established
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

// Test the connection
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL connected successfully');
    client.release(); // Always release the client back to the pool
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL connection error:', error);
    return false;
  }
}

// Export the pool for use in other modules
export default pool;
