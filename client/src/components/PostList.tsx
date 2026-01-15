import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import { getPosts, deletePost, Post } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './PostList.css';

// Tree data structures
interface DateTreeYear {
  year: number;
  months: DateTreeMonth[];
}

interface DateTreeMonth {
  month: number;
  monthName: string;
  posts: Post[];
}

interface SeriesGroup {
  name: string;
  posts: Post[];
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

// Helper to build date tree from posts
function buildDateTree(posts: Post[]): DateTreeYear[] {
  const yearMap = new Map<number, Map<number, Post[]>>();

  posts.forEach(post => {
    const date = new Date(post.created_at || 0);
    const year = date.getFullYear();
    const month = date.getMonth();

    if (!yearMap.has(year)) {
      yearMap.set(year, new Map());
    }
    const monthMap = yearMap.get(year)!;
    if (!monthMap.has(month)) {
      monthMap.set(month, []);
    }
    monthMap.get(month)!.push(post);
  });

  const result: DateTreeYear[] = [];
  yearMap.forEach((monthMap, year) => {
    const months: DateTreeMonth[] = [];
    monthMap.forEach((monthPosts, month) => {
      months.push({
        month,
        monthName: MONTH_NAMES[month],
        posts: monthPosts.sort((a, b) =>
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        )
      });
    });
    months.sort((a, b) => b.month - a.month);
    result.push({ year, months });
  });

  return result.sort((a, b) => b.year - a.year);
}

// Helper to build series groups from posts
function buildSeriesGroups(posts: Post[]): SeriesGroup[] {
  const seriesMap = new Map<string, Post[]>();

  posts.forEach(post => {
    if (post.series) {
      if (!seriesMap.has(post.series)) {
        seriesMap.set(post.series, []);
      }
      seriesMap.get(post.series)!.push(post);
    }
  });

  const result: SeriesGroup[] = [];
  seriesMap.forEach((seriesPosts, name) => {
    result.push({
      name,
      posts: seriesPosts.sort((a, b) => (a.series_order || 0) - (b.series_order || 0))
    });
  });

  return result.sort((a, b) => a.name.localeCompare(b.name));
}

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

  // Tree expansion state with localStorage persistence
  const [expandedYears, setExpandedYears] = useState<Set<number>>(() => {
    const saved = localStorage.getItem('treeExpandedYears');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('treeExpandedMonths');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const [expandedSeries, setExpandedSeries] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('treeExpandedSeries');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const [seriesSectionExpanded, setSeriesSectionExpanded] = useState(() => {
    const saved = localStorage.getItem('treeSeriesSectionExpanded');
    return saved ? JSON.parse(saved) : true;
  });

  const [dateSectionExpanded, setDateSectionExpanded] = useState(() => {
    const saved = localStorage.getItem('treeDateSectionExpanded');
    return saved ? JSON.parse(saved) : true;
  });

  // useEffect: runs when component mounts (loads) or auth state changes
  useEffect(() => {
    loadPosts();
  }, [isAuthenticated]);

  // Persist tree expansion state to localStorage
  useEffect(() => {
    localStorage.setItem('treeExpandedYears', JSON.stringify([...expandedYears]));
  }, [expandedYears]);

  useEffect(() => {
    localStorage.setItem('treeExpandedMonths', JSON.stringify([...expandedMonths]));
  }, [expandedMonths]);

  useEffect(() => {
    localStorage.setItem('treeExpandedSeries', JSON.stringify([...expandedSeries]));
  }, [expandedSeries]);

  useEffect(() => {
    localStorage.setItem('treeSeriesSectionExpanded', JSON.stringify(seriesSectionExpanded));
  }, [seriesSectionExpanded]);

  useEffect(() => {
    localStorage.setItem('treeDateSectionExpanded', JSON.stringify(dateSectionExpanded));
  }, [dateSectionExpanded]);

  // Toggle functions for tree nodes
  function toggleYear(year: number) {
    setExpandedYears(prev => {
      const next = new Set(prev);
      if (next.has(year)) {
        next.delete(year);
      } else {
        next.add(year);
      }
      return next;
    });
  }

  function toggleMonth(yearMonth: string) {
    setExpandedMonths(prev => {
      const next = new Set(prev);
      if (next.has(yearMonth)) {
        next.delete(yearMonth);
      } else {
        next.add(yearMonth);
      }
      return next;
    });
  }

  function toggleSeries(seriesName: string) {
    setExpandedSeries(prev => {
      const next = new Set(prev);
      if (next.has(seriesName)) {
        next.delete(seriesName);
      } else {
        next.add(seriesName);
      }
      return next;
    });
  }

  // Function to fetch posts from the API
  async function loadPosts() {
    try {
      setLoading(true);
      setError('');

      // Call our API service - filter by published if not authenticated
      const data = await getPosts(isAuthenticated ? undefined : true);

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

  // Build tree structures for sidebar
  const dateTree = buildDateTree(posts);
  const seriesGroups = buildSeriesGroups(posts);

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

      <div className="content-layout has-sidebar">
        {/* Tree Navigation Sidebar */}
        <aside className="tree-sidebar">
          {/* Tag Filter Section */}
          {allTags.length > 0 && (
            <div className="tree-section tag-filter-section">
              <h3>Filter by Tag</h3>
              <div className="tag-filter-buttons">
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
              </div>
            </div>
          )}

          {/* Series Tree Section */}
          {seriesGroups.length > 0 && (
            <div className="tree-section">
              <button
                className="tree-section-header"
                onClick={() => setSeriesSectionExpanded(!seriesSectionExpanded)}
              >
                <span className={`toggle-icon ${seriesSectionExpanded ? 'expanded' : ''}`}>
                  {seriesSectionExpanded ? '▼' : '▶'}
                </span>
                <h3>Series</h3>
              </button>
              {seriesSectionExpanded && (
                <ul className="tree-list">
                  {seriesGroups.map(group => (
                    <li key={group.name} className="tree-series">
                      <button
                        className="tree-toggle"
                        onClick={() => toggleSeries(group.name)}
                      >
                        <span className={`toggle-icon ${expandedSeries.has(group.name) ? 'expanded' : ''}`}>
                          {expandedSeries.has(group.name) ? '▼' : '▶'}
                        </span>
                        {group.name} ({group.posts.length})
                      </button>
                      {expandedSeries.has(group.name) && (
                        <ul className="tree-posts">
                          {group.posts.map((post, index) => (
                            <li key={post.id} className="tree-post">
                              <Link to={`/posts/${post.id}`} className="tree-post-link">
                                <span className="series-number">{index + 1}.</span> {post.title}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Date Tree Section */}
          <div className="tree-section">
            <button
              className="tree-section-header"
              onClick={() => setDateSectionExpanded(!dateSectionExpanded)}
            >
              <span className={`toggle-icon ${dateSectionExpanded ? 'expanded' : ''}`}>
                {dateSectionExpanded ? '▼' : '▶'}
              </span>
              <h3>Browse by Date</h3>
            </button>
            {dateSectionExpanded && (
              <ul className="tree-list">
                {dateTree.map(yearNode => (
                  <li key={yearNode.year} className="tree-year">
                    <button
                      className="tree-toggle"
                      onClick={() => toggleYear(yearNode.year)}
                    >
                      <span className={`toggle-icon ${expandedYears.has(yearNode.year) ? 'expanded' : ''}`}>
                        {expandedYears.has(yearNode.year) ? '▼' : '▶'}
                      </span>
                      {yearNode.year}
                    </button>
                    {expandedYears.has(yearNode.year) && (
                      <ul className="tree-months">
                        {yearNode.months.map(monthNode => {
                          const monthKey = `${yearNode.year}-${monthNode.month}`;
                          return (
                            <li key={monthKey} className="tree-month">
                              <button
                                className="tree-toggle"
                                onClick={() => toggleMonth(monthKey)}
                              >
                                <span className={`toggle-icon ${expandedMonths.has(monthKey) ? 'expanded' : ''}`}>
                                  {expandedMonths.has(monthKey) ? '▼' : '▶'}
                                </span>
                                {monthNode.monthName} ({monthNode.posts.length})
                              </button>
                              {expandedMonths.has(monthKey) && (
                                <ul className="tree-posts">
                                  {monthNode.posts.map(post => (
                                    <li key={post.id} className="tree-post">
                                      <Link to={`/posts/${post.id}`} className="tree-post-link">
                                        {post.title}
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

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
                            {isAuthenticated && (
                              <span className={`badge ${post.published ? 'published' : 'draft'}`}>
                                {post.published ? 'Published' : 'Draft'}
                              </span>
                            )}
                            {post.category && <span>{isAuthenticated ? '• ' : ''}{post.category}</span>}
                            {post.created_at && (
                              <span>
                                {(isAuthenticated || post.category) && '• '}{new Date(post.created_at).toLocaleDateString('en-US', {
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
                {isAuthenticated && (
                  <span className={`badge ${post.published ? 'published' : 'draft'}`}>
                    {post.published ? 'Published' : 'Draft'}
                  </span>
                )}
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
