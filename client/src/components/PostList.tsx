import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import { getPosts, deletePost, Post } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './PostList.css';

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
 * PostList Component
 * Displays a list of all blog posts with options to view, edit, or delete
 */
function PostList() {
  const { isAuthenticated } = useAuth();

  // State: stores the list of posts
  const [posts, setPosts] = useState<Post[]>([]);

  // State: tracks loading status
  const [loading, setLoading] = useState(true);

  // State: stores error messages
  const [error, setError] = useState<string>('');

  // State: for selected tag filter
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

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

  // Get all unique tags from all posts
  const allTags = Array.from(
    new Set(posts.flatMap(post => post.tags || []))
  ).sort();

  // Filter posts by selected tag
  const filteredPosts = selectedTag
    ? posts.filter(post => post.tags?.includes(selectedTag))
    : posts;

  // Sort posts by created_at (latest first)
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    const dateA = new Date(a.created_at || 0).getTime();
    const dateB = new Date(b.created_at || 0).getTime();
    return dateB - dateA; // Descending order (latest first)
  });

  // Split into featured (top 3) and older posts
  const featuredPosts = sortedPosts.slice(0, 3);
  const olderPosts = sortedPosts.slice(3);

  // Render the posts list
  return (
    <div className="post-list-container">
      <div className="header">
        <h1>Latest Content</h1>
        {isAuthenticated && (
          <Link to="/posts/new" className="button button-primary">
            + New
          </Link>
        )}
      </div>

      <div className={`content-layout ${allTags.length > 0 ? 'has-sidebar' : 'no-sidebar'}`}>
        {/* Tag Filter Sidebar */}
        {allTags.length > 0 && (
          <aside className="tag-filter-sidebar">
            <h3>Filter by Tag</h3>
            <button
              className={`tag-filter-button ${!selectedTag ? 'active' : ''}`}
              onClick={() => setSelectedTag(null)}
            >
              All ({posts.length})
            </button>
            {allTags.map((tag) => {
              const count = posts.filter(p => p.tags?.includes(tag)).length;
              return (
                <button
                  key={tag}
                  className={`tag-filter-button ${selectedTag === tag ? 'active' : ''}`}
                  onClick={() => setSelectedTag(tag)}
                >
                  {tag} ({count})
                </button>
              );
            })}
          </aside>
        )}

        {/* Posts Section */}
        <div className="posts-section">
          {sortedPosts.length === 0 ? (
            <p className="empty-state">
              {selectedTag
                ? `No posts tagged with "${selectedTag}"`
                : 'No posts yet. Create your first post!'}
            </p>
          ) : (
            <>
              {/* Featured Posts - Full Content */}
              {featuredPosts.length > 0 && (
                <div className="featured-posts">
                  {featuredPosts.map((post) => (
                    <article key={post.id} className="featured-post">
                      <div className="featured-post-header">
                        <div className="featured-post-title">
                          <h2>{post.title}</h2>
                          <div className="featured-post-meta">
                            <span className={`badge ${post.published ? 'published' : 'draft'}`}>
                              {post.published ? 'Published' : 'Draft'}
                            </span>
                            {post.category && <span>• {post.category}</span>}
                            {post.created_at && (
                              <span>
                                • {new Date(post.created_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                            )}
                          </div>
                          {post.tags && post.tags.length > 0 && (
                            <div className="tags" style={{ marginTop: '0.5rem' }}>
                              {post.tags.map((tag) => (
                                <span key={tag} className="tag">{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="featured-post-content">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
                        >
                          {post.content}
                        </ReactMarkdown>
                      </div>
                      {isAuthenticated && (
                        <div className="featured-post-actions">
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
                      )}
                    </article>
                  ))}
                </div>
              )}

              {/* Older Posts - Card View */}
              {olderPosts.length > 0 && (
                <div className="older-posts-section">
                  <h3>More Posts</h3>
                  <div className="posts-grid">
                    {olderPosts.map((post) => (
            <div key={post.id} className="post-card">
              <div className="post-header">
                <Link to={`/posts/${post.id}`} className="post-title-link">
                  <h2>{post.title}</h2>
                </Link>
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

              {isAuthenticated && (
                <div className="post-actions">
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
              )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default PostList;
