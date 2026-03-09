# Event & Expense Tracker

A comprehensive event and expense management system built with React, TypeScript, and Tailwind CSS. Track events, manage marketing expenses, monitor product inventory, and generate Excel reports.

## Features

- **Event Management**: Create, edit, and delete events with detailed information
- **Expense Tracking**: Track transportation, meal allowances, and custom marketing expenses
- **Product Management**: Monitor product inventory with variants, pricing, and sales tracking
- **Activity Planning**: Organize giveaways, selling activities, booth items, samples, and event flow
- **Excel Integration**: Import/export events with full data preservation
- **Image Compression**: Automatic image compression for efficient storage
- **Edit History**: Track all changes with timestamps and user information
- **Print Functionality**: Print-friendly event reports
- **Secure Login**: Single-user authentication system
- **Storage Warnings**: Automatic alerts when localStorage is approaching capacity

## Tech Stack

- **Frontend**: React 18.3.1 with TypeScript
- **Routing**: React Router 7.13.0
- **Styling**: Tailwind CSS 4.1.12
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Excel**: xlsx (SheetJS)
- **Build Tool**: Vite 6.3.5

## Getting Started

### Prerequisites

- Node.js 18+ or compatible runtime
- pnpm (recommended) or npm

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd event-expense-tracker
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Run the development server:
   ```bash
   pnpm dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

### Default Login

- **Email**: `admin@example.com`
- **Password**: `admin123`

(You can change these in `/src/app/pages/Login.tsx`)

## Building for Production

Build the application:
```bash
pnpm build
```

The built files will be in the `dist/` directory.

Preview the production build:
```bash
pnpm preview
```

## Deployment

This application uses localStorage for data persistence, making it suitable for single-user deployments. It can be deployed to any static hosting service:

### Netlify

1. Connect your repository to Netlify
2. Build command: `pnpm build`
3. Publish directory: `dist`

### Vercel

1. Connect your repository to Vercel
2. Build command: `pnpm build`
3. Output directory: `dist`

### GitHub Pages

1. Build the project: `pnpm build`
2. Deploy the `dist/` folder to GitHub Pages

### Other Static Hosts

The application is a standard Vite React app and can be deployed to:
- Cloudflare Pages
- AWS S3 + CloudFront
- Azure Static Web Apps
- Firebase Hosting
- Any other static hosting service

## Storage

The application uses browser localStorage for data persistence:
- **Storage Key**: `events_storage`
- **Capacity**: ~5-10MB depending on browser
- **Image Compression**: Automatic compression reduces storage by up to 80%
- **Warning System**: Alerts when storage exceeds 80% capacity

### Storage Considerations

- Data persists locally in the browser
- Clearing browser data will delete all events
- Use Excel export to backup data regularly
- Not suitable for multi-device access without custom sync solution

## Excel Import/Export

### Template Format

Download the blank template from the Dashboard to see the expected format:
- **Event Information**: Basic event details
- **Expenses**: Marketing expenses with quantities and amounts
- **Activities**: Event activities and descriptions
- **Products**: Product inventory with variants and sales tracking

### Round-Trip Compatibility

Exported events maintain full compatibility with import, preserving:
- All event metadata
- Expense breakdowns
- Product details and images (as base64)
- Activity descriptions
- Dates and numeric values

## Project Structure

```
/
├── src/
│   ├── app/
│   │   ├── components/      # React components
│   │   │   ├── ui/          # Reusable UI components
│   │   │   ├── CreateEvent.tsx
│   │   │   ├── EditLog.tsx
│   │   │   └── StorageWarning.tsx
│   │   ├── lib/
│   │   │   └── storage.ts   # localStorage wrapper
│   │   ├── pages/           # Route pages
│   │   │   ├── Dashboard.tsx
│   │   │   ├── EventDetails.tsx
│   │   │   ├── Login.tsx
│   │   │   └── PrintEvent.tsx
│   │   ├── utils/           # Utility functions
│   │   │   ├── auth.ts
│   │   │   └── imageCompression.ts
│   │   ├── App.tsx          # Root component
│   │   ├── routes.tsx       # Route configuration
│   │   └── types.ts         # TypeScript types
│   ├── styles/              # Global styles
│   └── main.tsx             # Application entry point
├── index.html               # HTML template
├── vite.config.ts           # Vite configuration
└── package.json             # Dependencies
```

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Responsive design

## Development

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build

### Adding New Features

1. Create components in `/src/app/components/`
2. Add pages in `/src/app/pages/`
3. Update routes in `/src/app/routes.tsx`
4. Update types in `/src/app/types.ts`
5. Use the storage API in `/src/app/lib/storage.ts`

## License

This project is private and proprietary.

## Support

For issues or questions, please contact the development team.
