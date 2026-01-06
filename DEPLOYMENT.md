# Deployment Guide for WHC.ca

This guide walks through deploying ShuckleCodes to WHC.ca Web Hosting Pro.

## Prerequisites

- WHC.ca Web Hosting Pro account
- Domain configured (shucklecodes.com)
- Access to cPanel
- GitHub account

## Architecture Overview

**Production Setup:**
- Node.js app serves both API and React frontend
- PostgreSQL database hosted on WHC
- Single deployment (server serves built React files)

## Step 1: Prepare the Application

### 1.1 Modify Server to Serve Frontend

We need to configure Express to serve the built React files.

Edit `server/src/index.ts` and add this BEFORE your routes:

```typescript
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from React build
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
}
```

And AFTER your API routes, add a catch-all:

```typescript
// Serve React app for any non-API routes
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}
```

### 1.2 Build Both Apps

```bash
# Build backend
cd server
npm run build

# Build frontend
cd ../client
npm run build
```

This creates:
- `server/dist/` - Compiled server code
- `client/dist/` - Optimized React app

## Step 2: Push to GitHub

### 2.1 Initialize Git (if not already)

```bash
cd C:\Code\ShuckleCodes
git init
git add .
git commit -m "Initial commit - Full-stack blog CMS"
```

### 2.2 Push to GitHub

```bash
git remote add origin https://github.com/ShuckleCodes/ShuckleCodes.git
git branch -M main
git push -u origin main
```

## Step 3: Set Up Database on WHC

### 3.1 Log into cPanel

1. Go to your WHC cPanel
2. Find "PostgreSQL Databases"

### 3.2 Create Database

1. **Create Database:**
   - Database name: `your_cpanel_username_shucklecodes`
   - Click "Create Database"

2. **Create User:**
   - Username: `your_cpanel_username_blog`
   - Generate strong password
   - Click "Create User"

3. **Grant Privileges:**
   - Select user and database
   - Grant "ALL PRIVILEGES"
   - Click "Make Changes"

4. **Note down:**
   - Database name
   - Username
   - Password
   - Host (usually `localhost`)

### 3.3 Initialize Database Tables

You'll need to run the init script. Two options:

**Option A: Via SSH (if available)**
```bash
ssh username@shucklecodes.com
cd your-app-directory/server
node dist/init-db.js
```

**Option B: Via cPanel phpPgAdmin**
1. Open phpPgAdmin in cPanel
2. Connect to your database
3. Run the SQL from `server/src/init-db.ts` manually

## Step 4: Configure Node.js App in cPanel

### 4.1 Access Node.js Setup

1. In cPanel, find "Setup Node.js App" or "Create Node.js App"
2. Click to create new application

### 4.2 Application Settings

Fill in the form:

- **Node.js Version:** 18.x or higher
- **Application Mode:** Production
- **Application Root:** `ShuckleCodes` (or wherever you want it)
- **Application URL:** `shucklecodes.com` or subdomain
- **Application Startup File:** `server/dist/index.js`
- **Custom environment variables:**
  ```
  NODE_ENV=production
  PORT=<assigned-port>
  DB_HOST=localhost
  DB_PORT=5432
  DB_USER=<your_db_user>
  DB_PASSWORD=<your_db_password>
  DB_NAME=<your_db_name>
  ```

### 4.3 Deploy from GitHub

- **Repository:** `https://github.com/ShuckleCodes/ShuckleCodes`
- **Branch:** `main`

Click "Create" or "Deploy"

### 4.4 Install Dependencies

After deployment, you may need to run:

```bash
cd ShuckleCodes/server
npm install --production

cd ../client
npm install --production
npm run build
```

WHC's interface may have a button for this, or you might need SSH access.

## Step 5: Configure Domain

### 5.1 Point Domain to Application

In cPanel:
1. Go to "Domains" or "Addon Domains"
2. Ensure `shucklecodes.com` points to your Node.js app directory

### 5.2 Set Up SSL Certificate

1. In cPanel, go to "SSL/TLS Status"
2. Find `shucklecodes.com`
3. Click "Run AutoSSL"
4. Wait for certificate to be issued

## Step 6: Update Frontend API URL

Your React app needs to know the production API URL.

### 6.1 Create Environment File

Create `client/.env.production`:

```bash
VITE_API_URL=https://shucklecodes.com/api
```

### 6.2 Update API Service

Edit `client/src/services/api.ts`:

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
```

### 6.3 Rebuild Frontend

```bash
cd client
npm run build
```

### 6.4 Push Changes

```bash
git add .
git commit -m "Configure production API URL"
git push
```

## Step 7: Start the Application

In cPanel Node.js App interface:
1. Click "Start App" or "Restart"
2. Wait for startup (30-60 seconds)
3. Check the logs for any errors

## Step 8: Test the Deployment

1. Visit `https://shucklecodes.com`
2. Should see your blog interface
3. Test creating a post
4. Check database updates

## Troubleshooting

### App Won't Start

**Check logs in cPanel:**
- Look for errors in Node.js app logs
- Common issues:
  - Database connection failed (wrong credentials)
  - Missing dependencies (`npm install` not run)
  - Port already in use

### Database Connection Failed

**Verify:**
- Database name includes cPanel username prefix
- User has ALL PRIVILEGES on database
- Host is `localhost` (not `127.0.0.1`)

### Frontend Not Loading

**Check:**
- `client/dist/` folder exists and has built files
- `NODE_ENV=production` is set
- Server is serving static files (Step 1.1)

### CORS Errors

If you get CORS errors:
- Update `server/src/index.ts` CORS config:
  ```typescript
  app.use(cors({
    origin: 'https://shucklecodes.com',
    credentials: true
  }));
  ```

## Updating the Application

When you push changes to GitHub:

1. Make changes locally
2. Test locally
3. Build both apps:
   ```bash
   cd server && npm run build
   cd ../client && npm run build
   ```
4. Commit and push to GitHub
5. In cPanel, pull latest code or redeploy
6. Restart Node.js app

## Alternative: Manual Deployment via FTP

If GitHub integration doesn't work:

1. Build locally (both apps)
2. Connect via FTP
3. Upload entire `ShuckleCodes` folder
4. SSH in and run `npm install --production`
5. Start app in cPanel

## Need Help?

- WHC Support: support@whc.ca
- Check cPanel documentation for Node.js apps
- Verify your plan includes Node.js support

## Next Steps After Deployment

1. Set up automated backups (database + code)
2. Configure monitoring/uptime checks
3. Set up error logging (e.g., Sentry)
4. Add Google Analytics
5. Submit sitemap to search engines
