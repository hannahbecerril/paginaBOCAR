# Architectural Risks — BOCAR Backend

> **Legend:** ✅ Resolved · 🔴 Still open

---

## 1. Server Startup

### ✅ 1.1 `RFQAprobadosListView` imported but never defined
Removed from `core/urls.py`. `RFQClasificadoListView` at `GET /api/rfqs/lista/` is the replacement.

### ✅ 1.2 Inconsistent `/api/` URL prefixes
All routes now use the `/api/` prefix. The broken `/rfqs/pendientes-compras/` route was removed — its function is covered by `GET /api/rfqs/lista/?vista=draft`.

---

## 2. State Machine

### ✅ 2.0 Migration history (through 0013)

| Migration | What it did |
|-----------|-------------|
| 0008 | Added `RFQ_Base.status`, `submitted_for_review`, `RFQ_Assignment.has_responded`; changed `RFQ_Assignment.supplier` FK to `User`; restored `Elaborated_by` on mold P2–P5 |
| 0009 | Backfilled `RFQ_Base.status` from `Status_RFQ` booleans; cleared stale supplier assignments; renamed `RFQ_Tracking.nivel_alcanzado` strings from `levN` to named values |
| 0010 | Dropped `Status_RFQ` table; fixed `nivel_alcanzado` max_length (10→50) + added `choices`; changed `MOLD_COSTBR_I`/`DIE_COSTBR_I` supplier FK to `User`; added `DIE_COSTBR_P1_S.Company` as a proper CharField |
| 0011 | Added `RFQ_Base.category` + `priority`; added `Archivo.id_rfq` FK; created `Notificacion` model |
| 0012 | Added `Archivo.file_type` (CharField) + `is3d` (BooleanField); added `RFQ_Base.response_deadline` (DateField), `shipping_terms` (CharField), `quality_requirements` (TextField) |
| 0013 | Made `DIE_COSTBR_P1_S.Last_change` nullable (`null=True`) — it was `DateField(blank=True)` without `null=True`, causing `NOT NULL constraint failed` on every die quote save since the frontend never sends this field |

### ✅ 2.1 Status values (live)

| Status | Who acts | Description |
|--------|---------|-------------|
| `industrialization_draft` | Ind. engineer + Ind_Admin | Working draft or awaiting admin review. `submitted_for_review=True` = in admin inbox. |
| `sent_to_purchases` | Purchases | Ind_Admin confirmed — appears in Purchases inbox. |
| `purchases_draft` | Purchases | Assigning suppliers. `submitted_for_review=True` = in Purchases_Admin inbox. |
| `sent_to_suppliers` | Supplier portal | Purchases_Admin confirmed — published to suppliers. |
| `waiting_for_suppliers` | Purchases analysis | At least 1 supplier submitted. Others can still submit. |
| `supplier_selected` | Purchases_Admin | Winner chosen, pending final award. |
| `rfq_closed` | Read-only | Final award confirmed. Frozen. |

Per-supplier display (derived from `RFQ_Assignment`):

| Display | Condition |
|---------|-----------|
| `supplier_draft` | `status='sent_to_suppliers'` AND `has_responded=False` |
| `supplier_response` | `has_responded=True` |
| `selected` | `status='supplier_selected'` AND `is_winner=True` |
| `not_selected` | `status='supplier_selected'` AND `is_winner=False` |

---

## 3. Business Logic

### ✅ 3.9 Supplier quote submission failed with 500 (die RFQs)

Two bugs in `CotizacionProveedorView`:

1. **`Last_change` NOT NULL constraint** — `DIE_COSTBR_P1_S.Last_change` was a `DateField(blank=True)` without `null=True`. The frontend never sends this field, so every CREATE failed. Fixed by migration 0013 (makes the column nullable).

2. **`None` float values caused 500 on second submission** — when a supplier reopened a die RFQ after saving a draft, the backend loaded the saved `p1` record (which included `Last_change: null`, `id`, `id_rfq_id`, etc.). The frontend sent these back; `_clean_cost()` converted `Last_change: null → 0`, which Django then tried to store in a `DateField` → `TypeError`. Fix: `_clean_cost()` now strips a fixed `_DB_KEYS` set (`id`, `id_rfq_id`, `supplier_id`, `supplier`, `Last_change`, `Last_edit_by`, `Last_edited_by`, `Elaborated_by`) and converts remaining `null → 0` for numeric columns only. `Elaborated_by` is always set server-side from the authenticated user, preventing spoofing.

### ✅ 3.10 Password change not supported for existing users/suppliers

`UsuarioDetailView.patch` and `ProveedorDetailView.patch` did not handle a `password` field. Frontend `UserDetails.jsx` now sends `password` when the edit field is filled. Backend calls `user.set_password(data['password'])` before saving. `ProveedorDetailView.patch` also now accepts `username` in addition to the existing editable fields.

### ✅ 3.1 First supplier locked out all others
`CotizacionProveedorView` now accepts submissions when `status` is `sent_to_suppliers` **or** `waiting_for_suppliers`. Late-responding suppliers are no longer blocked.

### ✅ 3.2 `FalloFinalGerencialView` three compounding bugs
- Query now filtered by `is_winner=True` — no more `MultipleObjectsReturned`.
- Response uses `asignacion.supplier.username` — no more `AttributeError`.
- Rejection sets `asignacion.is_winner = False` — DB updated correctly.

### ✅ 3.3 `ReviewRFQIndView` missing tracking + wrong permission
Uses `permission_classes = [IsAuthenticated, IsIndAdmin]`. Both approve and reject paths call `registrar_tracking_rfq`. Industrialization dashboard KPI now accumulates correct data.

### ✅ 3.4 Supplier assignment deletion orphaned internal cost records
`AssignSuppliersRFQView` now deletes `MOLD_COSTBR_I` / `DIE_COSTBR_I` rows before re-creating assignments. A fresh worksheet is created for each new selection cycle.

### ✅ 3.7 `AssignSuppliersRFQView` always forced `submitted_for_review=True`
`AssignSuppliersRFQView` now accepts an `is_draft` boolean in the request body.
- `is_draft=true` → sets `submitted_for_review=False`, allows empty `proveedores_ids` (save without suppliers)
- `is_draft=false` (default) → sets `submitted_for_review=True`, requires at least one supplier
Response now includes `submitted_for_review` so the frontend can confirm the saved state.

### ✅ 3.8 `RFQClasificadoListView` `?vista=draft` for Industrialization filtered by creator
The `draft` view for Industrialization users no longer filters by `created_by=user.username`. All `industrialization_draft` RFQs are visible to every Industrialization user, enabling team-wide draft management.

### ✅ 3.5 `Suppliers` table / Django `User` table identity mismatch
`RFQ_Assignment.supplier` is now a FK to Django `User`. `AssignSuppliersRFQView` looks up by `User.id`. Stale rows cleared in migration 0009.

### ✅ 3.6 `Elaborated_by` desync for mold cost P2–P5
`Elaborated_by` restored to `MOLD_COSTBR_P2–P5_S` in migration 0008. All mold and die quote parts are functional.

---

## 4. Data Integrity

### ✅ 4.1 `Status_RFQ` table
Dropped in migration 0010. Model class and admin registration removed from code.

### ✅ 4.2 `RFQ_Tracking.nivel_alcanzado` field issues
Two fixes in migration 0010:
- `max_length` increased from 10 → 50 (the longest value, `'industrialization_draft'`, is 24 chars — the old limit would have silently truncated in any database with strict VARCHAR enforcement).
- `choices=STATUS_CHOICES` added — invalid strings now raise `ValidationError` before reaching the database.

### ✅ 4.3 `db.sqlite3` committed to the repository
`db.sqlite3` is already in `.gitignore` at the project root.

### ✅ 4.4 Model definition bugs

- **`DIE_COSTBR_I` duplicate ForeignKey** — dead first declaration removed from `die_costbr_i.py`.
- **`DIE_COSTBR_P1_S.Company = models`** — replaced with `models.CharField(max_length=255, blank=True)`. Column added via migration 0010.
- **`DIE_TRIM_S` invalid field parameters** — `FloatField(max_length=255)` cleaned to `FloatField(null=True, blank=True)`; `CharField(default=False)` cleaned to `CharField(max_length=50, blank=True)`. These are unused models so no migration was required for the cosmetic changes.

### ✅ 4.5 `MOLD_COSTBR_I` / `DIE_COSTBR_I` supplier FK pointed to `Suppliers` table
Both changed to FK → Django `User` in migration 0010. All existing rows had `supplier=NULL` so no data was lost.

---

## 5. Permission System

### ✅ 5.1 + 5.2 `ReviewRFQIndView` permission inconsistency
`permission_classes = [IsAuthenticated, IsIndAdmin]` — consistent with every other view, no manual group check.

### ✅ 5.3 `ListarUsuariosView` was SuperAdmin-only, blocking Ind/Purchases users
Lowered to `IsInternalUser` (any non-Supplier authenticated staff). Write operations (create/patch/delete user) remain `IsSuperAdmin`. The `IsInternalUser` permission class was added to `permissions.py`.

### ✅ 5.4 `ListarUsuariosView` returned Supplier accounts in the internal user list
`get_queryset()` now excludes users in the `Supplier` group via `.exclude(groups__name='Supplier')`. Purchases and Industrialization Users pages show only internal staff.

---

## 6. Dead / Unused Models

The following models exist in the schema but are not referenced in any active view. They carry no runtime risk but should be cleaned up when time allows:

| Model | File | Status |
|-------|------|--------|
| `Users_Permissions` | `base.py` | Unused — superseded by Django Groups |
| `Attachments` | `base.py` | Unused — active file handling uses `Archivo` |
| `Suppliers` | `base.py` | Unused in views — kept because some cost breakdown models still have an unused FK pointing to it |
| `MOLD_INFO_P1_S` / `MOLD_INFO_P2_S` | `mold_info_s.py` | Unused — no view reads or writes these |
| `MOLD_CAVITIES_P1–P3_S` | `mold_cavities_s.py` | Unused — no view references these |
| `DIE_TRIM_S` | `die_trim_s.py` | Unused — no view references this |

**`Bitacora`** is active — written to by `RegistroBitacoraMiddleware` on every `/api/` request — but has no read endpoint. Audit data is collected but inaccessible through the API.

---

## 7. Security Configuration

### ✅ 7.1 + 7.2 + 7.3 Secrets and debug mode
`SECRET_KEY`, `PROVEEDOR_SECRET_KEY`, `DEBUG`, and `ALLOWED_HOSTS` are now read from environment variables via `os.environ.get()`, with the insecure dev defaults as fallbacks. A `.env.example` file documents the required variables. In development the server runs identically to before. In production, set real values in environment variables — never commit them.

### ✅ 7.4 `dj_rest_auth` installed but unused
Removed from `INSTALLED_APPS` and its `REST_AUTH` config block removed from `settings.py`. The undocumented session-auth surface it was exposing no longer exists. `rest_framework.authtoken` and `django.contrib.sites` are kept because they have applied migration tables in the database.

---

## 8. Frontend Integration — Added Endpoints

The following endpoints were added specifically to close gaps identified in `frontend/API_RISKS.md`:

### ✅ 8.1 `GET /api/rfqs/{pk}/progreso/` — RFQ completion percentage
`RFQProgresoView` computes what percentage of the required technical spec fields are filled for a given draft RFQ.
- **Mold** required fields: `DESC`, `CUST`, `No_CAV`, `PPY`, `TT`, `ELAB`, `Smach`, `DTQ` (8 fields from `MOLD_INFO_P1_I`)
- **Die** required fields: `DESC`, `CUST`, `Press`, `No_cavities`, `PPY`, `PT_No`, `DTQB` (7 fields from `DIE_TRIM_I`)
- Response: `{ percentage, filled, total, filled_fields, missing_fields }`
- The same calculation is also injected into every list item via `_inject_detalles()` as `completion_percentage`.

### ✅ 8.2 `PATCH /api/rfqs/{pk}/especificaciones/` — Spec save without status side-effects
`GuardarEspecificacionesView` updates `MOLD_INFO_P1_I`/`MOLD_INFO_P2_I` (mold) or `DIE_TRIM_I` (die) without touching `RFQ_Base.status`. Blocked at `sent_to_suppliers` and beyond.
Previous `EditarRFQView` reset `status` to `industrialization_draft` as a side-effect, which would regress RFQs that were already in Purchases.

### ✅ 8.3 `PATCH /api/rfqs/{pk}/compras-metadata/` — Purchases metadata without status regression
`GuardarMetadataComprasView` updates `response_deadline`, `shipping_terms`, `quality_requirements` on `RFQ_Base` without changing `status` or `submitted_for_review`.
Fields were added to `RFQ_Base` in migration 0012.

### ✅ 8.4 Document endpoints now return English field names + metadata
`RFQDocumentListView` returns `name`, `date`, `type`, `is3D` (was `nombre`, `fecha_subida`). `file_type` and `is3d` columns added to `Archivo` in migration 0012. Upload accepts `type` field from multipart form.

### ✅ 8.5 `NotificacionSerializer` renamed to English
All serializer output fields renamed: `titulo→title`, `mensaje→message`, `leida→read`, `fecha→date`, `category_id→categoryId`, `rfq.id_rfq→rfqId`. `NotificacionListView.get()` now wraps output in `{ "notifications": [...] }`.

### ✅ 8.6 Dashboard endpoints extended with time-series data
Both `DashboardIndustrializacionView` and `DashboardComprasView` now:
- Accept `?range=week|month|quarter`
- Return `statusChangeData` and `rfqDistributionData` matching the frontend chart component shapes
- The `declined` series in both dashboards is always 0 (no rejection event in `RFQ_Tracking`)

---

## 10. Test Coverage

🔴 `api/tests.py` is still empty. There are no automated tests for any business logic, state machine transitions, permission checks, or KPI calculations.

Minimum recommended coverage:
- Permission tests: each role on each endpoint (unauthorized → 403, authorized → 2xx).
- State machine: correct `status` after each view call.
- `registrar_tracking_rfq` output verified by KPI calculation assertions.
- Supplier submission guard: accepted in `waiting_for_suppliers`, rejected in `rfq_closed`.
- `submitted_for_review` flag set/cleared correctly by create, edit, review, and reject views.
