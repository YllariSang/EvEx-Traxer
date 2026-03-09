# Deployment Guide

## Pre-Deployment Checklist

- [x] Remove all Supabase dependencies and references
- [x] Use localStorage for data persistence
- [x] Create index.html entry point
- [x] Create main.tsx entry point
- [x] Configure package.json with build scripts
- [x] Add .gitignore for version control
- [x] Configure vite.config.ts for production builds
- [x] Add deployment configuration files (netlify.toml, vercel.json)

## Quick Deploy Options

### Option 1: Netlify (Recommended)

**Via Netlify CLI:**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build the project
pnpm build

# Deploy
netlify deploy --prod
```

**Via Netlify UI:**
1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [Netlify](https://netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Connect your repository
5. Build settings are auto-detected from `netlify.toml`
6. Click "Deploy site"

**Environment:**
- Build command: `pnpm build`
- Publish directory: `dist`
- Node version: 18+

---

### Option 2: Vercel

**Via Vercel CLI:**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

**Via Vercel UI:**
1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [Vercel](https://vercel.com)
3. Click "Add New" → "Project"
4. Import your repository
5. Settings are auto-detected from `vercel.json`
6. Click "Deploy"

**Environment:**
- Build command: `pnpm build`
- Output directory: `dist`
- Install command: `pnpm install`

---

### Option 3: GitHub Pages

**Manual Deployment:**
```bash
# Build the project
pnpm build

# If using GitHub Pages in a subdirectory, update vite.config.ts:
# base: '/repository-name/'

# Deploy using gh-pages package
npx gh-pages -d dist
```

**Via GitHub Actions:**
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
          
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - name: Install dependencies
        run: pnpm install
        
      - name: Build
        run: pnpm build
        
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

---

### Option 4: Cloudflare Pages

1. Push your code to GitHub
2. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
3. Navigate to "Workers & Pages" → "Create application" → "Pages"
4. Connect your repository
5. Build settings:
   - Build command: `pnpm build`
   - Build output directory: `dist`
   - Node version: 18
6. Click "Save and Deploy"

---

### Option 5: Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase
firebase init hosting

# When prompted:
# - Public directory: dist
# - Configure as single-page app: Yes
# - Automatic builds: No

# Build and deploy
pnpm build
firebase deploy --only hosting
```

---

## Manual Build & Deploy

For any static hosting service:

1. **Build the project:**
   ```bash
   pnpm install
   pnpm build
   ```

2. **Upload the `dist/` folder** to your hosting service

3. **Configure redirects:**
   All routes should redirect to `index.html` for React Router to work:
   - Nginx: See nginx.conf example below
   - Apache: See .htaccess example below

---

## Server Configuration Examples

### Nginx
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

### Apache (.htaccess)
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

## Production Optimizations

### 1. Enable Compression
Most hosting services auto-enable gzip/brotli compression. Verify it's enabled for:
- `.js` files
- `.css` files
- `.html` files

### 2. Cache Headers
Configure caching for static assets:
```
# Cache static assets for 1 year
Cache-Control: public, max-age=31536000, immutable

# Don't cache index.html
Cache-Control: no-cache
```

### 3. Security Headers
Add security headers (most platforms support this):
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

---

## Environment Variables

This application doesn't require environment variables since it uses localStorage. However, if you want to configure the default login credentials:

1. Edit `/src/app/pages/Login.tsx`
2. Update the hardcoded credentials
3. Rebuild: `pnpm build`

**Note:** For production, consider implementing a proper backend authentication system.

---

## Data Persistence Notes

⚠️ **Important:** This application uses browser localStorage for data persistence.

**Implications:**
- Data is stored locally in the user's browser
- Clearing browser data will delete all events
- Multi-device access requires custom sync solution
- Recommended: Regular Excel exports as backups

**For Multi-User/Multi-Device:**
Consider migrating to:
- Firebase Realtime Database
- Supabase
- Custom backend API
- MongoDB Atlas

---

## Post-Deployment Checklist

After deployment, verify:

- [ ] Application loads correctly
- [ ] Login works (admin@example.com / admin123)
- [ ] Can create new events
- [ ] Can edit existing events
- [ ] Can delete events
- [ ] Excel export works
- [ ] Excel import works
- [ ] Images upload and compress properly
- [ ] Print functionality works
- [ ] All routes work (Dashboard, Event Details, Create, Print)
- [ ] Mobile responsive design works
- [ ] Storage warnings appear correctly

---

## Monitoring & Maintenance

### Regular Backups
Instruct users to:
1. Export all events to Excel weekly
2. Save exports to cloud storage (Google Drive, Dropbox, etc.)

### Browser Compatibility Testing
Test on:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Android)

### Performance Monitoring
Monitor:
- Page load times
- Image compression effectiveness
- localStorage usage
- User feedback on responsiveness

---

## Troubleshooting

### Build Fails
```bash
# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm build
```

### Routes Don't Work After Deployment
- Ensure server redirects all routes to index.html
- Check hosting platform's SPA configuration

### Images Not Loading
- Verify image compression is working
- Check browser console for errors
- Confirm localStorage quota isn't exceeded

### Excel Import/Export Issues
- Ensure XLSX library is installed: `pnpm list xlsx`
- Check browser console for errors
- Verify file format matches template

---

## Support & Updates

For questions or issues:
1. Check browser console for errors
2. Verify all dependencies are installed
3. Test in incognito mode to rule out cache issues
4. Review deployment logs on your hosting platform

---

## License

This project is private and proprietary. Unauthorized distribution is prohibited.
