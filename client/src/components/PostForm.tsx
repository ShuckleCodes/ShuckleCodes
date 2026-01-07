import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import { createPost, updatePost, getPost, Post } from '../services/api';
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
  const [tags, setTags] = useState('');
  const [published, setPublished] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  // If editing, load the existing post
  useEffect(() => {
    if (isEditing) {
      loadPost();
    }
  }, [id]);

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
      setTags(post.tags?.join(', ') || '');
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

      // Convert comma-separated tags to array
      const tagsArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // Build post object
      const post: Post = {
        title,
        slug,
        content,
        excerpt: excerpt || undefined,
        category: category || undefined,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
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
          <label htmlFor="content">
            Content <span className="required">*</span>
          </label>
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
          <label htmlFor="tags">Tags</label>
          <input
            id="tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="javascript, react, nodejs (comma-separated)"
          />
          <small>Separate tags with commas</small>
        </div>

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
