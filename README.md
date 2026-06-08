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

## RFQ Lifecycle

Each RFQ has a `status` CharField on `RFQ_Base` that drives the workflow. The `submitted_for_review` flag on `RFQ_Base` distinguishes "in progress" from "pending admin action" within `industrialization_draft` and `purchases_draft`.

| Status | Who acts | Description |
|--------|---------|-------------|
| `industrialization_draft` | Ind. engineer + Ind_Admin | Working draft or awaiting admin review |
| `sent_to_purchases` | Purchases team | Ind_Admin approved — in Purchases inbox |
| `purchases_draft` | Purchases team | Assigning suppliers |
| `sent_to_suppliers` | Supplier portal | Published to suppliers |
| `waiting_for_suppliers` | Purchases analysis | At least one supplier responded; others can still submit |
| `supplier_selected` | Purchases_Admin | Winner chosen, pending final award |
| `rfq_closed` | Read-only | Final award confirmed, frozen |

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
| `POST` | `/api/auth/token/refresh/` | Refresh an expired access token |
| `GET` | `/api/rfqs/lista/` | List RFQs filtered by role and view type |
| `GET` | `/api/rfqs/<pk>/` | Full RFQ detail (all three stages) |
| `POST` | `/api/rfq/crear/` | Create a new RFQ |
| `PUT` | `/api/rfq/<pk>/editar/` | Edit an existing RFQ |
| `PATCH` | `/api/rfqs/<pk>/revision-ind/` | Industrialization Admin: approve/reject |
| `PUT` | `/api/rfqs/<pk>/asignar-proveedores/` | Assign supplier candidates (`is_draft` param controls submit-for-review vs save-as-draft) |
| `PATCH` | `/api/rfqs/<pk>/aprobar-proveedores/` | Purchases Admin: approve supplier list |
| `POST` | `/api/rfqs/<pk>/cotizar/` | Supplier: submit quote |
| `GET` | `/api/rfqs/<pk>/comparativa/` | Side-by-side quote comparison |
| `PATCH` | `/api/rfqs/<pk>/seleccionar-proveedor/` | Select winning supplier |
| `PATCH` | `/api/rfqs/<pk>/fallo-gerencial/` | Final manager award decision |
| `GET` | `/api/dashboard/industrializacion/` | Ind. team KPI dashboard |
| `GET` | `/api/dashboard/compras/` | Purchases team KPI dashboard |
| `GET` | `/api/dashboard/proveedor/` | Supplier workload dashboard |

---

## Known Issues

See [`backend/ARCHITECTURAL_RISKS.md`](backend/ARCHITECTURAL_RISKS.md) and [`frontend/API_RISKS.md`](frontend/API_RISKS.md) for full details.

Open items as of 2026-06-04:

- **No test coverage**: `api/tests.py` is empty. No automated tests for business logic, state machine transitions, or permission checks.
- **`completionPercentage` always 0 in RFQ detail page**: `normalizeRFQDetail` hardcodes 0. `RFQDetailView` does not include `completion_percentage`. Fix: call `getRFQProgress(id)` inside the detail view or client-side in `RFQDetails.jsx`.
- **Notifications never emitted**: The `Notificacion` table is always empty — no state transition creates notification records.
- **Supplier PATCH/DELETE requires only `IsPurchasesUser`**: Any Purchases user can delete a supplier. Should require `IsPurchasesAdmin`.
- **`EditarRFQView` missing backend guard for `sent_to_purchases`**: `submitRFQForReview` could accidentally re-draft an RFQ already in Purchases. Guarded client-side in ActionBar only.

Recently resolved (2026-06-04): 401 on RFQ creation, supplier quote 500 errors (die `Last_change` NOT NULL, null FloatFields), `UploadCard` never firing `onFileUpload`, supplier seeing customer name, password change in user profile, `Submit Final Quote` visibility, post-quote navigation to All RFQs.
