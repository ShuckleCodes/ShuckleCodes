// Base URL for your API
// In development: http://localhost:5000/api
// In production: /api (same domain)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// TypeScript interface matching your backend Post type
export interface Post {
  id?: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  category?: string;
  tags?: string[];
  published?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Get all posts
 * @param published - Optional filter for published/draft posts
 */
export async function getPosts(published?: boolean): Promise<Post[]> {
  const url = published !== undefined
    ? `${API_URL}/posts?published=${published}`
    : `${API_URL}/posts`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch posts');
  }

  return response.json();
}

/**
 * Get a single post by ID
 */
export async function getPost(id: number): Promise<Post> {
  const response = await fetch(`${API_URL}/posts/${id}`);

  if (!response.ok) {
    throw new Error('Failed to fetch post');
  }

  return response.json();
}

/**
 * Create a new post
 */
export async function createPost(post: Post): Promise<Post> {
  const response = await fetch(`${API_URL}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(post),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create post');
  }

  return response.json();
}

/**
 * Update an existing post
 */
export async function updatePost(id: number, post: Partial<Post>): Promise<Post> {
  const response = await fetch(`${API_URL}/posts/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(post),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update post');
  }

  return response.json();
}

/**
 * Delete a post
 */
export async function deletePost(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/posts/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete post');
  }
}
