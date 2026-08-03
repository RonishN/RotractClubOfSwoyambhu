# Rotaract Club of Swoyambhu Website - Detailed Documentation

## 1. Project Overview
This project is a single-page React website for the Rotaract Club of Swoyambhu, with:
- A public, section-based home page.
- Bilingual content support (English and Nepali).
- A server-side admin API for authentication and content updates.
- Server-managed history tracking for admin updates.

The app uses a Vite frontend with an Express backend API.

## 2. Tech Stack
- Build tool: Vite
- UI library: React
- Routing: react-router-dom
- Backend API: Express
- Language mode: JavaScript-based React app, with TypeScript tooling also present
- Styling: Plain CSS (single global stylesheet)
- Persistence: MongoDB (primary) + PostgreSQL backup fallback (free-tier friendly)
- Auth: JWT bearer token

Main scripts from package.json:
- dev: runs frontend + backend together
- dev:client: Vite frontend only
- dev:server: Express backend only (nodemon)
- server: Express backend only (node)
- build: tsc && vite build
- preview: vite preview

## 3. Main Application Routes
Defined in src/App.jsx:
- / -> Home page
- /login -> Admin login page
- /admin -> Admin dashboard

## 4. Core Features

### 4.1 Public Home Page
Home page composition is in src/pages/Home.jsx and includes:
- Header
- Hero section
- About section
- Team section
- Initiatives section
- Events section
- Gallery section
- Contact section
- Footer

### 4.2 Bilingual Language Toggle (EN/NE)
Implemented via React context in src/context/LanguageContext.jsx.
- Global language state: en or ne.
- Toggle button in header switches language instantly.
- Multiple sections render English or Nepali labels/text based on context.

### 4.3 Sticky Header and Smooth Section Navigation
Header behavior in src/components/Header.jsx:
- Fixed top navigation bar.
- Smooth scroll to page anchors (about, team, initiatives, events, gallery, contact).
- If user is on another route (for example login/admin), clicking a section nav item first navigates to / and then scrolls to target section.

### 4.4 Hero Section with Editable Titles
In src/components/HeroSection.jsx:
- Displays logo, title, tagline, and CTA button.
- English and Nepali hero titles are loaded from backend API /api/content if available.
- Falls back to default hardcoded values when no stored data exists.

### 4.5 About Section with Editable Text
In src/components/AboutSection.jsx:
- Displays default club description and value cards.
- If backend content includes custom aboutEn/aboutNe, those override defaults.

### 4.6 Scroll Fade-In Animations
Custom hook in src/hooks/useFadeIn.js:
- Uses IntersectionObserver.
- Adds visible class when elements enter viewport.
- Works for section-level and child element animation sequencing using delay classes.

### 4.7 Team, Initiatives, Events, Gallery, Contact
- Team: leadership card grid with local image assets.
- Initiatives: cards describing focus areas.
- Events: timeline/list style upcoming events board.
- Gallery: image cards with hover overlays.
- Contact: direct links for email, map, and WhatsApp join.

### 4.8 Footer with Social Links
In src/components/Footer.jsx:
- Club branding (English and Nepali).
- Rotary affiliation message.
- Facebook and Instagram links.

## 5. Admin and Content Management Features

### 5.1 Login Flow
Implemented in src/pages/Login.jsx:
- Login request is sent to backend endpoint /api/admin/login.
- Backend validates SHA-256 hashes against configured admin hash values.
- On success, backend sets an HttpOnly session cookie and redirects to /admin.
- Session verification is checked via /api/admin/session.

Important note:
- Authentication is now server-side verified.
- For production, rotate secrets and use a proper database-backed user model.

### 5.2 Admin Dashboard Tabs
Implemented in src/pages/Admin.jsx with 3 tabs:
- Hero Section
- About Section
- Change History

### 5.3 Editable Fields
Admin can edit:
- Hero English title
- Hero Nepali title
- About English text
- About Nepali text

Save action writes normalized data into localStorage key websiteData.
Save action calls backend endpoint /api/admin/content and stores normalized data server-side.

### 5.4 Change History and Restore
Admin history is stored server-side:
- New edits are prepended to history.
- History is capped to last 10 entries.
- History modal compares old vs new state.
- Admin can restore any version via backend endpoint /api/admin/restore.

### 5.5 Logout
Logout clears adminToken in frontend and returns user to /login.

## 6. Data Model on Server

### 6.1 Keys Used
- Frontend uses server-managed HttpOnly cookie session for admin auth
- Primary database: MongoDB collection configured by MONGODB_DB_NAME and MONGODB_COLLECTION
- Backup database (MongoDB free alternative): PostgreSQL configured by POSTGRES_BACKUP_URL
  - websiteData: JSON object with editable website text
  - history: JSON array of past changes

### 6.2 websiteData Shape
Expected fields:
- heroEn
- heroNe
- aboutEn
- aboutNe
- timestamp

The admin panel includes compatibility mapping for old hero field names when loading.

## 7. File and Folder Structure (Important Parts)
- index.html: HTML shell, meta tags, root mount node
- src/main.jsx: React entry point used by current site
- src/App.jsx: router and providers
- src/pages/Home.jsx: public page assembly
- src/pages/Login.jsx: admin login UI + backend auth request
- src/pages/Admin.jsx: content editor + backend history/restore
- src/api/client.js: frontend API client for auth/content calls
- src/context/LanguageContext.jsx: bilingual state provider
- src/hooks/useFadeIn.js: scroll animation hook
- src/components/: reusable home page sections
- src/styles/index.css: complete visual styling and responsive behavior
- server/index.js: Express API for login, session, content, history, restore
- .env.example: server environment configuration template

Also present:
- src/main.ts and src/counter.ts are Vite template TypeScript starter files and are not used by index.html in current setup.

## 8. Installation Guide

### 8.1 Prerequisites
Install the following on your machine:
- Node.js LTS (recommended: 18.x or newer)
- npm (comes with Node.js)

Check versions:
- node -v
- npm -v

### 8.2 Install Dependencies
From project root:
1. Open terminal in project folder.
2. Run:

```bash
npm install
```

This installs all dependencies in package.json.

## 9. How to Run the Website Locally

### 9.1 Start Development Server
Run:

```bash
npm run dev
```

Then open the local URL shown in terminal (typically http://localhost:5173).
This command starts both frontend and backend together.

### 9.2 Live Reload
While dev server is running:
- Any changes in src files auto-refresh in browser.

## 10. Build and Preview for Production

### 10.1 Create Production Build
Run:

```bash
npm run build
```

This performs:
1. TypeScript check (tsc)
2. Vite production bundling

Build output is generated in the dist folder.

### 10.2 Preview Production Build Locally
Run:

```bash
npm run preview
```

This serves the built dist output for final verification.

## 11. Deployment Notes
The app is a static frontend and can be deployed to any static hosting provider:
The project now includes a backend API, so deploy frontend and backend together.

Basic deployment flow:
1. Deploy backend service (Express) and set environment variables.
2. Deploy frontend build output and route API traffic to backend.
3. Configure SPA fallback (rewrite all routes to index.html) for frontend routes.

Production CORS note:
- Set `FRONTEND_ORIGIN` on the backend to the live frontend domain.
- If you deploy on Vercel, the backend also accepts the current deployment URL via `VERCEL_URL`, which covers same-project deployments without a separate custom origin.

## 12. Security and Architectural Limitations
Current setup is stronger than client-only auth, but still basic:
- MongoDB is primary; if unavailable, app auto-falls back to PostgreSQL backup.
- Token storage is in localStorage, so XSS hardening is important.
- Default hash/secret values must be replaced for production.

For production-grade CMS/auth, add:
- Managed MongoDB with strict network rules, backups, and monitoring
- Real authentication (JWT/session/OAuth)
- Role-based authorization

## 13. Common Troubleshooting

### 13.1 npm install fails
- Ensure Node.js is installed and updated.
- Delete node_modules and package-lock.json, then run npm install again.

### 13.2 Port already in use
- Vite will usually suggest a new port automatically.
- Or run with a custom port:

```bash
npx vite --port 5174
```

### 13.3 /admin redirects unexpectedly
- Check localStorage key adminToken.
- If token is missing/expired, app redirects to /login by design.

### 13.4 Edited content not appearing
- Confirm save action in admin was successful.
- Check MongoDB record or PostgreSQL backup table row is being updated.
- Hard refresh browser after saving.

### 13.5 Route 404 on direct open (/login or /admin)
- Host is missing SPA rewrite rules.
- Configure server to return index.html for unknown routes.

## 14. Suggested Next Improvements
- Add scheduled cross-region DB backups for both MongoDB and PostgreSQL.
- Use secure HttpOnly cookies instead of localStorage token.
- Add image management for gallery/team through admin panel.
- Add form validation and notifications (non-blocking toast system).
- Add automated tests (unit + route-level integration).
- Clean unused starter TypeScript files if not needed.

## 15. Quick Command Reference

```bash
# install dependencies
npm install

# run in development mode
npm run dev

# create production build
npm run build

# preview production build locally
npm run preview
```
