# BOCAR Frontend

React + Vite SPA for the BOCAR procurement automation platform.
Talks to the Django backend at `http://127.0.0.1:8000`.

> **Node environment:** managed with **npm** (included with Node.js).
> The Python/conda environment is only needed for the backend — do not mix them.

---

## Subsequent runs (daily)

```bash
cd Frontend
npm run dev
# → http://localhost:5173
```

That's it. Hot-module replacement (HMR) is active — the browser refreshes automatically on file saves.

### If teammates pushed new npm packages

```bash
cd Frontend
npm install
npm run dev
```

---

## First-time setup

Follow these steps **once** on a fresh clone.

### 1. Install Node.js

Required version: **Node 18 or newer**.

Check whether it's already installed:
```bash
node -v   # should print v18.x.x or higher
```

If not installed, download from [nodejs.org](https://nodejs.org/) (LTS version).

### 2. Install project dependencies

```bash
cd Frontend
npm install
```

This reads `package.json` and installs all packages into `Frontend/node_modules/`.

### 3. Configure environment variables

Create a `.env.development` file inside `Frontend/` (next to `package.json`):

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_PROVEEDOR_HMAC_KEY=clave_secreta
```

> The backend server must be running at that URL before the frontend can make API calls.
> The HMAC key must match `PROVEEDOR_SECRET_KEY` in the backend's environment.

A `.env.development` file with these dev defaults is already committed — you only need this step if the file is missing.

### 4. Start the dev server

```bash
npm run dev
# → http://localhost:5173
```

### Default test accounts (seeded by the backend)

| Username | Password | Role |
|---|---|---|
| `ind_user` | `ind1234` | Industrialization |
| `ind_admin` | `ind1234` | Industrialization_Admin |
| `purchases_user` | `purchases1234` | Purchases |
| `purchases_admin` | `purchases1234` | Purchases_Admin |
| `supplier_user` | `supplier1234` | Supplier |
| `superadmin` | `admin1234` | SuperAdmin |

---

## Other npm commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start dev server with HMR on port 5173 |
| `npm run build` | Production bundle → `Frontend/dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint across the project |

---

## Project structure

```
Frontend/
├── public/
│   ├── BOCAR_logoBlue.png
│   ├── BOCAR_logoLight.png
│   └── BOCAR_video.mp4
├── src/
│   ├── constants/
│   │   └── rfqStatus.js          # STATUS and STATUS_LABEL constants — use these, never raw strings
│   ├── contexts/
│   │   └── NotificationContext.jsx   # Global notification state (loads from /api/notificaciones/);
│   │                                 # storage key is per-user: notif_prefs_{userId}
│   ├── components/
│   │   ├── layout/
│   │   │   ├── NavBar.jsx           # Top nav with notifications bell + user menu;
│   │   │   │                        # accepts sectionsFirst prop (Purchases puts dropdown first)
│   │   │   ├── RFQDetails.jsx       # Shared detail view (stage1/2/3 + ActionBar);
│   │   │   │                        # stage2 edit has inline supplier picker (search + add/remove);
│   │   │   │                        # CUST/ELAB fields hidden for supplier role;
│   │   │   │                        # after Final Quote → navigates to /Suppliers/All-RFQ
│   │   │   ├── UserDetails.jsx      # Create/edit/delete user or supplier;
│   │   │   │                        # password field shown in edit mode for both users and suppliers;
│   │   │   │                        # includes NotificationPreferencesCard
│   │   │   ├── NotisSidebar.jsx     # Notification drawer (no settings gear / NotificationConfig)
│   │   │   ├── TableComponent.jsx   # Generic sortable/filterable table;
│   │   │   │                        # category column shows rfq.type ("mold"/"die")
│   │   │   ├── Calendar.jsx         # Simulated calendar (Month/Week/Day/Agenda); role-aware events
│   │   │   └── Chatbot.jsx          # Simulated AI procurement assistant; role-aware quick prompts
│   │   └── ui/
│   │       ├── UploadCard.jsx       # Drag-drop file upload; fixed stale-closure bug in simulateUpload
│   │       └── Button, Card, Input, Badge, …
│   ├── sections/
│   │   ├── api.js                   # All backend API calls (single source of truth);
│   │   │                            # createRFQ(), assignSuppliers(rfqId, ids, isDraft=false)
│   │   │                            # apiFetch() handles 401 auto-refresh on all calls
│   │   ├── Login/
│   │   ├── Industrialization/       # AllRFQ, Drafts, CreateRFQ, Dashboard, Users
│   │   │                            # Users tab/route hidden for non-admin users
│   │   │                            # Drafts: admin users see inline Send/Discard actions
│   │   │                            # CreateRFQ: uses createRFQ() (token auto-refresh); uploads files on submit
│   │   ├── Purchases/               # AllRFQ, Drafts, NotAnsweredRFQ, Dashboard, SuppliersList, Users
│   │   │                            # Suppliers/Users tabs hidden for non-admin; sectionsFirst=true in NavBar
│   │   │                            # Drafts: admin users see inline Send to Suppliers / Discard actions
│   │   └── Suppliers/               # AllRFQ, Drafts, NotAnsweredRFQ, QuoteForm
│   │       └── QuoteForm.jsx        # Tabbed cost-breakdown form; cleanSeed() strips DB keys on load;
│   │                                # Submit Final Quote hidden until Company+Country (P1) are filled
│   └── App.jsx                      # Router + role-based redirect + ProtectedRoute
├── .env.development                 # VITE_API_BASE_URL + VITE_PROVEEDOR_HMAC_KEY
├── .env.production                  # Production overrides (set real values before deploy)
├── vite.config.js
├── package.json
├── API_RISKS.md                     # Audit of every frontend↔backend call
└── FRONTEND_API_CONTRACT.md         # Full endpoint contract documentation
```

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | React 19 + Vite |
| Routing | React Router v7 |
| HTTP | `fetch` API via `apiFetch()` helper in `api.js` |
| Auth tokens | `js-cookie` (stored as `access_token` + `refresh_token` cookies) |
| HMAC signing | `crypto-js` (supplier login signature) |
| Icons | `lucide-react` |
| Styling | Tailwind CSS |

---

## How API calls work

All backend communication goes through `Frontend/src/sections/api.js`:

- Every function calls `apiFetch()` which attaches the JWT Bearer token automatically.
- On `401 Unauthorized`, the interceptor calls `POST /api/auth/token/refresh/` once and retries.
- On refresh failure, it clears cookies + localStorage and redirects to `/Login`.
- Backend snake_case responses are mapped to camelCase by normalizer functions (`normalizeRFQ`, `normalizeUser`, etc.).
- Status values are always snake_case (`'sent_to_purchases'`). Use `STATUS` from `src/constants/rfqStatus.js` for comparisons and `STATUS_LABEL` for display.

---

## Related docs

| Doc | Contents |
|---|---|
| [`API_RISKS.md`](API_RISKS.md) | Complete frontend↔backend call audit with gap analysis |
| [`FRONTEND_API_CONTRACT.md`](FRONTEND_API_CONTRACT.md) | Full endpoint contract: callers, triggers, request/response shapes |
| [`../backend/API_ROUTES.md`](../backend/API_ROUTES.md) | Backend endpoint reference |
| [`../backend/README.md`](../backend/README.md) | Backend setup and run instructions |
