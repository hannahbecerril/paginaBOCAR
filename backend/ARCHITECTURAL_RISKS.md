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

## 2. State Machine — Current Implementation, Required Change, and Migration Plan

### 2.0 Current state (not yet changed)

The backend **still uses the original `lev1`–`lev9` boolean scheme**. `Status_RFQ` (`base.py:21`) has nine separate `BooleanField`s, and every view performs direct flag assignments (`status_rfq.lev4 = True`, `status_rfq.lev6 = False`, etc.). Migration `0007` even added `lev9` as a new boolean field in May 2026, confirming the scheme is still being actively extended rather than replaced.

**This must change.** The boolean approach has structural problems that compound as the codebase grows:

- **No single source of truth for current state.** Nothing in the database prevents two flags from being `True` simultaneously — the "only one active" invariant is enforced only in Python. A bug or failed transaction leaves an RFQ in an undefined multi-flag state with no way to detect it.
- **Unreadable DB rows.** A row with `lev1=T, lev4=T` requires reading the code to understand its meaning. A row with `status='purchases_draft'` is self-explanatory.
- **Expensive queries.** Filtering by current state requires `Q(lev4=True) | Q(lev6=True) | Q(lev7=True)` chains. A single indexed `status` column is faster and simpler.
- **Migration overhead for every new state.** Each additional state requires a new column, a new migration, and updates to every view and query that checks state.

---

### 2.1 Desired target: 7 named RFQ-level statuses

The desired model replaces all boolean flags with a single `status` CharField on `RFQ_Base`. The lifecycle follows a "draft stays as draft" rule:

> **An RFQ remains in its current draft status until an admin explicitly sends it forward. There is no separate "pending approval" intermediate status. The admin's action IS the transition — they either send it (advancing the status) or reject it (returning it to draft).**

This eliminates `lev3` and `lev5` as standalone database states. The admin approval event is the trigger for the transition, not a state that the RFQ sits in.

#### RFQ-level statuses (stored in `RFQ_Base.status`)

| Status value | Who acts | Description |
|---|---|---|
| `industrialization_draft` | Ind. engineer + Ind_Admin | RFQ is being created or is awaiting admin review. Stays here until `Industrialization_Admin` sends it forward. Covers lev1 + lev2 (working) and the former lev3 (waiting for admin). |
| `sent_to_purchases` | Purchases team | `Industrialization_Admin` confirmed and sent the RFQ. Appears in the Purchases inbox. Replaces former lev4 entry point. |
| `purchases_draft` | Purchases team | Purchases is actively assigning suppliers. Stays here until `Purchases_Admin` sends it forward. Covers former lev4 (working) and former lev5 (waiting for admin). |
| `sent_to_suppliers` | Supplier portal | `Purchases_Admin` confirmed the supplier list and published the RFQ. Suppliers can see and respond to it. Replaces former lev6. |
| `waiting_for_suppliers` | Purchases analysis | At least one supplier submitted a quote. Purchases can begin analysis. **Suppliers who have not yet responded must still be able to submit while in this status** — the old lev6-only guard in `CotizacionProveedorView` must be widened. Replaces former lev7. |
| `supplier_selected` | Purchases_Admin decision | Purchases selected a winning supplier, pending final manager confirmation. Replaces former lev8. |
| `rfq_closed` | Read-only | Final award confirmed. All data frozen. Replaces former lev9. |

#### Per-supplier display indicators (derived — NOT stored in `RFQ_Base.status`)

These are display labels visible only to the supplier in their own portal. They are computed from `RFQ_Assignment` fields, not from `RFQ_Base.status`:

| Display label | Derived from | Condition |
|---|---|---|
| `supplier_draft` | `RFQ_Base.status == 'sent_to_suppliers'` AND `RFQ_Assignment.has_responded == False` | Supplier received the RFQ but has not submitted a quote yet |
| `supplier_response` | `RFQ_Assignment.has_responded == True` | Supplier has submitted their quote. Visible only to that supplier. |
| `selected` | `RFQ_Base.status == 'supplier_selected'` AND `RFQ_Assignment.is_winner == True` | Shown to the winning supplier |
| `not_selected` | `RFQ_Base.status == 'supplier_selected'` AND `RFQ_Assignment.is_winner == False` | Shown to non-winning suppliers |

`has_responded` is a **new `BooleanField`** that must be added to `RFQ_Assignment`. It is set to `True` when a supplier makes a non-draft submission in `CotizacionProveedorView`. `is_winner` already exists.

---

### 2.2 Mapping from current booleans to desired statuses

| Current (`Status_RFQ`) | Maps to (`RFQ_Base.status`) | Notes |
|---|---|---|
| `lev1=True` | `industrialization_draft` | Merged with lev2 |
| `lev2=True` | `industrialization_draft` | No behaviour change |
| `lev3=True` | `industrialization_draft` | **Eliminated.** Admin sends from draft directly. |
| `lev4=True` (just received) | `sent_to_purchases` | New explicit Purchases inbox status |
| `lev4=True` (Purchases working) | `purchases_draft` | Purchases picks it up → transitions automatically |
| `lev5=True` | `purchases_draft` | **Eliminated.** Admin sends from draft directly. |
| `lev6=True` | `sent_to_suppliers` | Renamed |
| `lev7=True` | `waiting_for_suppliers` | Renamed; submission guard must be widened (see Risk I) |
| `lev8=True` | `supplier_selected` | Renamed |
| `lev9=True` | `rfq_closed` | Renamed |

**Note on the lev4 split:** The old lev4 served as both a Purchases inbox and a working state. The new design separates it into `sent_to_purchases` (just received) and `purchases_draft` (actively being worked on). The transition between them can happen automatically the first time `AssignSuppliersRFQView` is called — no new endpoint is required.

---

### 2.3 New risks introduced by the desired design

#### Risk F — Admin inbox visibility without a separate "pending approval" status

**The problem:** By eliminating lev3 and lev5, both admins share a status with regular drafts. `Industrialization_Admin` would see every `industrialization_draft` in the system, not just the ones engineers have submitted for review. Without an extra signal there is no way to distinguish "just started" from "ready for your action".

**Solution:** Add `submitted_for_review = BooleanField(default=False)` to `RFQ_Base`. The engineer sets it to `True` when they finish and submit to the admin (maps to the old lev2→lev3 transition). The admin's inbox query becomes `industrialization_draft AND submitted_for_review=True`. When the admin rejects it back to draft, `submitted_for_review` resets to `False`. The same pattern applies to `purchases_draft` — `Purchases_Admin` sees only drafts with `submitted_for_review=True`. The existing `is_draft` flag in `CrearRFQView` / `EditarRFQView` maps directly to this field.

#### Risk G — `sent_to_purchases` and `purchases_draft` need a defined transition trigger

**The problem:** The new design splits old lev4 into two statuses. If there is no explicit action for Purchases to "accept" the RFQ and move it from `sent_to_purchases` to `purchases_draft`, the transition is undefined. Creating a dedicated "accept" endpoint adds unnecessary surface area.

**Solution:** Make the transition automatic: the first time `AssignSuppliersRFQView` is called for a `sent_to_purchases` RFQ, advance it to `purchases_draft` before saving. No new endpoint needed. If even less friction is desired, treat `sent_to_purchases` and `purchases_draft` as the same DB value and use a display hint (e.g. whether any suppliers have been assigned) to distinguish them in the frontend.

#### Risk H — `supplier_response` tracking requires a new field on `RFQ_Assignment`

**The problem:** The per-supplier `supplier_response` display label requires knowing whether a specific supplier has submitted their quote. The current model has no `has_responded` field on `RFQ_Assignment`. The existing approach (tracking by `Elaborated_by` in the cost tables) is already broken (§3.6) and must not be reused.

**Solution:** Add `has_responded = BooleanField(default=False)` to `RFQ_Assignment`. `CotizacionProveedorView` sets it to `True` when `is_draft=False`. This is a single-column migration. The supplier portal derives the `supplier_draft` / `supplier_response` display label from this field, not from the main RFQ status.

#### Risk I — `waiting_for_suppliers` must NOT lock out remaining suppliers

**The problem:** The old lev7 transition (§3.1) locked all other suppliers out the moment the first one submitted, because `CotizacionProveedorView` guards with `if not status_rfq.lev6`. The desired design defines `waiting_for_suppliers` as "at least 1 response received" — implying remaining suppliers can still submit. Without changing the guard, §3.1 persists under the new status names.

**Solution:** Widen the submission guard in `CotizacionProveedorView`:
```python
# Old (locks out all suppliers after first submission)
if not status_rfq.lev6: ...

# Required (allows submissions while waiting for others)
if rfq.status not in (STATUS.SENT_TO_SUPPLIERS, STATUS.WAITING_FOR_SUPPLIERS): ...
```

#### Risk J — `selected` / `not_selected` requires frontend role-aware rendering with backend data

**The problem:** The same `supplier_selected` DB status must display as "Selected" to the winning supplier and "Not Selected" to others. `RFQClasificadoListView` currently injects `detalles_tecnicos` but does not include the supplier's own `is_winner` value from `RFQ_Assignment`.

**Solution:** When `RFQClasificadoListView` serves a `Supplier`-role request and the RFQ's status is `supplier_selected`, it must join `RFQ_Assignment` and include `is_winner` for the requesting supplier's assignment in the response payload. The frontend then renders "Selected" or "Not Selected" based on that field, independently of the status string.

---

### 2.4 Migration risks inherited from the boolean-to-named transition

#### Risk K — `RFQ_Tracking.nivel_alcanzado` stores raw `levN` strings

**The problem:** Every existing tracking row contains strings like `'lev4'`, `'lev6'`. The dashboard KPI queries match by exact string:
```python
RFQ_Tracking.objects.filter(id_rfq_id=rfq_id, nivel_alcanzado='lev6')   # views.py:120
RFQ_Tracking.objects.filter(id_rfq_id=rfq_id, nivel_alcanzado__in=['lev2', 'lev3'])  # views.py:171
```
After renaming, all historical KPI calculations silently return zero.

**Solution:** Run this data migration immediately after the schema migration, before any view code is updated:
```python
LEVEL_MAP = {
    'lev1': 'industrialization_draft',
    'lev2': 'industrialization_draft',
    'lev3': 'industrialization_draft',
    'lev4': 'sent_to_purchases',
    'lev5': 'purchases_draft',
    'lev6': 'sent_to_suppliers',
    'lev7': 'waiting_for_suppliers',
    'lev8': 'supplier_selected',
    'lev9': 'rfq_closed',
}
for old, new in LEVEL_MAP.items():
    RFQ_Tracking.objects.filter(nivel_alcanzado=old).update(nivel_alcanzado=new)
```
After the migration add `choices=STATUS_CHOICES` to `nivel_alcanzado` so future invalid writes fail loudly.

#### Risk L — `Status_RFQ` table becomes orphaned data

**The problem:** `Status_RFQ` has no ForeignKey to `RFQ_Base` (see §4.1). After migrating state into `RFQ_Base.status`, its rows are stale but still present, creating ambiguity about which field is authoritative.

**Solution:** (1) Add `status` (nullable `CharField`) to `RFQ_Base`. (2) Run the data migration from `Status_RFQ`. (3) Rewrite all views. (4) Drop `Status_RFQ` in a follow-up migration after deployment is verified. Never drop it before step 3 is live.

#### Risk M — ~15 view call sites check boolean flags directly

**The problem:** Every view in `views.py` has inline boolean checks scattered across ~15 locations. A partial update creates split-brain: one request reads `rfq.status`, another reads `status_rfq.lev6`, and they disagree.

**Solution:** Rewrite all 15 call sites in a single PR. Use a `STATUS` constants class to prevent silent typos:
```python
class STATUS:
    IND_DRAFT             = 'industrialization_draft'
    SENT_TO_PURCHASES     = 'sent_to_purchases'
    PURCHASES_DRAFT       = 'purchases_draft'
    SENT_TO_SUPPLIERS     = 'sent_to_suppliers'
    WAITING_FOR_SUPPLIERS = 'waiting_for_suppliers'
    SUPPLIER_SELECTED     = 'supplier_selected'
    RFQ_CLOSED            = 'rfq_closed'
```
A typo in `STATUS.SENT_TO_PURCHASESS` raises `AttributeError` immediately. A typo in the string `'sent_to_purchasess'` is silently accepted.

#### Risk N — `registrar_tracking_rfq` call sites embed `levN` literals

**The problem:** ~8 calls in `views.py` pass raw `levN` strings. Missing any one after the migration writes stale strings into `RFQ_Tracking`, breaking KPI calculations again.

**Solution:** Replace all literals with `STATUS.*` constants (Risk M). The `choices` constraint on `nivel_alcanzado` (Risk K) catches any remaining raw string at save time.

#### Risk O — `Elaborated_by` desync and identity split interact with this refactor

**The problem:** §3.5 and §3.6 bugs touch the same views being rewritten for the state machine. Combining all three in one PR produces a diff too large to review safely.

**Solution:** Fix §3.5 and §3.6 in separate, independently verifiable PRs before starting the state machine refactor.

---

### 2.5 Recommended execution order

| Step | Action | Risks addressed |
|------|--------|-----------------|
| 1 | Fix §3.5 — unify supplier identity to Django `User`, remove `Suppliers` table dependency from views | O |
| 2 | Fix §3.6 — replace `Elaborated_by` lookups with `RFQ_Assignment` FK filter | O |
| 3 | Fix §3.2, §3.3 — `FalloFinalGerencialView` crashes + `ReviewRFQIndView` missing tracking | Unblocks correct KPI data accumulation |
| 4 | Add `RFQ_Base.status` (nullable) + `RFQ_Assignment.has_responded` + `RFQ_Base.submitted_for_review` | F, H |
| 5 | Data migration: populate `RFQ_Base.status` from `Status_RFQ` booleans using `LEVEL_MAP` | L |
| 6 | Data migration: rename `RFQ_Tracking.nivel_alcanzado` from `levN` → new strings | K |
| 7 | Rewrite all ~15 view call sites + all ~8 `registrar_tracking_rfq` calls + widen supplier submission guard in one PR | M, N, I |
| 8 | Make `RFQ_Base.status` non-nullable; add `choices` constraint to `nivel_alcanzado` | K, M |
| 9 | Update `RFQClasificadoListView` to inject `is_winner` for supplier-role requests | J |
| 10 | Drop `Status_RFQ` table | L |

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
