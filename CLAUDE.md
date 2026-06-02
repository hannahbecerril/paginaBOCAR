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

## RFQ State Machine

Each RFQ has a `status` CharField on `RFQ_Base` (migration 0008 replaced the old `lev1`–`lev9` boolean flags). The `submitted_for_review` flag distinguishes "in progress" from "pending admin action" within `industrialization_draft` and `purchases_draft`.

| Status | Who acts | Description |
|--------|---------|-------------|
| `industrialization_draft` | Ind. engineer + Ind_Admin | Working draft; `submitted_for_review=True` = in Ind_Admin inbox |
| `sent_to_purchases` | Purchases team | Ind_Admin approved — appears in Purchases inbox |
| `purchases_draft` | Purchases team | Assigning suppliers; `submitted_for_review=True` = in Purchases_Admin inbox |
| `sent_to_suppliers` | Supplier portal | Published to suppliers, no responses yet |
| `waiting_for_suppliers` | Purchases analysis | At least one supplier responded; others can still submit |
| `supplier_selected` | Purchases_Admin | Winner chosen, pending final award |
| `rfq_closed` | Read-only | Final award confirmed, frozen |

Use the `STATUS` constants from `backend/api/constants.py` (backend) or `frontend/src/constants/rfqStatus.js` (frontend) — never raw strings.

State transitions are tracked in `RFQ_Tracking` (timestamps per status per RFQ) — used by the dashboard KPI calculations.

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

All critical bugs from the original codebase have been resolved (migrations 0008–0012). See `backend/ARCHITECTURAL_RISKS.md` for the full resolution history.

Remaining open items (as of 2026-06-02):

- **No test coverage**: `api/tests.py` is empty. See `ARCHITECTURAL_RISKS.md §10`.
- **`completionPercentage` always 0 in RFQ detail page**: `normalizeRFQDetail` in `api.js` hardcodes 0. `RFQDetailView` does not include `completion_percentage` in its response. Fix: inject it in `RFQDetailView.get()` or call `getRFQProgress(id)` client-side. See `frontend/API_RISKS.md §14-A`.
- **Notifications never emitted**: No state transition view creates `Notificacion` records — the notification inbox is always empty. See `frontend/API_RISKS.md §14-E`.
- **`PROVEEDOR_SECRET_KEY` defaults to `'clave_secreta'`**: The dev default is still a trivially guessable string. Set `PROVEEDOR_SECRET_KEY` via environment variable in any non-local deployment. See `backend/ARCHITECTURAL_RISKS.md §7`.
- **Supplier PATCH/DELETE requires only `IsPurchasesUser`**: Any Purchases user can delete a supplier. Recommend raising to `IsPurchasesAdmin`. See `frontend/API_RISKS.md §14-H`.
- **`EditarRFQView` missing backend guard for `sent_to_purchases`**: `submitRFQForReview` could accidentally re-draft an RFQ already in Purchases. ActionBar guards this client-side; the backend only blocks at `sent_to_suppliers` and beyond. See `frontend/API_RISKS.md §14-G`.

---

## API Documentation

Full endpoint reference with request/response schemas: [`backend/API_ROUTES.md`](backend/API_ROUTES.md)
