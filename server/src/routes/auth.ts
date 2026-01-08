import { Router, Request, Response } from 'express';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

/**
 * POST /api/auth/login
 * Simple authentication endpoint
 * For now, uses environment variables for credentials
 */
router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  // Get admin credentials from environment variables
  const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme';

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    // Authentication successful
    res.json({
      success: true,
      user: { username },
      token: 'authenticated' // Simple token for now
    });
  } else {
    // Authentication failed
    res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout endpoint (client-side will clear token)
 */
router.post('/logout', (req: Request, res: Response) => {
  res.json({ success: true });
});

export default router;
