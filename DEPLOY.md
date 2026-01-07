# Deployment Guide for ShuckleCodes

Quick reference for deploying updates to https://shucklecodes.com

## Server Structure

**Local:**
```
ShuckleCodes/
├── server/              ← Backend source
│   ├── src/            ← TypeScript source
│   ├── dist/           ← Compiled JavaScript
│   ├── package.json
│   ├── app.js
│   └── tsconfig.json
└── client/              ← Frontend source
    ├── src/            ← React source
    ├── dist/           ← Built static files
    └── package.json
```

**Production Server:**
```
/home/lzpxczan/
├── ShuckleCodes/        ← Backend
│   ├── src/
│   ├── dist/
│   ├── node_modules/   (symlink)
│   ├── package.json
│   ├── app.js
│   ├── .env
│   └── tsconfig.json
└── public_html/         ← Frontend (static files only)
    ├── index.html
    └── assets/
```

---

## Deployment Workflows

### 🔧 Backend Changes (API, Database Logic)

**When:** You modify files in `server/src/`

**Steps:**

1. **Build the backend:**
   ```bash
   cd server
   npm run build
   ```

2. **Upload to server via FTP:**
   - Upload `server/dist/*` → `/home/lzpxczan/ShuckleCodes/dist/`
   - If package.json changed: Upload `server/package.json` → `/home/lzpxczan/ShuckleCodes/package.json`
   - If new dependencies: Click "Run NPM Install" in cPanel Node.js interface

3. **Restart the Node.js app:**
   - In cPanel → Setup Node.js App
   - Click "Restart"

4. **Test:**
   - Visit https://shucklecodes.com/api/health
   - Should return `{"status":"OK","timestamp":"..."}`

---

### 🎨 Frontend Changes (React Components, UI)

**When:** You modify files in `client/src/`

**Steps:**

1. **Build the frontend:**
   ```bash
   cd client
   npm run build
   ```

2. **Upload to server via FTP:**
   - Delete everything in `/home/lzpxczan/public_html/*` (except .htaccess if present)
   - Upload `client/dist/*` → `/home/lzpxczan/public_html/`
     - Upload `index.html`
     - Upload entire `assets/` folder

3. **Test:**
   - Visit https://shucklecodes.com
   - Hard refresh browser (Ctrl+Shift+R) to clear cache
   - Should see your changes

**Note:** No Node.js restart needed for frontend changes!

---

### 🗄️ Database Schema Changes

**When:** You need to add/modify tables or columns

**Options:**

**Option A: Via phpPgAdmin (Recommended)**
1. Open phpPgAdmin in cPanel
2. Connect to `lzpxczan_shucklecodes` database
3. Run your SQL commands
4. Grant permissions:
   ```sql
   GRANT ALL PRIVILEGES ON TABLE table_name TO lzpxczan_blog_user;
   GRANT ALL PRIVILEGES ON SEQUENCE table_name_id_seq TO lzpxczan_blog_user;
   ```

**Option B: Via SSH Terminal**
```bash
source /home/lzpxczan/nodevenv/ShuckleCodes/20/bin/activate
cd /home/lzpxczan/ShuckleCodes
# If you created a migration script:
node dist/migrate.js
```

---

### 📦 Both Frontend and Backend Changed

**Follow both workflows above in order:**
1. Build and deploy backend first
2. Restart Node.js app
3. Build and deploy frontend
4. Test everything

---

## Quick Deploy Checklist

### Before Deploying:

- [ ] Code tested locally
- [ ] Git committed and pushed to GitHub
- [ ] Environment variables documented (if changed)
- [ ] Database migrations planned (if needed)

### Backend Deploy:

- [ ] `cd server && npm run build`
- [ ] Upload `server/dist/*` to `/home/lzpxczan/ShuckleCodes/dist/`
- [ ] If package.json changed: Upload and run NPM Install
- [ ] Restart Node.js app in cPanel
- [ ] Check stderr.log for errors: `tail -50 /home/lzpxczan/ShuckleCodes/stderr.log`

### Frontend Deploy:

- [ ] `cd client && npm run build`
- [ ] Upload `client/dist/*` to `/home/lzpxczan/public_html/`
- [ ] Test in browser (hard refresh)

---

## Common Issues & Solutions

### 503 Service Unavailable
**Cause:** Node.js app crashed or not running
**Fix:**
1. Check `/home/lzpxczan/ShuckleCodes/stderr.log`
2. Fix the error
3. Restart app in cPanel

### 404 on API Calls
**Cause:** Frontend calling wrong API URL
**Fix:**
1. Verify `client/.env.production` has `VITE_API_URL=/api`
2. Rebuild client: `cd client && npm run build`
3. Re-upload to public_html

### "Permission denied for relation"
**Cause:** Database user lacks permissions
**Fix:** Run GRANT commands in phpPgAdmin (see Database Schema Changes above)

### Changes Not Showing
**Cause:** Browser cache
**Fix:** Hard refresh (Ctrl+Shift+R) or clear cache

### npm install Fails on Server
**Cause:** Shared hosting resource limits
**Solution:** Use cPanel's "Run NPM Install" button or contact WHC support

---

## Environment Variables

**Production values are set in:**
- cPanel Node.js interface (visible to running app)
- `/home/lzpxczan/ShuckleCodes/.env` (backup, for terminal access)

**Required variables:**
```
NODE_ENV=production
DB_HOST=localhost
DB_PORT=5432
DB_USER=lzpxczan_blog_user
DB_PASSWORD=<your_password>
DB_NAME=lzpxczan_shucklecodes
```

---

## FTP Credentials

**Host:** ftp.shucklecodes.com
**Username:** <your_cpanel_username>
**Password:** <your_cpanel_password>
**Port:** 21 (or 22 for SFTP)

**Quick paths:**
- Backend: `/home/lzpxczan/ShuckleCodes/`
- Frontend: `/home/lzpxczan/public_html/`

---

## Rollback Procedure

**If deployment breaks the site:**

1. **Check logs immediately:**
   ```bash
   tail -100 /home/lzpxczan/ShuckleCodes/stderr.log
   ```

2. **Rollback backend:**
   - Re-upload previous working `dist/` folder
   - Restart app

3. **Rollback frontend:**
   - Re-upload previous working `client/dist/*` to public_html

4. **Restore database (if needed):**
   - Use phpPgAdmin to restore from backup
   - Or contact WHC support

---

## Performance Tips

- **Minimize uploads:** Only upload changed files
- **Compress before upload:** Zip large folders, upload, then extract on server
- **Use SFTP:** Faster and more reliable than FTP
- **Monitor logs:** Check stderr.log regularly for hidden errors

---

## Contact Info

**WHC Support:** support@whc.ca
**cPanel:** https://shucklecodes.com:2083
**GitHub Repo:** https://github.com/ShuckleCodes/ShuckleCodes

---

## Last Updated

January 7, 2026 - Initial deployment successful
