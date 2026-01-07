import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import PostList from './components/PostList'
import PostView from './components/PostView'
import PostForm from './components/PostForm'
import './App.css'

/**
 * App Component - The root of our application
 * Sets up routing for different pages
 */
function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <nav className="navbar">
          <h1>ShuckleCodes</h1>
          <p className="tagline">Full-Stack TypeScript Blog</p>
        </nav>

        <main>
          <Routes>
            {/* Default route - redirect to /posts */}
            <Route path="/" element={<Navigate to="/posts" replace />} />

            {/* Posts list page */}
            <Route path="/posts" element={<PostList />} />

            {/* View single post page */}
            <Route path="/posts/:id" element={<PostView />} />

            {/* Create new post page */}
            <Route path="/posts/new" element={<PostForm />} />

            {/* Edit existing post page */}
            <Route path="/posts/:id/edit" element={<PostForm />} />

            {/* Catch-all for unknown routes */}
            <Route path="*" element={<div>404 - Page Not Found</div>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
