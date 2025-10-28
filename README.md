CafeConnect — Split Deploy (Client + Server)
===========================================

Stack
- Backend: Node.js + Express + Prisma + SQLite
- Frontend: Vite + React + Tailwind + React Router

Folders
- `server/` — API only (no static serving). Prisma schema + seed.
- `client/` — React app (customer + admin). Built and hosted as static.

Local Development
1) Install deps
   - In `server/`: `npm i`
   - In `client/`: `npm i`

2) Init DB (SQLite)
   - In `server/`: `npm run db:push && npm run prisma:generate && npm run seed`

3) Run dev servers
   - API: `npm run dev` in `server/` (http://localhost:4000)
   - Web: `npm run dev` in `client/` (http://localhost:5173)
   - Client uses `VITE_API_URL` (see `client/.env.example`); defaults to http://localhost:4000/api

Frontend Routes
- Customer: `/c/:cafeId/table/:tableId`
- Admin login: `/admin/login`
- Admin dashboard: `/admin`

API (examples)
- GET `/api/menu?cafeId=1`
- POST `/api/orders` { cafeId, tableId, items: [{menuItemId, qty, notes?}] }
- PUT `/api/orders/:id/status` { status } (admin)
- POST `/api/requests` { cafeId, tableId, type }
- GET `/api/requests` (admin)
- PUT `/api/requests/:id/status` { status: "done" } (admin)
- POST `/api/auth/login` { email, password }

Default Admin (seed)
- email: `admin@cafe.com`
- password: `admin123`

Deploy on Render
Backend (Web Service)
- Root directory: `server`
- Build Command: `npm install && npx prisma generate`
- Start Command: `node index.js`
- Env vars: `DATABASE_URL`, `JWT_SECRET`, `ALLOWED_ORIGIN`, `NODE_ENV=production`

Frontend (Static Site)
- Root directory: `client`
- Build Command: `npm install && npm run build`
- Publish directory: `dist`
- Env vars: `VITE_API_URL=https://YOUR-BACKEND.onrender.com/api`
