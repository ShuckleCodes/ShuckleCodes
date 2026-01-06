# ShuckleCodes Blog

Full-stack TypeScript blog/CMS built with React, Node.js, Express, and PostgreSQL.

## Tech Stack

**Frontend:**
- React 19 + TypeScript
- Vite (build tool)
- React Router (navigation)

**Backend:**
- Node.js + Express + TypeScript
- PostgreSQL (database)
- tsx (TypeScript execution)

## Project Structure

```
ShuckleCodes/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── services/    # API service layer
│   │   └── App.tsx      # Router setup
│   └── package.json
│
├── server/              # Express backend
│   ├── src/
│   │   ├── routes/      # API routes
│   │   ├── db.ts        # Database connection
│   │   ├── init-db.ts   # Database setup
│   │   └── index.ts     # Server entry point
│   └── package.json
│
└── shared/              # Shared code (future)
```

## Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL 16+

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/ShuckleCodes/ShuckleCodes.git
   cd ShuckleCodes
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd server
   npm install

   # Frontend
   cd ../client
   npm install
   ```

3. **Configure environment**
   ```bash
   cd server
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Create database**
   ```sql
   CREATE DATABASE shucklecodes;
   ```

5. **Initialize database tables**
   ```bash
   cd server
   npm run db:init
   ```

6. **Start development servers**
   ```bash
   # Terminal 1 - Backend
   cd server
   npm run dev

   # Terminal 2 - Frontend
   cd client
   npm run dev
   ```

7. **Open browser**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## Production Deployment

### Build for Production

1. **Build backend**
   ```bash
   cd server
   npm run build
   # Creates dist/ folder with compiled JavaScript
   ```

2. **Build frontend**
   ```bash
   cd client
   npm run build
   # Creates dist/ folder with optimized static files
   ```

### Deploy to WHC.ca

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## API Endpoints

### Posts
- `GET /api/posts` - List all posts
- `GET /api/posts?published=true` - List published posts only
- `GET /api/posts/:id` - Get single post
- `POST /api/posts` - Create new post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

### Health Check
- `GET /api/health` - Server health status

## Database Schema

### posts table
- `id` - Primary key
- `title` - Post title
- `slug` - URL-friendly slug
- `content` - Full post content
- `excerpt` - Short summary
- `category` - Post category
- `tags` - Array of tags
- `published` - Boolean (published/draft)
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

## Scripts

### Backend (server/)
- `npm run dev` - Start dev server with auto-restart
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run production server
- `npm run db:init` - Initialize database tables

### Frontend (client/)
- `npm run dev` - Start dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## License

MIT
