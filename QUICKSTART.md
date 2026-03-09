# Quick Start Guide

Get your Event & Expense Tracker up and running in minutes!

## 🚀 Fast Deploy (3 Steps)

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Build for Production
```bash
pnpm build
```

### 3. Deploy
Choose one:

**Netlify (Easiest):**
```bash
npx netlify-cli deploy --prod
```

**Vercel:**
```bash
npx vercel --prod
```

**GitHub Pages:**
```bash
npx gh-pages -d dist
```

That's it! 🎉

---

## 🛠️ Local Development

Start the dev server:
```bash
pnpm dev
```

Open http://localhost:5173

**Default Login:**
- Email: `admin@example.com`
- Password: `admin123`

---

## 📦 What's Inside

- ✅ Event management with full CRUD
- ✅ Expense tracking (transport, meals, custom)
- ✅ Product inventory with sales tracking
- ✅ Excel import/export with round-trip compatibility
- ✅ Automatic image compression (80% reduction)
- ✅ Print-friendly event reports
- ✅ Edit history logging
- ✅ Storage quota warnings
- ✅ Responsive mobile design

---

## 🌐 Deployment Platforms

All of these work out of the box:

| Platform | Command | Time |
|----------|---------|------|
| **Netlify** | `npx netlify-cli deploy --prod` | ~2 min |
| **Vercel** | `npx vercel --prod` | ~2 min |
| **Cloudflare** | UI Deploy | ~3 min |
| **GitHub Pages** | `npx gh-pages -d dist` | ~2 min |
| **Firebase** | `firebase deploy` | ~3 min |

No configuration needed - just build and deploy!

---

## 📱 Features Overview

### Event Management
- Create events with name, address, date, POC, description
- Track expected attendees
- Upload and compress event images

### Expense Tracking
- Transportation costs
- Meal allowances
- Custom expense types with quantity × unit price
- Automatic total calculation

### Product Management
- Product name, variant, size, price
- Quantity and sold quantity tracking
- "Sold" status toggle
- Product images (compressed automatically)

### Excel Integration
- Download blank template
- Import events from Excel
- Export events to Excel (preserves all data)
- Round-trip compatible (export → import → no data loss)

### Storage Management
- Automatic image compression (up to 80% reduction)
- Storage quota monitoring
- Warnings at 80% capacity
- Clear storage recommendations

---

## 🔧 Customization

### Change Login Credentials
Edit `/src/app/pages/Login.tsx`:
```typescript
if (email === "your@email.com" && password === "your-password") {
  // ...
}
```

### Adjust Image Compression
Edit `/src/app/utils/imageCompression.ts`:
```typescript
const options = {
  maxSizeMB: 0.5,        // Change max size
  maxWidthOrHeight: 1920 // Change max dimensions
}
```

### Modify Theme Colors
Edit `/src/styles/theme.css`:
```css
--color-primary: #2563eb; /* Blue - change to your brand color */
```

---

## ⚠️ Important Notes

### Data Storage
- Uses browser localStorage (5-10MB capacity)
- Data persists locally only
- Not synchronized across devices
- Clearing browser data deletes all events

### Backup Strategy
**Recommended:**
1. Export all events weekly
2. Save Excel files to cloud storage
3. Keep multiple backup copies

### Browser Support
- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers

---

## 🐛 Common Issues

**Build fails?**
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm build
```

**Routes don't work after deploy?**
- Ensure hosting platform redirects all routes to index.html
- Check `netlify.toml` or `vercel.json` configuration

**Images not loading?**
- Check localStorage quota (clear if needed)
- Verify image compression is working
- Try smaller images

**Excel import not working?**
- Download the template first
- Follow the exact format
- Don't rename sheet names
- Keep instruction rows intact

---

## 📚 Documentation

- **Full README**: See `README.md`
- **Deployment Guide**: See `DEPLOYMENT.md`
- **Code Structure**: See `README.md` → Project Structure

---

## 🎯 Next Steps

1. **Deploy** to your favorite platform
2. **Customize** login credentials
3. **Test** all features with sample data
4. **Backup** regularly using Excel export
5. **Share** with your team

---

## 💡 Tips

- Export to Excel regularly for backups
- Compress images before uploading (automatic, but helps)
- Use the template for bulk imports
- Check storage warnings proactively
- Print functionality works best in Chrome/Edge

---

## 🆘 Need Help?

1. Check browser console for errors
2. Review `DEPLOYMENT.md` for detailed guides
3. Test in incognito mode to rule out cache issues
4. Verify all dependencies installed: `pnpm list`

---

**Ready to deploy?** Run `pnpm build` and pick your platform! 🚀
