# BOCAR — Procurement Automation Platform

Web application for automating the RFQ (Request for Quote) procurement lifecycle at BOCAR Group. Manages tooling requests (injection molds and stamping dies) from internal engineering through supplier quoting to final award.

---

## Architecture

Client-server application with a JSON REST API backend and a React SPA frontend.

- **Backend**: Django 5.2 + Django REST Framework, JWT authentication, SQLite (dev)
- **Frontend**: React + Vite (port 5173)
- **Auth**: `djangorestframework-simplejwt` — two separate login endpoints (internal staff vs. suppliers)
- **CORS**: `django-cors-headers` — allows `localhost:5173`

---

## Project Structure

```
paginaBOCAR/
├── backend/
│   ├── api/
│   │   ├── models/          # One file per model
│   │   ├── migrations/
│   │   ├── views.py         # All API views
│   │   ├── serializers.py
│   │   ├── permissions.py   # Custom DRF permission classes per role
│   │   └── middleware.py
│   ├── core/
│   │   ├── settings.py
│   │   └── urls.py          # Root URL configuration
│   ├── API_ROUTES.md        # Full endpoint reference
│   └── ARCHITECTURAL_RISKS.md  # Known bugs and design risks
├── frontend/
├── environment.yml
└── CLAUDE.md                # Developer reference (tech stack, roles, state machine)
```

---

## Requirements

- Python 3.11 + Conda / Miniconda
- Node.js + npm

---

## Setup

### Conda environment
```bash
conda env create -f environment.yml
conda activate tc3005b-bocar
```

### Backend
```bash
cd backend
python manage.py makemigrations
python manage.py migrate
python manage.py seed_users   # create default role accounts
python manage.py runserver
# → http://127.0.0.1:8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## Role System

Django Groups are used as roles. Six groups are defined:

| Group | Description |
|-------|-------------|
| `SuperAdmin` | Full system access |
| `Industrialization` | Create and edit RFQs |
| `Industrialization_Admin` | Approve/reject RFQs from the Ind. team |
| `Purchases` | Assign suppliers, analyze quotes |
| `Purchases_Admin` | Approve supplier lists and final awards |
| `Supplier` | Submit quotes for assigned RFQs |

---

## RFQ Lifecycle (9 Levels)

Each RFQ has a `Status_RFQ` record with boolean flags `lev1`–`lev9` that drive the workflow:

```
lev1 (created) → lev2 (Ind. draft) → lev3 (pending Ind. Admin approval)
                                          ↓
                                      lev4 (Purchases draft)
                                          ↓
                                      lev5 (pending Purchases Admin approval)
                                          ↓
                                      lev6 (published to suppliers)
                                          ↓
                                      lev7 (quote analysis)
                                          ↓
                                      lev8 (pending final award)
                                          ↓
                                      lev9 (awarded / closed)
```

State transitions are timestamped in `RFQ_Tracking` and used for dashboard KPI calculations.

---

## RFQ Types

Every RFQ has `type: "mold"` or `type: "die"`:

- **mold** → `MOLD_INFO_P1_I`, `MOLD_INFO_P2_I` (Ind. technical data) · `MOLD_COSTBR_P1_S`–`P5_S` (supplier quotes)
- **die** → `DIE_TRIM_I` (Ind. technical data) · `DIE_COSTBR_P1_S`–`P4_S` (supplier quotes)

---

## API

Full endpoint reference with request/response schemas: [`backend/API_ROUTES.md`](backend/API_ROUTES.md)

Key endpoints:

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/login/interno/` | Login for internal staff |
| `POST` | `/api/auth/login/proveedor/` | Login for suppliers (requires HMAC-SHA256 header) |
| `GET` | `/api/rfqs/lista/` | List RFQs filtered by role and view type |
| `POST` | `/rfq/crear/` | Create a new RFQ |
| `PUT` | `/api/rfq/<pk>/editar/` | Edit an existing RFQ |
| `PATCH` | `/api/rfq/<pk>/revision-ind/` | Industrialization Admin: approve/reject |
| `PUT` | `/rfq/<pk>/asignar-proveedores/` | Assign supplier candidates |
| `PATCH` | `/api/rfq/<pk>/aprobar-proveedores/` | Purchases Admin: approve supplier list |
| `POST` | `/api/rfq/<pk>/cotizar/` | Supplier: submit quote |
| `GET` | `/rfq/<pk>/comparativa/` | Side-by-side quote comparison |
| `PATCH` | `/api/rfq/<pk>/seleccionar-proveedor/` | Select winning supplier |
| `PATCH` | `/api/rfq/<pk>/fallo-gerencial/` | Final manager award decision |
| `GET` | `/api/dashboard/industrializacion/` | Ind. team KPI dashboard |
| `GET` | `/api/dashboard/compras/` | Purchases team KPI dashboard |
| `GET` | `/api/dashboard/proveedor/` | Supplier workload dashboard |

> Several routes are missing the `/api/` prefix — see `backend/API_ROUTES.md` Known Issues.

---

## Known Issues

See [`backend/ARCHITECTURAL_RISKS.md`](backend/ARCHITECTURAL_RISKS.md) for a full list. Critical items:

- **Server will not start**: `RFQAprobadosListView` is imported in `core/urls.py` but not defined in `views.py`.
- **Supplier assignment is broken**: `ProveedorListView` returns Django User IDs but the assignment view queries a separate `Suppliers` table with independent IDs.
- **`FalloFinalGerencialView` crashes** on the "aprobar" path with `AttributeError` (references a non-existent `winning_supplier` field).
- **Industrialization KPI always returns 0**: `ReviewRFQIndView` never writes to `RFQ_Tracking`.
