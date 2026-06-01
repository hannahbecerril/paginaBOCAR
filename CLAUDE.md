# BOCAR — Procurement Automation Platform

Web application for automating the RFQ (Request for Quote) procurement lifecycle at BOCAR. Manages tooling requests (molds and dies) from internal engineering through supplier quoting to final award.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Django 5.2 + Django REST Framework |
| Auth | JWT via `djangorestframework-simplejwt` |
| Database | SQLite (dev) — `backend/db.sqlite3` |
| Frontend | React + Vite (port 5173) |
| CORS | `django-cors-headers` — allows `localhost:5173` |

---

## Running the Project

### Backend
```bash
cd backend
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
# → http://127.0.0.1:8000
```

Seed default users (if the command exists):
```bash
python manage.py seed_users
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### Conda environment
```bash
conda env create -f environment.yml
conda activate tc3005b-bocar
```

---

## Project Structure

```
paginaBOCAR/
├── backend/
│   ├── api/
│   │   ├── models/          # One file per model (base, mold_info_i, die_trim_i, etc.)
│   │   ├── migrations/
│   │   ├── views.py          # All API views
│   │   ├── serializers.py
│   │   ├── permissions.py    # Custom permission classes per role
│   │   └── middleware.py
│   ├── core/
│   │   ├── settings.py
│   │   └── urls.py           # Root URL configuration
│   └── API_ROUTES.md         # Full API documentation
├── frontend/
└── CLAUDE.md
```

---

## Role / Permission System

Django Groups are used as roles. Custom permission classes live in `backend/api/permissions.py`.

| Class | Allowed Groups |
|-------|---------------|
| `IsSuperAdmin` | `SuperAdmin` |
| `IsIndAdmin` | `Industrialization_Admin`, `SuperAdmin` |
| `IsIndUser` | `Industrialization`, `Industrialization_Admin`, `SuperAdmin` |
| `IsPurchasesAdmin` | `Purchases_Admin`, `SuperAdmin` |
| `IsPurchasesUser` | `Purchases`, `Purchases_Admin`, `SuperAdmin` |
| `IsSupplier` | `Supplier` |

---

## RFQ State Machine (9 Levels)

Each RFQ has a corresponding `Status_RFQ` record with boolean fields `lev1`–`lev9`. Only one level should be `True` at a time (except `lev1` which stays `True`).

```
lev1 → lev2 (draft) → lev3 (pending Ind. approval)
     ↗                ↓
                   lev4 (Purchases inbox)
                      ↓
                   lev5 (waiting Purchases_Admin approval)
                      ↓
                   lev6 (published to suppliers)
                      ↓
                   lev7 (quote analysis)
                      ↓
                   lev8 (pending final award)
                      ↓
                   lev9 (awarded / closed)
```

State transitions are tracked in `RFQ_Tracking` (timestamps per level per RFQ) — used by the dashboard KPI calculations.

---

## RFQ Types

Every RFQ has a `type` field: `"mold"` or `"die"`. This controls which technical detail tables are populated:

- **mold**: `MOLD_INFO_P1_I`, `MOLD_INFO_P2_I` (Industrialization) · `MOLD_COSTBR_P1_S`–`P5_S` (Supplier quotes) · `MOLD_COSTBR_I` (internal cost breakdown)
- **die**: `DIE_TRIM_I` (Industrialization) · `DIE_COSTBR_P1_S`–`P4_S` (Supplier quotes) · `DIE_COSTBR_I` (internal cost breakdown)

---

## Supplier Login — HMAC Signature

The supplier login endpoint (`POST /api/auth/login/proveedor/`) requires an `X-Signature` header. The frontend must compute:

```js
const payload = JSON.stringify({ password, username }, Object.keys({ password, username }).sort());
const signature = hmacSHA256(payload, PROVEEDOR_SECRET_KEY).toString();
// Header: X-Signature: <signature>
```

The secret key is `PROVEEDOR_SECRET_KEY` in `backend/core/settings.py`.

---

## Known Issues

- **`RFQAprobadosListView` missing**: imported in `core/urls.py` line 7 but not defined in `api/views.py`. The server will fail to start unless this is fixed. The functional replacement is `RFQClasificadoListView` at `GET /api/rfqs/lista/`.
- **Inconsistent URL prefixes**: several routes are missing the `/api/` prefix — see `backend/API_ROUTES.md` for the full list.
- **`db.sqlite3` is committed**: should be in `.gitignore`.
- **`FalloFinalGerencialView` AttributeError**: `views.py:248,266` reference `asignacion.winning_supplier` — this field was removed in migration 0007 (replaced by `is_winner`). The "aprobar" path crashes; the "rechazar" path silently does nothing. See `ARCHITECTURAL_RISKS.md §3.2`.
- **`ReviewRFQIndView` missing tracking**: `views.py:978` never calls `registrar_tracking_rfq`, so lev2/lev4 transitions are never recorded in `RFQ_Tracking`. The Industrialization dashboard KPI (`lead_time_tecnico_dias`) always returns 0.
- **Supplier identity mismatch**: `ProveedorListView` returns Django `User` IDs, but `AssignSuppliersRFQView` and `BuzonProveedorListView` look up by `Suppliers` table IDs — two unrelated tables. Supplier assignment and the supplier inbox are effectively broken. See `ARCHITECTURAL_RISKS.md §3.5`.
- **Mold quote P2–P5 broken (migration desync)**: Migration 0007 removed `Elaborated_by` from `MOLD_COSTBR_P2_S`–`P5_S`, but `CotizacionProveedorView` and `ComparativaCotizacionesView` still use it for ORM lookups → `FieldError` → 500. Only mold part 1 and all die parts work. See `ARCHITECTURAL_RISKS.md §3.6`.
- **`PROVEEDOR_SECRET_KEY = 'clave_secreta'`**: trivially guessable secret committed in plain text in `settings.py` — the HMAC supplier auth can be forged by anyone with repo access. See `ARCHITECTURAL_RISKS.md §7.1`.

---

## API Documentation

Full endpoint reference with request/response schemas: [`backend/API_ROUTES.md`](backend/API_ROUTES.md)
