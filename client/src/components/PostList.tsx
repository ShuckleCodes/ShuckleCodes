import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPosts, deletePost, Post } from '../services/api';
import './PostList.css';

/**
 * PostList Component
 * Displays a list of all blog posts with options to view, edit, or delete
 */
function PostList() {
  // State: stores the list of posts
  const [posts, setPosts] = useState<Post[]>([]);

  // State: tracks loading status
  const [loading, setLoading] = useState(true);

  // State: stores error messages
  const [error, setError] = useState<string>('');

  // useEffect: runs when component mounts (loads)
  // The empty array [] means "run once on mount"
  useEffect(() => {
    loadPosts();
  }, []);

  // Function to fetch posts from the API
  async function loadPosts() {
    try {
      setLoading(true);
      setError('');

      // Call our API service
      const data = await getPosts();

      // Update state with the fetched posts
      setPosts(data);
    } catch (err) {
      setError('Failed to load posts. Is the server running?');
      console.error(err);
    } finally {
      // Always runs, even if there's an error
      setLoading(false);
    }
  }

  // Function to delete a post
  async function handleDelete(id: number, title: string) {
    // Confirm before deleting
    if (!window.confirm(`Delete "${title}"?`)) {
      return;
    }

    try {
      await deletePost(id);

      // Reload the list after successful delete
      await loadPosts();
    } catch (err) {
      alert('Failed to delete post');
      console.error(err);
    }
  }

  // Render loading state
  if (loading) {
    return <div className="post-list-container">Loading...</div>;
  }

  // Render error state
  if (error) {
    return (
      <div className="post-list-container">
        <p className="error">{error}</p>
        <button onClick={loadPosts}>Retry</button>
      </div>
    );
  }

  // Render the posts list
  return (
    <div className="post-list-container">
      <div className="header">
        <h1>Blog Posts</h1>
        <Link to="/posts/new" className="button button-primary">
          + New Post
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="empty-state">
          No posts yet. Create your first post!
        </p>
      ) : (
        <div className="posts-grid">
          {posts.map((post) => (
            <div key={post.id} className="post-card">
              <div className="post-header">
                <h2>{post.title}</h2>
                <span className={`badge ${post.published ? 'published' : 'draft'}`}>
                  {post.published ? 'Published' : 'Draft'}
                </span>
              </div>

              {post.excerpt && <p className="excerpt">{post.excerpt}</p>}

              <div className="post-meta">
                {post.category && <span className="category">{post.category}</span>}
                {post.tags && post.tags.length > 0 && (
                  <div className="tags">
                    {post.tags.map((tag) => (
                      <span key={tag} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="post-actions">
                <Link to={`/posts/${post.id}`} className="button button-secondary">
                  View
                </Link>
                <Link to={`/posts/${post.id}/edit`} className="button button-secondary">
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(post.id!, post.title)}
                  className="button button-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PostList;
