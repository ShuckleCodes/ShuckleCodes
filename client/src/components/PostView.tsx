import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import { getPost, deletePost, Post } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './PostView.css';

// Custom sanitization schema that allows YouTube iframes
const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    iframe: ['src', 'width', 'height', 'frameBorder', 'allow', 'allowFullScreen', 'title']
  },
  tagNames: [...(defaultSchema.tagNames || []), 'iframe']
};

/**
 * PostView Component
 * Displays a single blog post with full content rendered as Markdown
 */
function PostView() {
  const { isAuthenticated } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadPost();
  }, [id]);

  async function loadPost() {
    if (!id) return;

    try {
      setLoading(true);
      setError('');
      const data = await getPost(parseInt(id));
      setPost(data);
    } catch (err) {
      setError('Failed to load post');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!post || !window.confirm(`Delete "${post.title}"?`)) {
      return;
    }

    try {
      await deletePost(post.id!);
      navigate('/posts');
    } catch (err) {
      alert('Failed to delete post');
      console.error(err);
    }
  }

  if (loading) {
    return <div className="post-view-container">Loading...</div>;
  }

  if (error || !post) {
    return (
      <div className="post-view-container">
        <p className="error">{error || 'Post not found'}</p>
        <Link to="/posts" className="button">Back to Posts</Link>
      </div>
    );
  }

  // Don't show unpublished posts to non-authenticated users
  if (!isAuthenticated && !post.published) {
    return (
      <div className="post-view-container">
        <p className="error">This post is not available.</p>
        <Link to="/posts" className="button">Back to Posts</Link>
      </div>
    );
  }

  return (
    <div className="post-view-container">
      <div className="post-view-header">
        <Link to="/posts" className="back-link">← Back to Posts</Link>
        {isAuthenticated && (
          <div className="post-actions">
            <Link to={`/posts/${post.id}/edit`} className="button button-secondary">
              Edit
            </Link>
            <button onClick={handleDelete} className="button button-danger">
              Delete
            </button>
          </div>
        )}
      </div>

      <article className="post-view-content">
        <header>
          <h1>{post.title}</h1>
          <div className="post-meta">
            {isAuthenticated && (
              <span className={`badge ${post.published ? 'published' : 'draft'}`}>
                {post.published ? 'Published' : 'Draft'}
              </span>
            )}
            {post.category && <span className="category">{post.category}</span>}
            {post.created_at && (
              <span className="date">
                {new Date(post.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            )}
          </div>
          {post.tags && post.tags.length > 0 && (
            <div className="tags">
              {post.tags.map((tag) => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          )}
        </header>

        <div className="markdown-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
          >
            {post.content}
          </ReactMarkdown>
        </div>
      </article>
    </div>
  );
}

export default PostView;
