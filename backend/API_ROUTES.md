# API Routes — Sistema BOCAR

Backend: Django REST Framework · Base URL: `http://127.0.0.1:8000`

All protected endpoints require:
```
Authorization: Bearer <ACCESS_TOKEN_JWT>
Content-Type: application/json
```

---

## RFQ Status Machine

The lifecycle is controlled by a single `status` CharField on `RFQ_Base`. The `submitted_for_review` flag on `RFQ_Base` is used by admins to identify which drafts need their attention, without creating a separate "pending approval" status.

| Status | Who acts | Description |
|--------|---------|-------------|
| `industrialization_draft` | Ind. engineer + Ind_Admin | Draft being created or awaiting Ind_Admin review (`submitted_for_review=True` = ready for review) |
| `sent_to_purchases` | Purchases team | Ind_Admin approved — appears in Purchases inbox |
| `purchases_draft` | Purchases team | Purchases assigning suppliers (`submitted_for_review=True` = waiting for Purchases_Admin) |
| `sent_to_suppliers` | Supplier portal | Purchases_Admin approved — published to suppliers |
| `waiting_for_suppliers` | Purchases analysis | At least 1 supplier submitted. **Other suppliers can still submit.** |
| `supplier_selected` | Purchases_Admin | Winner chosen, pending final award. Shown to winning supplier as `selected`, to others as `not_selected`. |
| `rfq_closed` | Read-only | Final award confirmed. All data frozen. |

---

## User Roles (Django Groups)

| Group | Description |
|-------|-------------|
| `SuperAdmin` | Full system access |
| `Industrialization` | Create and edit RFQs |
| `Industrialization_Admin` | Review and send RFQs to Purchases |
| `Purchases` | Assign suppliers, analyze quotes |
| `Purchases_Admin` | Approve supplier lists and final awards |
| `Supplier` | Submit quotes for assigned RFQs |

**Permission classes in `permissions.py`:**

| Class | Allowed groups |
|-------|---------------|
| `IsSuperAdmin` | `SuperAdmin` |
| `IsIndAdmin` | `Industrialization_Admin`, `SuperAdmin` |
| `IsIndUser` | `Industrialization`, `Industrialization_Admin`, `SuperAdmin` |
| `IsPurchasesAdmin` | `Purchases_Admin`, `SuperAdmin` |
| `IsPurchasesUser` | `Purchases`, `Purchases_Admin`, `SuperAdmin` |
| `IsInternalUser` | All of the above except `Supplier` — used for read endpoints accessible to all staff |
| `IsSupplier` | `Supplier` only |

---

## 1. Authentication

### POST `/api/auth/login/interno/`
Login for internal staff.

**Permissions:** Public

**Request:**
```json
{ "username": "ind_admin", "password": "ind1234" }
```

**Response 200:**
```json
{
  "refresh": "<JWT_REFRESH_TOKEN>",
  "access": "<JWT_ACCESS_TOKEN>",
  "usuario": { "id": 4, "username": "ind_admin", "email": "ind.admin@bocar.com", "grupos": ["Industrialization_Admin"] }
}
```

**Errors:** `400` missing fields · `401` wrong credentials · `403` not an internal role or inactive account

---

### POST `/api/auth/login/proveedor/`
Login for suppliers. Requires HMAC-SHA256 signature.

**Permissions:** Public (with cryptographic validation)

**Special header:**
```
X-Signature: <HMAC_SHA256_HEX>
```

Compute with keys sorted alphabetically:
```python
import hmac, hashlib, json
payload = json.dumps({"password": "...", "username": "..."}, sort_keys=True, separators=(',', ':'))
signature = hmac.new(SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()
```

**Errors:** `400` missing fields · `401` wrong credentials · `403` invalid signature / not Supplier group / inactive

---

## 2. User Management

### GET `/api/usuarios/listar/`
**Permissions:** `SuperAdmin`

### POST `/api/usuarios/crear/`
**Permissions:** `SuperAdmin`

**Request:**
```json
{ "username": "nuevo.comprador", "password": "Pass123!", "email": "x@bocar.com", "rol": "Purchases" }
```

Valid `rol` values: `SuperAdmin`, `Industrialization`, `Industrialization_Admin`, `Purchases`, `Purchases_Admin`, `Supplier`

### PUT `/api/usuarios/<pk>/estado/`
Enable or disable a user account.

**Permissions:** `SuperAdmin`

**Request:** `{ "is_active": false }`

---

## 3. Suppliers

### GET `/api/usuarios/proveedores/`
List Django Users in the `Supplier` group. Returns their Django `User.id` — use these IDs in `proveedores_ids` when assigning suppliers.

**Permissions:** `Purchases`, `Purchases_Admin`

**Query params:** `?search=<text>`

**Response 200:**
```json
[{ "id": 6, "username": "supplier_user", "email": "supplier@external.com", "first_name": "", "last_name": "" }]
```

---

## 4. Files (Archivo)

| Method | URL | Action |
|--------|-----|--------|
| `GET` | `/api/archivos/` | List files |
| `POST` | `/api/archivos/` | Upload |
| `GET` | `/api/archivos/<pk>/` | Retrieve |
| `PUT` | `/api/archivos/<pk>/` | Update |
| `DELETE` | `/api/archivos/<pk>/` | Delete |
| `GET` | `/api/archivos/<pk>/descargar/` | Download file stream |

**Permissions:** `IsAuthenticated`

---

## 5. RFQ — Industrialization Module

### GET `/api/rfqs/lista/`
Returns RFQs filtered by role and `?vista=all|draft`.

**Permissions:** `IsAuthenticated`

**Role behavior:**
- `Industrialization` / `Industrialization_Admin` / `SuperAdmin`:
  - `all` → RFQs in `sent_to_purchases` and beyond (everything that left Ind)
  - `draft` → **all** `industrialization_draft` RFQs (not filtered by creator — all Ind users see all drafts)
- `Purchases` / `Purchases_Admin`:
  - `all` → RFQs in `sent_to_suppliers` and beyond
  - `draft` → RFQs in `sent_to_purchases` or `purchases_draft` (their full inbox)
- `Supplier`:
  - `all` → assigned RFQs in `waiting_for_suppliers`, `supplier_selected`, `rfq_closed`
  - `draft` → assigned RFQs in `sent_to_suppliers` or `waiting_for_suppliers` where `has_responded=False`

**Each item in the response includes:**
- `detalles_tecnicos` — mold P1 or die trim spec preview
- `completion_percentage` (0–100) — percentage of required spec fields filled
- `offers_count` — number of submitted supplier quotes
- `is_winner` (Supplier role + `supplier_selected` only) — whether this supplier won

**RFQ list item shape:**
```json
{
  "id_rfq": 7, "title": "Molde Fascia", "tool": "Molde Fascia",
  "type": "mold", "category": "Metal", "priority": "High",
  "status": "sent_to_purchases", "submitted_for_review": false,
  "created_by": "ind_user", "modified_date": "2026-06-01T10:00:00Z",
  "completion_percentage": 75, "offers_count": 2,
  "detalles_tecnicos": { "DESC": "Fascia", "CUST": "Ford", ... }
}
```

---

### POST `/api/rfq/crear/`
Create a new RFQ.

**Permissions:** `Industrialization`, `Industrialization_Admin`, `SuperAdmin`

**Request — Mold:**
```json
{
  "is_draft": false,
  "type": "mold",
  "tool": "Molde Fascia Delantera",
  "mold_info_p1": { "DESC": "Fascia delantera", "No_CAV": "2", "CUST": "Ford", "PPY": 50000 },
  "mold_info_p2": { "ThreeD": true, "ThreeD_notes": "Modelo SolidWorks" }
}
```

**Request — Die:**
```json
{
  "is_draft": false,
  "type": "die",
  "tool": "Troquel de Corte",
  "die_trim": { "DESC": "Soporte motor", "Press": "800T", "No_cavities": "1", "Desi_3D": true }
}
```

**`is_draft` behavior:**
- `true` → `industrialization_draft`, `submitted_for_review=False`
- `false` → `industrialization_draft`, `submitted_for_review=True` (appears in Ind_Admin inbox)

---

### PUT `/api/rfq/<pk>/editar/`
Edit an RFQ. Blocked when status is `sent_to_suppliers` or beyond.

**Permissions:** `Industrialization`, `Industrialization_Admin`, `SuperAdmin`

---

### PATCH `/api/rfq/<pk>/revision-ind/`
Ind_Admin reviews a draft that has `submitted_for_review=True`.

**Permissions:** `Industrialization_Admin`, `SuperAdmin`

**Request:** `{ "is_approved": true }`

**State transitions:**
- `true` → `sent_to_purchases`, `submitted_for_review=False`
- `false` → stays `industrialization_draft`, `submitted_for_review=False` (returned to engineer)

---

## 6. RFQ — Purchases Module

### GET `/api/rfqs/lista/?vista=draft`
Purchases inbox: RFQs in `sent_to_purchases` or `purchases_draft`. (Use this instead of the removed `/rfqs/pendientes-compras/` route.)

---

### PUT `/api/rfq/<pk>/asignar-proveedores/`
Assign suppliers, with support for saving as draft or submitting for admin review.

**Permissions:** `Purchases`, `Purchases_Admin`

**Request:**
```json
{ "proveedores_ids": [6, 9], "is_draft": false }
```
Use Django `User.id`s from `/api/usuarios/proveedores/` or `/api/proveedores/`.

**`is_draft` behavior:**
- `true` → saves supplier list, sets `submitted_for_review=False`, allows empty `proveedores_ids` (save-as-draft without suppliers)
- `false` (default) → sets `submitted_for_review=True` (appears in Purchases_Admin inbox), requires at least one supplier

**State transitions:**
- If current status is `sent_to_purchases` → always advances to `purchases_draft`
- If current status is already `purchases_draft` → stays `purchases_draft`, updates supplier list

**Response 200:**
```json
{ "message": "RFQ 7 guardado como borrador.", "cantidad_proveedores": 2, "submitted_for_review": false }
```

---

### GET `/api/rfqs/pendientes-aprobacion-gerencia/`
RFQs in `purchases_draft` with `submitted_for_review=True` — the Purchases_Admin inbox.

**Permissions:** `Purchases_Admin`

---

### PATCH `/api/rfq/<pk>/aprobar-proveedores/`
Purchases_Admin approves or rejects the supplier list.

**Permissions:** `Purchases_Admin`

**Request:** `{ "accion": "aprobar" }` or `{ "accion": "rechazar" }`

**State transitions:**
- `"aprobar"` → `sent_to_suppliers`, `submitted_for_review=False`
- `"rechazar"` → stays `purchases_draft`, `submitted_for_review=False` (returned to Purchases)

---

### GET `/api/rfq/<pk>/comparativa/`
Side-by-side quote comparison. Only available when status is `waiting_for_suppliers`.

**Permissions:** `Purchases`, `Purchases_Admin`

**Response 200:**
```json
{
  "id_rfq": 7,
  "tipo": "mold",
  "comparativa": [
    { "proveedor": "John Brennan", "datos": { "parte_1": { "Company": "SupplierCo", ... }, "parte_2": { ... } } }
  ]
}
```

---

### PATCH `/api/rfq/<pk>/seleccionar-proveedor/`
Select winning supplier. Advances to `supplier_selected`.

**Permissions:** `Purchases`, `Purchases_Admin`

**Request:** `{ "proveedor_id": 6 }` ← Django `User.id`

---

### PATCH `/api/rfq/<pk>/fallo-gerencial/`
Final manager decision.

**Permissions:** `Purchases_Admin`

**Request:** `{ "accion": "aprobar" }` or `{ "accion": "rechazar" }`

**State transitions:**
- `"aprobar"` → `rfq_closed`
- `"rechazar"` → `waiting_for_suppliers`, clears `is_winner` flag (forces re-evaluation)

**Response 200:**
```json
{ "mensaje": "...", "id_rfq": 7, "tipo": "mold", "proveedor_ganador": "supplier_user" }
```

---

## 7. RFQ — Supplier Portal

### GET `/api/rfq/buzon-proveedor/`
Assigned RFQs in `sent_to_suppliers` or `waiting_for_suppliers`.

**Permissions:** `Supplier`

---

### POST `/api/rfq/<pk>/cotizar/`
Submit a cost breakdown quote. Accepted while status is `sent_to_suppliers` **or** `waiting_for_suppliers` (other suppliers can still submit after the first response).

**Permissions:** `Supplier`

**Request — Mold (all 5 parts now functional):**
```json
{
  "is_draft": false,
  "mold_cost_p1": { "Company": "SupplierCo", "Country": "MX", "Base_currency": "USD" },
  "mold_cost_p2": { "DieFrame_Unit": 1, "DieFrame_PriceUnit": 5000.0, "DieFrame_Total": 5000.0 },
  "mold_cost_p3": {},
  "mold_cost_p4": {},
  "mold_cost_p5": {}
}
```

**Request — Die:**
```json
{
  "is_draft": false,
  "die_cost_p1": { "Elaborated_by": "supplier_user", "Country": "MX" },
  "die_cost_p2": {},
  "die_cost_p3": {},
  "die_cost_p4": {}
}
```

**`is_draft` behavior:**
- `true` → saves data, status unchanged
- `false` → sets `RFQ_Assignment.has_responded=True` for this supplier; if RFQ was `sent_to_suppliers`, advances to `waiting_for_suppliers`

---

## 8. Dashboards

### GET `/api/dashboard/industrializacion/`
**Permissions:** `Industrialization`, `Industrialization_Admin`, `SuperAdmin`

**Response 200:**
```json
{
  "estado_requerimientos": {
    "en_borrador_lev2": 4,
    "esperando_firma_jefe_lev3": 2,
    "liberados_a_compras_lev4": 15,
    "proyectos_adjudicados_lev9": 45
  },
  "distribucion_herramientas": { "mold": 38, "die": 28 },
  "kpis": { "lead_time_tecnico_dias": 3.45 }
}
```

---

### GET `/api/dashboard/compras/`
**Permissions:** `Purchases`, `Purchases_Admin`, `SuperAdmin`

**Response 200:**
```json
{
  "funnel_cotizaciones": {
    "nuevos_requerimientos_lev4": 5,
    "esperando_proveedores_lev6": 12,
    "analisis_costos_lev7": 8,
    "pendientes_autorizacion_lev8": 3
  },
  "kpis": {
    "tasa_respuesta_proveedores": 78.50,
    "tiempo_promedio_respuesta_horas": 42.10
  }
}
```

> Note: KPI keys retain `lev` naming for frontend compatibility. Internally they now query `sent_to_purchases`, `sent_to_suppliers`, etc.

---

### GET `/api/dashboard/proveedor/`
**Permissions:** `Supplier`

**Response 200:**
```json
{
  "histograma_mensual": [{ "mes": "2026-01", "total": 3 }],
  "metricas": { "rfqs_en_borrador": 2, "rfqs_ganados": 12, "rfqs_perdidos": 24, "win_rate_porcentaje": 33.33 }
}
```

---

## 9. Audit Log (Bitacora)

Every request to `/api/` is logged by `RegistroBitacoraMiddleware` to the `Bitacora` table (user, path, method, IP, timestamp). There is no read endpoint — query the table directly via Django admin or the database.

---

## 10. Endpoints added in migrations 0011 + 0012

### GET `/api/rfqs/{pk}/`
Full RFQ detail — all three stages.

**Permissions:** `IsAuthenticated`

**Response 200:**
```json
{
  "id_rfq": 7, "title": "Molde Fascia", "tool": "Molde Fascia",
  "type": "mold", "category": "Metal", "priority": "High",
  "status": "waiting_for_suppliers", "submitted_for_review": false,
  "created_by": "ind_user", "modified_date": "...", "is_winner": null,
  "response_deadline": null, "shipping_terms": "", "quality_requirements": "",
  "documentos": [{ "id": 1, "name": "specs.pdf", "date": "2026-06-01", "type": "pdf", "is3D": false, "uploadedBy": "ind_user" }],
  "stage1": { "p1": {...}, "p2": {...} },
  "stage2": { "suppliers": [{ "id": 6, "username": "supplier_user", "is_winner": false, "has_responded": true }] },
  "stage3": { "responses": [{ "supplier": "supplier_user", "p1": {...}, "p2": {...} }], "statistics": { "responsesReceived": 1, "totalInvited": 2 } }
}
```

`stage2` is `null` for `Supplier` role. `stage3` is `null` until `waiting_for_suppliers`. `is_winner` non-null only for `Supplier` + `supplier_selected`. `documentos` fields use English names since migration 0012.

---

### GET `/api/rfqs/{pk}/progreso/`
Completion percentage for an RFQ draft based on how many required technical spec fields are filled.

**Permissions:** `IsAuthenticated`

**Response 200:**
```json
{
  "percentage": 75,
  "filled": 6,
  "total": 8,
  "filled_fields": ["DESC", "CUST", "No_CAV", "PPY", "TT", "ELAB"],
  "missing_fields": ["Smach", "DTQ"]
}
```

The same percentage is also injected into every list item (`GET /api/rfqs/lista/`) as `completion_percentage` — no extra request needed for list views.

---

### PATCH `/api/rfqs/{pk}/especificaciones/`
Update technical spec tables (`MOLD_INFO_P1_I`/`MOLD_INFO_P2_I` or `DIE_TRIM_I`) **without touching `RFQ_Base.status`**. Blocked at `sent_to_suppliers` and beyond.

**Permissions:** `IsIndUser`

**Request — mold:** `{ "mold_info_p1": { "DESC": "...", "CUST": "..." }, "mold_info_p2": { "ThreeD": true } }`
**Request — die:** `{ "die_trim": { "DESC": "...", "Press": "800T" } }`

---

### PATCH `/api/rfqs/{pk}/compras-metadata/`
Update Purchases metadata fields on `RFQ_Base` without changing `status` or `submitted_for_review`.

**Permissions:** `IsPurchasesUser`

**Request:** `{ "metadata": { "response_deadline": "2024-04-30", "shipping_terms": "FOB Origin", "quality_requirements": "ISO 9001" } }`

---

### GET / PATCH / DELETE `/api/notificaciones/`
Notification list + bulk operations for the authenticated user.

- `GET` → `{ "notifications": [ { "id", "title", "message", "type", "categoryId", "rfqId", "read", "date" } ] }`
- `PATCH { "read_all": true }` → marks all as read
- `DELETE` → clears all

### PATCH `/api/notificaciones/{pk}/`
Mark one notification as read. Request: `{ "read": true }`

> Note: the `Notificacion` table is populated only when the backend explicitly creates records. Currently no view emits notifications automatically.

---

### GET / POST `/api/proveedores/`
Supplier list (GET, `IsPurchasesUser`) or create supplier account (POST, `IsSuperAdmin` only).

### GET / PATCH / DELETE `/api/proveedores/{pk}/`
Supplier detail, update, delete. `IsPurchasesUser`.

---

### GET `/api/usuarios/listar/`
List internal users (excludes Supplier group). `IsInternalUser` — accessible to all Ind and Purchases roles.

### GET / PATCH / DELETE `/api/usuarios/{pk}/`
Internal user detail (GET: `IsInternalUser`) or modify/delete (PATCH/DELETE: `IsSuperAdmin`).

### POST `/api/usuarios/{pk}/reset-password/`
Placeholder — returns 200 with a message. No email sent in dev. `IsSuperAdmin`.

---

### GET / POST `/api/rfqs/{pk}/documentos/`
List documents attached to an RFQ, or upload a new one.

**POST:** `multipart/form-data` with `file` (binary) + `type` (`"pdf"` / `"presentation"` / `"3d"`)

**Response (GET and POST):** `[{ "id", "name", "date", "type", "is3D" }]`

### GET `/api/rfqs/{pk}/documentos/{doc_pk}/download/`
Stream a document. Requires `Authorization: Bearer <token>` header (not query-param).

---

### POST `/api/auth/token/refresh/`
Refresh an expired access token. Provided by `djangorestframework-simplejwt`.

**Request:** `{ "refresh": "<REFRESH_TOKEN>" }`
**Response:** `{ "access": "<NEW_JWT>" }`

---

## Known Issues / Inconsistencies

All previously documented route and backend bugs have been resolved. See `ARCHITECTURAL_RISKS.md` for full history and open items.

| Issue | Resolution |
|-------|-----------|
| `RFQAprobadosListView` import crash | Removed from `urls.py` |
| Inconsistent `/api/` URL prefixes | All routes use `/api/` prefix + plural `/api/rfqs/` aliases added |
| `FalloFinalGerencialView` crashes | Fixed — also accepts English `action` field alias |
| `ReviewRFQIndView` missing tracking + wrong permission | Fixed |
| Supplier identity mismatch | Fixed — `RFQ_Assignment.supplier` FK to `User` |
| Mold quote P2–P5 `FieldError` | Fixed — `Elaborated_by` restored |
| First supplier locks out others | Fixed — guard widened to accept `waiting_for_suppliers` |
| `lev1`–`lev9` boolean state machine | Replaced with named `status` CharField (migration 0008–0010) |
| `RFQ_Tracking` stale `levN` strings | Backfilled by migration 0009 |
| No token refresh route | Added `POST /api/auth/token/refresh/` |
| No RFQ detail endpoint | Added `GET /api/rfqs/{pk}/` |
| No RFQ completion percentage | Added `GET /api/rfqs/{pk}/progreso/` + injected in list |
| No spec-save without status regression | Added `PATCH /api/rfqs/{pk}/especificaciones/` |
| No Purchases metadata save | Added `PATCH /api/rfqs/{pk}/compras-metadata/` |
| No notification endpoints | Added `GET/PATCH/DELETE /api/notificaciones/` + `PATCH /api/notificaciones/{pk}/` |
| Notification fields in Spanish | `NotificacionSerializer` renamed to English; response wrapped in `{ "notifications": [...] }` |
| No user CRUD | Added `GET/PATCH/DELETE /api/usuarios/{pk}/` + reset-password; GET open to `IsInternalUser` |
| User list included suppliers | `ListarUsuariosView` now excludes Supplier group |
| No supplier CRUD | Added `/api/proveedores/` routes |
| No RFQ-scoped documents | Added `/api/rfqs/{pk}/documentos/` routes |
| Document fields in Spanish (`nombre`, `fecha_subida`) | Now English (`name`, `date`, `type`, `is3D`) — migration 0012 |
| `/api/rfq/` vs `/api/rfqs/` | Both now work — plural aliases registered |
| `category` + `priority` missing from RFQ | Added to `RFQ_Base` (migration 0011) |
| `offers_count` missing from list | Injected by `_inject_detalles()` in `RFQClasificadoListView` |
| `AprobarRechazarProveedoresView` Spanish-only action | Accepts both `accion`/`action` and `aprobar`/`approve` |
| Dashboard no time-series data | Both Ind + Purchases dashboards return `statusChangeData`, `rfqDistributionData`, accept `?range=` |
