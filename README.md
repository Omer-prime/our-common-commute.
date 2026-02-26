# Our Common Commute — Rider Web App

Rider-side web application for booking rides, managing trips, and tracking ride status on a map.  
Built with **Next.js 16**, **React 19**, **TypeScript**, **Tailwind CSS v4**, and **Google Maps**.

---

## ✨ Features

- Rider authentication (login/signup) *(if enabled by backend)*
- Request a ride (pickup, drop-off, ride details)
- Map experience using Google Maps
- Ride status flow (requested → accepted → started → completed/cancelled)
- Trip history + trip details *(if enabled by backend)*
- QR code support (e.g., trip confirmation / verification)
- Responsive UI

> Some features depend on your backend/API and realtime setup.

---

## 🧱 Tech Stack

- **Framework:** Next.js 16
- **UI:** React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Maps:** `@react-google-maps/api`
- **Charts:** Recharts
- **Icons:** Lucide React
- **Utilities:** clsx
- **Other:** qrcode

---

## ✅ Requirements

- **Node.js 18+** (recommended)
- npm / yarn / pnpm

---

## 🚀 Getting Started

### 1) Clone the repo
```bash
git clone <YOUR_REPO_URL>
cd our-common-commute
```
2) Install dependencies
npm install
# or
yarn
# or
pnpm install

3) Environment Variables

Create a file named .env.local in the project root.

Example (edit these names to match your project):

# Backend API (example)
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_KEY

# Optional: Realtime (if you use sockets)
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000

Never commit real keys. Add .env.local to .gitignore (Next.js usually does this already).

▶️ Run Locally
npm run dev

Open: http://localhost:3000

🏗️ Build & Run Production
npm run build
npm run start
🔍 Lint
npm run lint
📁 Project Structure (Typical Next.js)
our-common-commute/
  app/                  # App Router pages (if using App Router)
  pages/                # Pages Router (if using Pages Router)
  components/
  lib/
  public/
  styles/
  package.json
  README.md

Your repo may have either app/ or pages/ depending on which router you used.

🗺️ Google Maps Notes

This app uses @react-google-maps/api. Make sure your Google Cloud project has:

Maps JavaScript API enabled

Billing enabled (required by Google for most Maps usage)

A restricted API key (recommended)

📦 Deployment

Recommended: Vercel (best for Next.js)

Deployment checklist:

Push the repo to GitHub

Import into Vercel

Add environment variables in Vercel project settings

Deploy

You can also deploy on a VPS using npm run build + npm run start behind Nginx.


👤 Maintainer

Omer Prime
email : umer.ome23@gmail.com
