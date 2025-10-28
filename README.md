CafeConnect — Local Full‑Stack MVP
=================================

Stack
- Backend: Node.js + Express + Prisma + SQLite
- Frontend: Vite + React + Tailwind + React Router

Folders
- `server/` — API + Prisma schema and seed
- `client/` — React app with a dev proxy to the API

Getting Started
1) Install dependencies
   - In `server/`: `npm i`
   - In `client/`: `npm i`

2) Init database (SQLite)
   - In `server/`: `npm run db:push && npm run prisma:generate && npm run seed`

3) Run servers
   - API: from `server/` → `npm run dev` (http://localhost:4000)
   - Web: from `client/` → `npm run dev` (http://localhost:5173)

Routes
- Customer: `/table/:tableId` e.g. http://localhost:5173/table/1
- Admin login: `/login`
- Admin dashboard: `/admin`

API (examples)
- GET `/api/menu`
- POST `/api/orders` { tableId, items: [{menuItemId, qty, notes?}] }
- GET `/api/orders?tableId=1`
- PUT `/api/orders/:id/status` { status }
- POST `/api/requests` { tableId, type }
- GET `/api/requests`
- PUT `/api/requests/:id/status` { status: "done" }
- POST `/api/auth/login` { email, password }

Default Admin
- email: `admin@cafe.com`
- password: `admin123`

