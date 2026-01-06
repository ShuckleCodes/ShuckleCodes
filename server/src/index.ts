import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { testConnection } from './db.js';
import postsRouter from './routes/posts.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config();

// Create the Express application
const app = express();

// Define the port (use environment variable or default to 5000)
const PORT: number = parseInt(process.env.PORT || '5000', 10);

// --- Middleware ---
// Middleware runs on every request before reaching your routes

// CORS: Allow requests from your React app (different port in development)
app.use(cors());

// Parse JSON request bodies (when frontend sends data)
app.use(express.json());

// Parse URL-encoded bodies (for form submissions)
app.use(express.urlencoded({ extended: true }));

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientBuildPath));
  console.log(`📦 Serving static files from: ${clientBuildPath}`);
}

// --- Routes ---

// Basic test route
app.get('/api', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to ShuckleCodes API!' });
});

// Health check endpoint (useful for monitoring)
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Mount posts routes
app.use('/api/posts', postsRouter);

// Serve React app for any non-API routes (must be AFTER API routes)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}

// --- Start Server ---
app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 API available at http://localhost:${PORT}/api`);

  // Test database connection
  await testConnection();
});
