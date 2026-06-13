# BOCAR Backend

Django REST Framework API for the BOCAR procurement automation platform.
Base URL: `http://127.0.0.1:8000`

> **Python environment:** managed with **Conda** (`tc3005b-bocar`).
> Do not use `venv`, `virtualenv`, or bare `pip` — always activate the conda environment first.

---

## Subsequent runs (daily)

```bash
conda activate tc3005b-bocar
cd backend
python manage.py runserver
# → http://127.0.0.1:8000
```

That's all for every normal run — no migrations, no installs needed unless teammates pushed schema changes.

### If new migrations were pushed

```bash
conda activate tc3005b-bocar
cd backend
python manage.py migrate
```

### If `environment.yml` was updated with new packages

```bash
conda env update -f environment.yml --prune
```

---

## First-time setup

Follow these steps **once** on a fresh clone.

### 1. Create the conda environment

The `environment.yml` lives at the **project root** (one level above `backend/`):

```bash
# From the project root (paginaBOCAR/)
conda env create -f environment.yml
conda activate tc3005b-bocar
```

All Python dependencies are declared in that file. Do not install packages with plain `pip` outside of it.

### 2. Configure runtime secrets (optional for local dev)

The backend reads secrets from shell environment variables. For local development **no extra setup is needed** — `settings.py` has safe dev defaults built in.

To override a value (e.g. rotate the HMAC key), set variables in your shell:

```bash
export DJANGO_SECRET_KEY="your-value"
export PROVEEDOR_SECRET_KEY="your-value"
export DJANGO_DEBUG="False"
export DJANGO_ALLOWED_HOSTS="127.0.0.1,localhost"
```

See [`.env.example`](.env.example) for the full list. These are runtime values — not the Python environment.

### 3. Apply all database migrations

```bash
cd backend
python manage.py migrate
```

Creates `backend/db.sqlite3` and applies migrations 0001 → 0013 in order.

Current migration history:

| Migration | Key changes |
|---|---|
| 0001–0007 | Initial schema, Bitacora, Status_RFQ, mold/die models |
| 0008 | Added `RFQ_Base.status` CharField, `submitted_for_review`, `RFQ_Assignment.has_responded`, restored `Elaborated_by` on mold P2–P5 |
| 0009 | Backfilled `status` from old boolean flags; renamed `RFQ_Tracking` level strings |
| 0010 | Dropped `Status_RFQ` table; fixed FK targets; added `DIE_COSTBR_P1_S.Company` |
| 0011 | Added `RFQ_Base.category` + `priority`; added `Archivo.id_rfq` FK; created `Notificacion` model |
| 0012 | Added `Archivo.file_type` + `is3d`; added `RFQ_Base.response_deadline`, `shipping_terms`, `quality_requirements` |
| 0013 | Made `DIE_COSTBR_P1_S.Last_change` nullable; fixes NOT NULL constraint on all die quote saves |

### 4. Seed default users and roles

```bash
cd backend
python manage.py seed_users
```

Creates six Django Groups and one test account per role:

| Username | Password | Role |
|---|---|---|
| `superadmin` | `admin1234` | SuperAdmin |
| `ind_user` | `ind1234` | Industrialization |
| `ind_admin` | `ind1234` | Industrialization_Admin |
| `purchases_user` | `purchases1234` | Purchases |
| `purchases_admin` | `purchases1234` | Purchases_Admin |
| `supplier_user` | `supplier1234` | Supplier |

> Dev credentials only — do not use in production.

### 5. (Optional) Django admin superuser

```bash
python manage.py createsuperuser
```

Required only for access to `/admin/` with a custom account.

### 6. Start the server

```bash
python manage.py runserver
# → http://127.0.0.1:8000
```

---

## Project structure

```
backend/
├── api/
│   ├── constants.py              # STATUS class — all 7 RFQ status values + groupings
│   ├── permissions.py            # IsSuperAdmin, IsIndAdmin, IsIndUser,
│   │                             # IsPurchasesAdmin, IsPurchasesUser,
│   │                             # IsInternalUser, IsSupplier
│   ├── serializers.py            # DRF serializers (all field names in English)
│   ├── views.py                  # All API views
│   ├── middleware.py             # RegistroBitacoraMiddleware (audit log)
│   ├── admin.py
│   ├── models/
│   │   ├── base.py               # RFQ_Base, RFQ_Assignment, Suppliers (legacy)
│   │   ├── archivo.py            # Archivo (file_type, is3d added in 0012)
│   │   ├── tracking.py           # RFQ_Tracking
│   │   ├── notificacion.py       # Notificacion
│   │   ├── mold_info_i.py        # MOLD_INFO_P1_I, MOLD_INFO_P2_I
│   │   ├── mold_costbr_s.py      # MOLD_COSTBR_P1_S … P5_S
│   │   ├── mold_costbr_i.py      # MOLD_COSTBR_I
│   │   ├── die_trim_i.py         # DIE_TRIM_I
│   │   ├── die_costbr_p1_s.py … die_costbr_p4_s.py
│   │   └── die_costbr_i.py       # DIE_COSTBR_I
│   ├── migrations/               # 0001 → 0013
│   └── management/
│       └── commands/
│           └── seed_users.py
├── core/
│   ├── settings.py               # Reads secrets from os.environ; dev defaults built in
│   └── urls.py                   # All routes under /api/ (singular + plural aliases)
├── .env.example                  # Documents available environment variable overrides
├── API_ROUTES.md                 # Full endpoint reference
└── ARCHITECTURAL_RISKS.md        # Known risks and resolved issues
```

---

## Tech stack

| Layer | Technology |
|---|---|
| Python environment | Conda (`tc3005b-bocar`) |
| Framework | Django 5.2 + Django REST Framework |
| Auth | JWT via `djangorestframework-simplejwt` |
| Database | SQLite (dev) — `backend/db.sqlite3` |
| CORS | `django-cors-headers` — allows `localhost:5173` |
| Audit log | `RegistroBitacoraMiddleware` → `Bitacora` table (every `/api/` request) |

---

## Environment variable overrides

These are runtime secret values read by `settings.py` — not the Python environment. In development they have safe fallbacks so no configuration is required.

| Variable | Purpose | Dev default |
|---|---|---|
| `DJANGO_SECRET_KEY` | Signs JWT tokens, sessions, CSRF | Insecure placeholder |
| `PROVEEDOR_SECRET_KEY` | HMAC secret for supplier login (`X-Signature` header) | `clave_secreta` |
| `DJANGO_DEBUG` | Enables debug mode and full stack traces | `True` |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated hostnames allowed in production | *(empty — open in debug mode)* |

---

## API documentation

| Doc | Contents |
|---|---|
| [`API_ROUTES.md`](API_ROUTES.md) | Every endpoint: method, URL, permissions, request/response |
| [`ARCHITECTURAL_RISKS.md`](ARCHITECTURAL_RISKS.md) | Historical bugs, resolutions, open risks |
| [`../frontend/API_RISKS.md`](../frontend/API_RISKS.md) | Frontend↔backend call audit |
