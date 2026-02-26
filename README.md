# Rider Web App

A web application for riders to book rides, track drivers in real time, manage trips, and handle profile/wallet features.  
This repo contains the **frontend** for the Rider Web App and connects to a separate backend API.

---

## ✨ Key Features

- Rider authentication (login/signup/forgot password)
- Create ride requests (pickup, drop-off, ride type, notes)
- Live ride tracking (map + driver location updates)
- Trip status flow (requested → accepted → started → completed/cancelled)
- Trip history + trip details
- Rider profile (name, phone, photo, settings)
- Wallet / payments (optional)
- Promo codes / discounts (optional)
- Support / contact (optional)
- Fully responsive UI

> Note: Features marked “optional” depend on your backend setup.

---

## 🧱 Tech Stack (Edit if needed)

- Frontend: React + TypeScript (or JavaScript)
- Framework: Next.js **or** Vite (choose whichever your project uses)
- Styling: Tailwind CSS / CSS / Bootstrap (your choice)
- Maps: Google Maps / Mapbox (your choice)
- API: REST (or GraphQL)
- Realtime: WebSockets / Socket.IO (optional)

---

## ✅ Requirements

- Node.js **18+** (recommended)
- npm / yarn / pnpm (any one)

---

## 🚀 Getting Started

### 1) Clone the repo
```bash
git clone <YOUR_REPO_URL>
cd rider-web-app
```
2) Install dependencies
npm install
# or
yarn
# or
pnpm install
3) Setup environment variables

Create one of these (based on your setup):

Next.js: .env.local

Vite: .env

Example:

# API
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
# or (Vite)
VITE_API_BASE_URL=http://localhost:5000

# Realtime (optional)
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
# or (Vite)
VITE_SOCKET_URL=http://localhost:5000

# Maps (choose what you use)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_KEY
# OR
NEXT_PUBLIC_MAPBOX_TOKEN=YOUR_TOKEN

Keep secrets out of GitHub. Do not commit real keys.

▶️ Run Locally
If this is a Next.js project:
npm run dev

Open: http://localhost:3000

If this is a Vite project:
npm run dev

Vite will show the local URL in your terminal.

🏗️ Build for Production
Next.js
npm run build
npm run start
Vite
npm run build
npm run preview
🧪 Lint / Format (Optional)
npm run lint
npm run format

If these scripts don’t exist in your project, remove this section.

📁 Project Structure (Typical)
rider-web-app/
  src/
    components/
    pages/ or app/               # Next.js routing (pages or app router)
    routes/                      # if using React Router
    services/                    # API calls (axios/fetch)
    store/                       # state management (redux/zustand/context)
    hooks/
    utils/
    styles/
  public/
  .env.example
  package.json
  README.md
🔌 Backend / API Notes

This frontend expects a backend that provides endpoints such as:

POST /auth/login

POST /auth/register

GET /me

POST /rides/request

GET /rides/current

GET /rides/history

WebSocket events for live driver/ride updates (if enabled)

Update the API base URL in your env file to connect your backend.

🌍 Deployment

Common options:

Vercel (best for Next.js)

Netlify

Cloudflare Pages

VPS (Nginx + Node)

Basic steps:

Set environment variables in your hosting dashboard

Build the app

Deploy the output (or run start for Next.js)

🤝 Contributing

Fork the repo

Create a new branch: git checkout -b feature/my-feature

Commit changes: git commit -m "Add my feature"

Push: git push origin feature/my-feature

Open a Pull Request
