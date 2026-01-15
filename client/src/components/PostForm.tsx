import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import { createPost, updatePost, getPost, getTags, getSeries, Post } from '../services/api';
import './PostForm.css';

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
 * PostForm Component
 * Handles both creating new posts and editing existing ones
 */
function PostForm() {
  // useParams: gets URL parameters (e.g., /posts/5/edit → id = 5)
  const { id } = useParams<{ id: string }>();

  // useNavigate: programmatically navigate to different routes
  const navigate = useNavigate();

  // Determine if we're editing (has ID) or creating (no ID)
  const isEditing = !!id;

  // Form state - one piece of state for each input field
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [series, setSeries] = useState('');
  const [seriesOrder, setSeriesOrder] = useState<number | ''>('');
  const [isCreatingNewSeries, setIsCreatingNewSeries] = useState(false);
  const [published, setPublished] = useState(false);

  // Available tags and series from database
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [availableSeries, setAvailableSeries] = useState<string[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  // Fetch available tags and series on mount
  useEffect(() => {
    loadAvailableTags();
    loadAvailableSeries();
  }, []);

  // If editing, load the existing post
  useEffect(() => {
    if (isEditing) {
      loadPost();
    }
  }, [id]);

  // Handle case where loaded series isn't in availableSeries yet
  // (race condition between loadPost and loadAvailableSeries, or new series)
  useEffect(() => {
    if (series && availableSeries.length > 0 && !availableSeries.includes(series)) {
      // Series exists but isn't in dropdown - add it to available options
      setAvailableSeries(prev => [...prev, series].sort());
    }
  }, [series, availableSeries]);

  // Load all available tags
  async function loadAvailableTags() {
    try {
      const tags = await getTags();
      setAvailableTags(tags);
    } catch (err) {
      console.error('Failed to load tags:', err);
    }
  }

  // Load all available series
  async function loadAvailableSeries() {
    try {
      const seriesList = await getSeries();
      setAvailableSeries(seriesList);
    } catch (err) {
      console.error('Failed to load series:', err);
    }
  }

  // Load post data for editing
  async function loadPost() {
    try {
      setLoading(true);
      const post = await getPost(parseInt(id!));

      // Populate form fields with existing data
      setTitle(post.title);
      setSlug(post.slug);
      setContent(post.content);
      setExcerpt(post.excerpt || '');
      setCategory(post.category || '');
      setSelectedTags(post.tags || []);
      setSeries(post.series || '');
      setSeriesOrder(post.series_order ?? '');
      setPublished(post.published || false);
    } catch (err) {
      setError('Failed to load post');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Auto-generate slug from title
  function handleTitleChange(newTitle: string) {
    setTitle(newTitle);

    // Only auto-generate slug for new posts
    if (!isEditing) {
      const autoSlug = newTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setSlug(autoSlug);
    }
  }

  // Handle form submission
  async function handleSubmit(e: React.FormEvent) {
    // Prevent default form submission (page reload)
    e.preventDefault();

    // Validate required fields
    if (!title || !slug || !content) {
      setError('Title, slug, and content are required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Combine selected tags with new tag if provided
      const finalTags = [...selectedTags];
      if (newTag.trim()) {
        // Normalize new tag and add if not duplicate
        const normalizedNewTag = newTag.trim().toLowerCase();
        if (!finalTags.some(t => t.toLowerCase() === normalizedNewTag)) {
          finalTags.push(newTag.trim());
        }
      }

      // Build post object
      const post: Post = {
        title,
        slug,
        content,
        excerpt: excerpt || undefined,
        category: category || undefined,
        tags: finalTags.length > 0 ? finalTags : undefined,
        series: series || undefined,
        series_order: seriesOrder !== '' ? seriesOrder : undefined,
        published,
      };

      if (isEditing) {
        // Update existing post
        await updatePost(parseInt(id!), post);
      } else {
        // Create new post
        await createPost(post);
      }

      // Navigate back to the list
      navigate('/posts');
    } catch (err: any) {
      setError(err.message || 'Failed to save post');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading && isEditing) {
    return <div className="form-container">Loading...</div>;
  }

  return (
    <div className="form-container">
      <div className="form-header">
        <h1>{isEditing ? 'Edit Post' : 'Create New Post'}</h1>
        <button onClick={() => navigate('/posts')} className="button button-secondary">
          Cancel
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit} className="post-form">
        {/* Title Field */}
        <div className="form-group">
          <label htmlFor="title">
            Title <span className="required">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Enter post title"
            required
          />
        </div>

        {/* Slug Field */}
        <div className="form-group">
          <label htmlFor="slug">
            Slug <span className="required">*</span>
          </label>
          <input
            id="slug"
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="url-friendly-version"
            required
          />
          <small>URL-friendly version of the title (auto-generated)</small>
        </div>

        {/* Content Field with Tabs */}
        <div className="form-group">
          <div className="content-header">
            <label htmlFor="content">
              Content <span className="required">*</span>
            </label>
          </div>
          <div className="tabs">
            <button
              type="button"
              className={`tab ${activeTab === 'edit' ? 'active' : ''}`}
              onClick={() => setActiveTab('edit')}
            >
              Edit (Markdown)
            </button>
            <button
              type="button"
              className={`tab ${activeTab === 'preview' ? 'active' : ''}`}
              onClick={() => setActiveTab('preview')}
            >
              Preview
            </button>
          </div>

          <div className="markdown-guide">
            <strong>Markdown Quick Reference:</strong>
            <div className="markdown-shortcuts">
              <span># Heading 1</span>
              <span>## Heading 2</span>
              <span>### Heading 3</span>
              <span>**bold**</span>
              <span>*italic*</span>
              <span>[link](url)</span>
              <span>![image](url)</span>
              <span>`code`</span>
              <span>- list item</span>
              <span>&gt; blockquote</span>
            </div>
            <a href="https://www.markdownguide.org/cheat-sheet/" target="_blank" rel="noopener noreferrer" className="full-guide-link">
              View full markdown guide →
            </a>
          </div>

          {activeTab === 'edit' ? (
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your post content in Markdown...

# Heading
**bold** and *italic*

![Image caption](/images/photo.jpg)

## Embed YouTube
Use Share → Embed on YouTube to get the iframe code:
<iframe width='560' height='315' src='https://www.youtube.com/embed/VIDEO_ID' frameborder='0' allowfullscreen></iframe>"
              rows={15}
              required
            />
          ) : (
            <div className="markdown-preview">
              {content ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
                >
                  {content}
                </ReactMarkdown>
              ) : (
                <p className="preview-empty">Nothing to preview yet. Write some content in the Edit tab.</p>
              )}
            </div>
          )}
        </div>

        {/* Excerpt Field */}
        <div className="form-group">
          <label htmlFor="excerpt">Excerpt</label>
          <textarea
            id="excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Short summary for previews"
            rows={3}
          />
        </div>

        {/* Category Field */}
        <div className="form-group">
          <label htmlFor="category">Category</label>
          <input
            id="category"
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g., tutorial, review, unboxing"
          />
        </div>

        {/* Tags Field */}
        <div className="form-group">
          <label>Tags</label>
          {availableTags.length > 0 && (
            <div className="tags-checkboxes">
              {availableTags.map((tag) => (
                <label key={tag} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedTags.includes(tag)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTags([...selectedTags, tag]);
                      } else {
                        setSelectedTags(selectedTags.filter(t => t !== tag));
                      }
                    }}
                  />
                  <span>{tag}</span>
                </label>
              ))}
            </div>
          )}
          <div style={{ marginTop: '1rem' }}>
            <label htmlFor="newTag">Add New Tag</label>
            <input
              id="newTag"
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Enter a new tag name"
            />
            <small>Adding a new tag will make it available for future posts</small>
          </div>
        </div>

        {/* Series Field */}
        <div className="form-group">
          <label htmlFor="series">Series</label>
          {!isCreatingNewSeries ? (
            <select
              id="series"
              value={series}
              onChange={(e) => {
                if (e.target.value === '__new__') {
                  setIsCreatingNewSeries(true);
                  setSeries('');
                } else {
                  setSeries(e.target.value);
                }
              }}
            >
              <option value="">No series (standalone post)</option>
              {availableSeries.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
              <option value="__new__">+ Create new series...</option>
            </select>
          ) : (
            <div className="new-series-input">
              <input
                id="newSeriesName"
                type="text"
                value={series}
                onChange={(e) => setSeries(e.target.value)}
                placeholder="Enter new series name"
                autoFocus
              />
              <button
                type="button"
                className="button button-secondary"
                onClick={() => {
                  setIsCreatingNewSeries(false);
                  setSeries('');
                }}
                style={{ marginLeft: '0.5rem' }}
              >
                Cancel
              </button>
            </div>
          )}
          <small>Group related posts together in a series</small>
        </div>

        {/* Series Order Field - only shown when series is set */}
        {series && (
          <div className="form-group">
            <label htmlFor="seriesOrder">Series Order</label>
            <input
              id="seriesOrder"
              type="number"
              step="0.01"
              min="0"
              value={seriesOrder}
              onChange={(e) => setSeriesOrder(e.target.value ? parseFloat(e.target.value) : '')}
              placeholder="e.g., 1, 2, 3 (use decimals like 1.5 to insert between)"
            />
            <small>Order of this post within the series (lower numbers appear first)</small>
          </div>
        )}

        {/* Published Checkbox */}
        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
            />
            <span>Publish immediately</span>
          </label>
          <small>Uncheck to save as draft</small>
        </div>

        {/* Submit Button */}
        <div className="form-actions">
          <button
            type="submit"
            className="button button-primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : isEditing ? 'Update Post' : 'Create Post'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PostForm;
