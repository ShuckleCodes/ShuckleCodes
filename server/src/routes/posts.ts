import { Router, Request, Response } from 'express';
import pool from '../db.js';

const router = Router();

// TypeScript interfaces for type safety
interface Post {
  id?: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  category?: string;
  tags?: string[];
  published?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * GET /api/posts
 * Get all posts (optionally filter by published status)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { published } = req.query;

    let query = 'SELECT * FROM posts';
    const params: any[] = [];

    // Filter by published status if provided
    if (published !== undefined) {
      query += ' WHERE published = $1';
      params.push(published === 'true');
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

/**
 * GET /api/posts/tags
 * Get all unique tags across all posts
 */
router.get('/tags', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT unnest(tags) as tag
      FROM posts
      WHERE tags IS NOT NULL AND array_length(tags, 1) > 0
      ORDER BY tag ASC
    `);

    const tags = result.rows.map(row => row.tag);
    res.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

/**
 * GET /api/posts/:id
 * Get a single post by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query('SELECT * FROM posts WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

/**
 * POST /api/posts
 * Create a new post
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, slug, content, excerpt, category, tags, published }: Post = req.body;

    // Validate required fields
    if (!title || !slug || !content) {
      return res.status(400).json({ error: 'Title, slug, and content are required' });
    }

    const result = await pool.query(
      `INSERT INTO posts (title, slug, content, excerpt, category, tags, published)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [title, slug, content, excerpt, category, tags, published || false]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating post:', error);

    // Handle duplicate slug error
    if (error.code === '23505') {
      return res.status(409).json({ error: 'A post with this slug already exists' });
    }

    res.status(500).json({ error: 'Failed to create post' });
  }
});

/**
 * PUT /api/posts/:id
 * Update an existing post
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, slug, content, excerpt, category, tags, published }: Post = req.body;

    const result = await pool.query(
      `UPDATE posts
       SET title = COALESCE($1, title),
           slug = COALESCE($2, slug),
           content = COALESCE($3, content),
           excerpt = COALESCE($4, excerpt),
           category = COALESCE($5, category),
           tags = COALESCE($6, tags),
           published = COALESCE($7, published),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [title, slug, content, excerpt, category, tags, published, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating post:', error);

    // Handle duplicate slug error
    if (error.code === '23505') {
      return res.status(409).json({ error: 'A post with this slug already exists' });
    }

    res.status(500).json({ error: 'Failed to update post' });
  }
});

/**
 * DELETE /api/posts/:id
 * Delete a post
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM posts WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({ message: 'Post deleted successfully', post: result.rows[0] });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

export default router;
