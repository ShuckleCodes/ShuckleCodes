import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import PostList from './components/PostList'
import PostView from './components/PostView'
import PostForm from './components/PostForm'
import Login from './components/Login'
import About from './components/About'
import { useAuth } from './context/AuthContext'
import './App.css'

/**
 * App Component - The root of our application
 * Sets up routing for different pages
 */
function App() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <BrowserRouter>
      <div className="app">
        <nav className="navbar">
          <div className="header-content">
            <div className="header-top">
              <h1>Shuckle Codes</h1>
              {isAuthenticated && (
                <button onClick={logout} className="logout-button">
                  Logout
                </button>
              )}
            </div>
            <p className="tagline">Exploring the intersection of gadgets, code, and creativity</p>
            <nav className="nav-links">
              <Link to="/posts">Posts</Link>
              <Link to="/about">About</Link>
            </nav>
          </div>
        </nav>

        <main>
          <Routes>
            {/* Default route - redirect to /posts */}
            <Route path="/" element={<Navigate to="/posts" replace />} />

            {/* Login page */}
            <Route path="/login" element={<Login />} />

            {/* About page */}
            <Route path="/about" element={<About />} />

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
