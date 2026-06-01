# Architectural Risks — BOCAR Backend

---

## 1. Broken / Missing Functionality (Server Will Not Start)

### 1.1 `RFQAprobadosListView` imported but never defined
`core/urls.py:7` imports `RFQAprobadosListView` from `api.views`, but the class does not exist in `views.py`. Django resolves all imports at startup, so the development server **crashes before serving a single request**. The functional replacement already exists: `RFQClasificadoListView` at `GET /api/rfqs/lista/`.

### 1.2 Inconsistent `/api/` URL prefixes
Several routes in `core/urls.py` are missing the `/api/` prefix, making them unreachable from the frontend (which consistently uses `/api/`):

| Line | Registered path | Should be |
|------|----------------|-----------|
| 25 | `rfqs/pendientes-compras/` | `api/rfqs/pendientes-compras/` |
| 27 | `rfq/crear/` | `api/rfq/crear/` |
| 32 | `usuarios/proveedores/` | `api/usuarios/proveedores/` |
| 37 | `rfq/<pk>/asignar-proveedores/` | `api/rfq/<pk>/asignar-proveedores/` |
| 41 | `rfq/<pk>/comparativa/` | `api/rfq/<pk>/comparativa/` |

---

## 2. State Machine Redesign — Logical Risks

This section documents the risks and open decisions involved in moving from the current `lev1`–`lev9` boolean scheme to named statuses with clearer business semantics.

### 2.1 The proposed naming drops two real intermediate states

The proposed new statuses are:

```
Industrialization:  ind_draft  →  sent_to_purchases
Purchases:          purchases_draft  →  sent_to_suppliers
Suppliers:          supplier_draft  →  supplier_response
Complementary:      waiting_for_suppliers  →  supplier_selected  →  rfq_closed
```

This produces 8 (or 9 counting `created`) visible states, but the current machine has **two admin approval gates** that do not appear in the proposed list:

- **lev3** — the Ind engineer submits; the `Industrialization_Admin` must approve before it moves to Purchases.
- **lev5** — the Purchases user selects a supplier list; the `Purchases_Admin` must approve before it publishes to suppliers.

If those gates are collapsed into adjacent states, both admin roles lose their visible "inbox" — they would be approving something that looks indistinguishable from a regular draft. The approval action would still exist in the code, but the status would give no signal that the admin's attention is required.

### 2.2 Recommendation: preserve both gates, name them explicitly

A consistent 9-state naming (keeping the approval gates visible) would be:

| Level | Proposed name | Responsible |
|-------|--------------|-------------|
| lev1 | `created` | Auto on creation |
| lev2 | `ind_draft` | Industrialization engineer |
| lev3 | `pending_ind_approval` | Industrialization_Admin |
| lev4 | `purchases_draft` | Purchases user |
| lev5 | `pending_purchases_approval` | Purchases_Admin |
| lev6 | `published_to_suppliers` | Suppliers (their "draft") |
| lev7 | `quotes_received` | Purchases user (analysis) |
| lev8 | `supplier_selected` | Purchases_Admin (final decision) |
| lev9 | `rfq_closed` | Read-only |

### 2.3 Symmetry argument for the Purchases gate

The original question was whether a `pending_ind_approval` equivalent should also apply to the Purchases workflow. The answer is yes, for the same structural reason:

- In the **Ind workflow**: a regular engineer (`Industrialization`) creates and edits; a manager (`Industrialization_Admin`) reviews and approves before it leaves the department.
- In the **Purchases workflow**: a regular buyer (`Purchases`) selects suppliers; a manager (`Purchases_Admin`) reviews and approves before it is published externally.

Both gates are protecting a **department boundary** (Ind→Purchases and Purchases→Supplier). Removing one but not the other would create an asymmetric trust model where one department's manager has a visible approval step and the other's does not. If lev3 is kept as `pending_ind_approval`, lev5 should be kept as `pending_purchases_approval` for the same reason.

### 2.4 `RFQ_Tracking` historical data risk

`RFQ_Tracking.nivel_alcanzado` stores the level string (e.g. `'lev6'`) as a plain `CharField` with no validation. The dashboard KPI calculations in `views.py:120` and `views.py:171` query this field by exact string match to compute timing between transitions. If the level strings are ever renamed as part of this redesign, existing rows in the database will retain the old strings, and all historical time calculations will silently return zero or incorrect values. Any renaming must include a data migration on this table.

---

## 3. Business Logic Bugs

### 3.1 First supplier to submit advances the entire RFQ — others are locked out

`CotizacionProveedorView.post` (`views.py:831`) transitions the RFQ from `lev6` → `lev7` the moment **one** supplier submits a non-draft quote. Every other invited supplier is then blocked by the `lev6` guard at `views.py:790`. There is no mechanism to wait for all assigned suppliers before moving to analysis. This means:

- Multi-supplier RFQs will almost always reach `lev7` with incomplete quotes.
- The comparative analysis in `ComparativaCotizacionesView` will silently include only the one supplier who responded in time.

### 3.2 `FalloFinalGerencialView` has three compounding bugs

**Bug A — `MultipleObjectsReturned` crash:** `views.py:220` calls `get_object_or_404(RFQ_Assignment, id_rfq=rfq_base)` without any further filter. When more than one supplier is assigned to the RFQ, Django's ORM raises `MultipleObjectsReturned` → 500 error. The query must be filtered by `is_winner=True`.

**Bug B — `AttributeError` on the "aprobar" path:** The response at `views.py:266` returns `asignacion.winning_supplier`, but the `RFQ_Assignment` model has no `winning_supplier` field — migration `0007` removed it and replaced it with `is_winner` (BooleanField), but `views.py` was never updated. On the "aprobar" path, `winning_supplier` is never set on the Python object, so accessing it raises `AttributeError` → 500 error.

**Bug C — Silent no-op on the "rechazar" path:** On rejection, `views.py:248` sets `asignacion.winning_supplier = None`. Since `winning_supplier` is no longer a model field, `save()` ignores it (no DB change). The winner flag is never actually cleared. The correct fix is `asignacion.is_winner = False`.

### 3.3 `ReviewRFQIndView` never records state transitions in `RFQ_Tracking`

Unlike every other state-transition view, `ReviewRFQIndView` (`views.py:978`) sets a local `nivel_alcanzado` variable to `'lev4'` or `'lev2'` but **never calls `registrar_tracking_rfq`**. The dashboard KPI in `DashboardIndustrializacionView` (`views.py:173`) queries `RFQ_Tracking` for `nivel_alcanzado='lev4'` entries to compute `lead_time_tecnico_dias`. Since no lev4 tracking rows are ever written for the Industrialization approval path, this KPI always returns 0.

### 3.4 Supplier assignment deletion can orphan initialized cost records

`AssignSuppliersRFQView.put` (`views.py:421`) calls `RFQ_Assignment.objects.filter(id_rfq=rfq).delete()` before re-creating assignments. The same view also initializes `MOLD_COSTBR_I` / `DIE_COSTBR_I` rows per supplier. If `Purchases_Admin` rejects the list (lev5 → lev4) and the buyer re-submits with a different selection, the assignment rows are deleted but the cost breakdown records they reference are not — they are orphaned in the database with no `RFQ_Assignment` parent to point to.

### 3.5 `Suppliers` table and Django `User` table are used interchangeably but have independent IDs

The system has two separate representations of a supplier:

- **`Suppliers` model** (`base.py:74`) — a custom table with its own `id` primary key, `name`, `email`, `phone`.
- **Django `User` model** — used for authentication. Suppliers log in through `LoginProveedorView` as `User` records in the `Supplier` group.

These tables are not linked. The following mismatches exist:

| View | Table used | What it expects |
|------|-----------|-----------------|
| `ProveedorListView` (list suppliers) | Django `User` | Returns `User.id` as the supplier ID |
| `AssignSuppliersRFQView` (assign suppliers) | `Suppliers` table | Expects `Suppliers.id` from `proveedores_ids` |
| `BuzonProveedorListView` (supplier inbox) | `RFQ_Assignment.supplier_id` (→ `Suppliers.id`) | Uses `request.user.id` (Django `User.id`) |
| `DashboardProveedorView` | `RFQ_Assignment.supplier__email` (→ `Suppliers.email`) | Matches by email against Django User's email |

In practice: the frontend receives Django User IDs from the list endpoint, sends them to the assignment endpoint which looks them up in the `Suppliers` table — a completely different set of IDs. Assignments will either fail validation (`proveedores_validos` returns empty) or silently reference the wrong supplier record. The supplier's own inbox and dashboard are similarly broken.

### 3.6 Migration desync: `Elaborated_by` removed from mold cost models P2–P5, views never updated

Migration `0007` (2026-05-21) removed `Elaborated_by` from `MOLD_COSTBR_P2_S`, `P3_S`, `P4_S`, and `P5_S`. The views were not updated. Two views are now broken for any mold RFQ that includes cost data beyond part 1:

**`CotizacionProveedorView`** (`views.py:807–813`): for each mold cost block, calls
```python
model.objects.update_or_create(
    id_rfq=rfq_base, Elaborated_by=proveedor_identificador, defaults=cost_data
)
```
`Elaborated_by` no longer exists on P2–P5, so this raises `FieldError: Cannot resolve keyword 'Elaborated_by'` → 500 error for any supplier submitting `mold_cost_p2` through `mold_cost_p5`.

**`ComparativaCotizacionesView`** (`views.py:876`): filters all mold parts by `Elaborated_by=username`. Raises the same `FieldError` for parts 2–5 whenever the comparative view is accessed for a mold RFQ.

The only functional paths currently are: mold cost part 1 (`MOLD_COSTBR_P1_S`, which still has `Elaborated_by`) and all die cost parts (`DIE_COSTBR_P1_S`–`P4_S`, which identify by `Elaborated_by` as a CharField).

---

## 4. Data Integrity Gaps

### 4.1 `Status_RFQ.id_rfq` is not a ForeignKey

`base.py:22` declares `id_rfq` as a plain `IntegerField`, not a `ForeignKey` to `RFQ_Base`. The database does not enforce referential integrity: a `Status_RFQ` row can reference an `RFQ_Base` that has been deleted, and an `RFQ_Base` can exist with no corresponding `Status_RFQ` row. Several views (`AssignSuppliersRFQView`, `CotizacionProveedorView`) use `get_or_create` to compensate for the second case, but the first case (dangling references) is unguarded.

### 4.2 `RFQ_Tracking.nivel_alcanzado` has no validation

The field is a free-form `CharField`. Anything can be stored — including typos that silently corrupt the dashboard timing calculations. It should be constrained with `choices` or at minimum validated in `registrar_tracking_rfq`.

### 4.3 `db.sqlite3` committed to the repository

The database file is tracked by git. Every branch merge that touches migration files risks producing an inconsistent SQLite file in the repository, and credentials or test data committed inside it are permanently visible in git history.

### 4.4 Model definition bugs

Several model files contain invalid or incorrect field definitions that create a gap between the Python model and the actual DB schema:

**`DIE_COSTBR_I` — duplicate ForeignKey** (`die_costbr_i.py:7,9`): `id_rfq` is declared twice. The first declaration (`related_name='die_costbr_i'`) is immediately overwritten by the second (`related_name='die_costbr_i_rfq'`). The migration created only the second. The first is dead code.

**`DIE_COSTBR_P1_S.Company`** (`die_costbr_p1_s.py:16`): `Company = models` assigns the `models` module itself as a class attribute instead of a Django field. Django's metaclass ignores it — no `Company` column exists in the database. The migration for this model confirms the field was never created.

**`DIE_TRIM_S` — invalid field parameters** (`die_trim_s.py`):
- `FloatField(max_length=255)` — `max_length` is not a valid kwarg for `FloatField` and is silently ignored.
- `CharField(default=False)` — `False` (a bool) is cast to the string `"False"` as the default value, which is semantically wrong for fields like `Curr_Trim_1`, `SUPP`, `SIGN`, etc.

---

## 5. Permission Inconsistency

### 5.1 `IsIndAdmin` is defined but not used where it matters

`permissions.py:10` defines `IsIndAdmin`, but `ReviewRFQIndView` (`views.py:983`) performs a **manual group check** instead of applying the permission class. If the allowed groups for `IsIndAdmin` are updated in `permissions.py`, `ReviewRFQIndView` will silently remain out of sync and either over-permit or over-restrict access.

### 5.2 `ReviewRFQIndView` permission class is `IsAuthenticated` only

The view gate is `permission_classes = [IsAuthenticated]` and then does a manual `if 'Industrialization_Admin' not in grupos_usuario` check inside the method body. This is inconsistent with every other view in the codebase and is easy to miss during a code review.

---

## 6. Dead / Unused Models

The following models are defined in `api/models/__init__.py` but are **not referenced in any view or serializer**. They add schema noise and carry migration overhead without serving any active functionality:

| Model | File | Notes |
|-------|------|-------|
| `Users_Permissions` | `base.py` | CRUD permission flags per user — superseded entirely by Django Groups |
| `Attachments` | `base.py` | File attachments ForeignKey to `RFQ_Base` — active file handling uses `Archivo` instead |
| `Suppliers` | `base.py` | Custom supplier table — authentication uses Django `User` (see Risk 3.5); never written to from any current view |
| `MOLD_INFO_P1_S` / `MOLD_INFO_P2_S` | `mold_info_s.py` | Supplier-side mold info sheets — no view reads or writes these |
| `MOLD_CAVITIES_P1_S` / `P2_S` / `P3_S` | `mold_cavities_s.py` | Cavity data for mold quotes — no view references these |
| `DIE_TRIM_S` | `die_trim_s.py` | Supplier-side die trim data — no view references this |

**Note on `Bitacora`:** This model IS active — `RegistroBitacoraMiddleware` (`middleware.py`) writes one row per `/api/` request, logging user, path, method, IP, and timestamp. However, there is no read endpoint to query audit log data through the API. The audit trail is collected but inaccessible from the frontend.

These dead models should either be wired into views and serializers or removed from the schema to avoid confusion about which tables are live.

---

## 7. Security Configuration Risks

### 7.1 `PROVEEDOR_SECRET_KEY` is a trivially guessable default committed in plain text

`core/settings.py:157` sets `PROVEEDOR_SECRET_KEY = 'clave_secreta'`. This key is the HMAC secret used in `LoginProveedorView` to validate supplier login requests. It is committed in the repository, visible to anyone with repo access, and its value (`clave_secreta`) is trivially guessable. Any attacker can compute a valid `X-Signature` for any supplier credentials they obtain, completely bypassing the cryptographic gate. The key must be moved to an environment variable and rotated.

### 7.2 `SECRET_KEY` is the insecure Django project default

`core/settings.py:28` retains the `django-insecure-` prefixed key generated at project creation. This key signs JWT tokens, session cookies, and CSRF tokens. It should be replaced with a strong random value and never committed.

### 7.3 `DEBUG = True` and `ALLOWED_HOSTS = []` are production-incompatible

`DEBUG = True` causes Django to return full stack traces (including settings variables) on any unhandled exception. `ALLOWED_HOSTS = []` is only permissive in DEBUG mode — in production it would reject all requests. Neither setting is gated behind an environment variable, making it easy to accidentally deploy in an unsafe state.

### 7.4 `dj_rest_auth` is installed but unused

`INSTALLED_APPS` includes `dj_rest_auth`, `rest_framework.authtoken`, and `django.contrib.sites` (required by `dj_rest_auth`). None of these are used by any custom view in this project — authentication is handled entirely through the custom `LoginInternoView` / `LoginProveedorView` endpoints. The `dj_rest_auth` package registers additional session-based auth routes that are not documented and not protected by the role system, creating an undocumented auth surface.

---

## 8. Test Coverage

`api/tests.py` is empty. There are no automated tests of any kind — no unit tests for business logic, no integration tests for the state machine transitions, no permission tests for role-gated endpoints. All of the bugs documented in §3 are undetectable without tests.
