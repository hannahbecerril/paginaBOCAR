# API Routes — Sistema BOCAR

Backend: Django REST Framework · Base URL: `http://127.0.0.1:8000`

All protected endpoints require:
```
Authorization: Bearer <ACCESS_TOKEN_JWT>
Content-Type: application/json
```

---

## RFQ State Machine

The lifecycle of every RFQ is controlled by boolean flags in `Status_RFQ`:

| Level | Field | Status | Responsible Role |
|-------|-------|--------|-----------------|
| 1 | `lev1` | Created | Auto on creation |
| 2 | `lev2` | Draft (Ind.) | Industrialization engineer |
| 3 | `lev3` | Pending technical approval | Industrialization_Admin |
| 4 | `lev4` | Approved by Ind. / Purchases draft | Purchases user |
| 5 | `lev5` | Waiting supplier list approval | Purchases_Admin |
| 6 | `lev6` | Published to suppliers | Suppliers |
| 7 | `lev7` | Quote analysis | Purchases user |
| 8 | `lev8` | Pending final manager decision | Purchases_Admin |
| 9 | `lev9` | Closed / Awarded | Read-only |

---

## User Roles (Django Groups)

| Group | Description |
|-------|-------------|
| `SuperAdmin` | Full system access |
| `Industrialization` | Create and edit RFQs |
| `Industrialization_Admin` | Approve/reject RFQs from Ind. team |
| `Purchases` | Assign suppliers, analyze quotes |
| `Purchases_Admin` | Approve supplier lists and final awards |
| `Supplier` | Submit quotes for assigned RFQs |

---

## 1. Authentication

### POST `/api/auth/login/interno/`
Login for internal staff (all non-supplier roles).

**Permissions:** Public

**Request:**
```json
{
  "username": "hannah.ind",
  "password": "PasswordSeguro123"
}
```

**Response 200:**
```json
{
  "refresh": "<JWT_REFRESH_TOKEN>",
  "access": "<JWT_ACCESS_TOKEN>",
  "usuario": {
    "id": 4,
    "username": "hannah.ind",
    "email": "hannah@bocar.com.mx",
    "grupos": ["Industrialization_Admin"]
  }
}
```

**Errors:** `400` missing fields · `401` wrong credentials · `403` not an internal role or inactive account

---

### POST `/api/auth/login/proveedor/`
Login for external suppliers. Requires HMAC-SHA256 signature in header.

**Permissions:** Public (with cryptographic validation)

**Special header:**
```
X-Signature: <HMAC_SHA256_HEX>
```

The signature must be computed over the JSON payload with keys sorted alphabetically:
```python
import hmac, hashlib, json
payload = json.dumps({"password": "...", "username": "..."}, sort_keys=True, separators=(',', ':'))
signature = hmac.new(SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()
```

**Request:**
```json
{
  "username": "supplier_brennan",
  "password": "SupplierSecurePassword99!"
}
```

**Response 200:** Same structure as internal login.

**Errors:** `400` missing fields · `401` wrong credentials · `403` invalid signature / not a Supplier group member / inactive account

---

## 2. User Management

### GET `/api/usuarios/listar/`
List all system users with their groups.

**Permissions:** `SuperAdmin`

**Response 200:**
```json
[
  {
    "id": 1,
    "username": "admin",
    "email": "admin@bocar.com.mx",
    "is_active": true,
    "grupos": ["SuperAdmin"]
  }
]
```

---

### POST `/api/usuarios/crear/`
Create a new user and assign them to a role group.

**Permissions:** `SuperAdmin`

**Request:**
```json
{
  "username": "nuevo.comprador",
  "password": "UserSecurePass12!",
  "email": "compras@bocar.com.mx",
  "rol": "Purchases"
}
```

Valid values for `rol`: `SuperAdmin`, `Industrialization`, `Industrialization_Admin`, `Purchases`, `Purchases_Admin`, `Supplier`

**Response 201:** User object (password excluded).

**Errors:** `400` if the role/group does not exist in the DB

---

### PUT `/api/usuarios/<pk>/estado/`
Enable or disable a user account (logical delete, preserves history).

**Permissions:** `SuperAdmin`

**Request:**
```json
{ "is_active": false }
```

**Response 200:**
```json
{
  "mensaje": "El usuario 'juan.compras' ha sido dado de baja (suspendido) exitosamente.",
  "usuario": { "id": 5, "username": "juan.compras", "is_active": false }
}
```

---

## 3. Suppliers

### GET `/usuarios/proveedores/`
Search and list supplier accounts.

**Permissions:** `Purchases`, `Purchases_Admin`

**Query params:** `?search=<text>` — searches against `username`, `first_name`, `last_name`, `email`

**Response 200:**
```json
[
  { "id": 12, "username": "supplier_brennan", "email": "brennan@sup.com", "first_name": "John", "last_name": "Brennan" }
]
```

> **Note:** This route is missing the `/api/` prefix — it lives at `/usuarios/proveedores/` not `/api/usuarios/proveedores/`.

---

## 4. Files (Archivo)

The `ArchivoViewSet` is a full ModelViewSet registered at `/api/archivos/`.

| Method | URL | Action |
|--------|-----|--------|
| `GET` | `/api/archivos/` | List all files |
| `POST` | `/api/archivos/` | Upload a new file record |
| `GET` | `/api/archivos/<pk>/` | Retrieve a file record |
| `PUT` | `/api/archivos/<pk>/` | Full update |
| `PATCH` | `/api/archivos/<pk>/` | Partial update |
| `DELETE` | `/api/archivos/<pk>/` | Delete a file record |

**Permissions:** Authenticated (no role restriction beyond JWT).

---

### GET `/api/archivos/<pk>/descargar/`
Securely download the physical file associated with an `Archivo` record. Streams the file as an attachment.

**Permissions:** `IsAuthenticated`

**Response:** Binary file stream with `Content-Disposition: attachment; filename="<original_name>"`

**Errors:** `404` if the DB record has no file path or the file is missing from the server filesystem.

---

## 5. RFQ — Industrialization Module

### GET `/api/rfqs/lista/`
Returns RFQs filtered by the authenticated user's role and optional `vista` query param. Injects `detalles_tecnicos` (mold or die technical data) into each item.

**Permissions:** `IsAuthenticated` (behavior varies by group)

**Query params:** `?vista=all` (default) or `?vista=draft`

**Role behavior:**
- `Industrialization` / `Industrialization_Admin` / `SuperAdmin`:
  - `all` → RFQs in lev4 and lev6–lev9 (**lev5 is excluded** — RFQs awaiting Purchases_Admin approval are not surfaced to Ind. users)
  - `draft` → own RFQs in lev2
- `Purchases` / `Purchases_Admin`:
  - `all` → RFQs in lev6–lev9
  - `draft` → RFQs in lev4 that already have a supplier assigned
- `Supplier`:
  - `all` → assigned RFQs in lev7–lev9
  - `draft` → assigned RFQs in lev6 where the user has saved partial cost data

**Response 200:**
```json
[
  {
    "id_rfq": 7,
    "created_by": "hannah.ind",
    "modified_date": "2026-05-20T14:30:00Z",
    "tool": "Molde Fascia Delantera",
    "type": "mold",
    "detalles_tecnicos": { "DESC": "...", "No_CAV": "2", ... }
  }
]
```

---

### POST `/rfq/crear/`
Create a new RFQ. Supports draft and final submission modes.

**Permissions:** `Industrialization`, `Industrialization_Admin`, `SuperAdmin`

> **Note:** This route is missing the `/api/` prefix — it lives at `/rfq/crear/` not `/api/rfq/crear/`.

**Request — Mold:**
```json
{
  "is_draft": false,
  "type": "mold",
  "tool": "Molde Fascia Delantera BOCAR-2026",
  "mold_info_p1": {
    "DESC": "Fascia delantera",
    "No_CAV": "2",
    "CUST": "Ford",
    "PPY": 50000
  },
  "mold_info_p2": {
    "ThreeD": true,
    "FlAn": false,
    "ThreeD_notes": "Modelo SolidWorks"
  }
}
```

**Request — Die (Troquel):**
```json
{
  "is_draft": false,
  "type": "die",
  "tool": "Troquel de Corte Soporte Motor Izquierdo",
  "die_trim": {
    "DESC": "Soporte motor izquierdo",
    "Press": "800T",
    "No_cavities": "1",
    "Desi_3D": true
  }
}
```

**`is_draft` behavior:**
- `true` → sets `lev1=True, lev2=True` (draft saved locally)
- `false` → validates `tool` and `type` are present, sets `lev1=True, lev3=True` (sent to manager)

**Response 201:**
```json
{ "mensaje": "RFQ 7 guardado exitosamente como PENDING_IND_APPROVAL (Nivel 3).", "id_rfq": 7 }
```

---

### PUT `/api/rfq/<pk>/editar/`
Update an existing RFQ. Uses `update_or_create` so partial data saves don't overwrite existing records. Blocked if the RFQ is already in lev6 or beyond.

**Permissions:** `Industrialization`, `Industrialization_Admin`, `SuperAdmin`

**Request:** Same structure as `POST /rfq/crear/` with `is_draft` flag.

**Response 200:**
```json
{ "mensaje": "RFQ 7 actualizado correctamente. Estado actual: Pendiente Aprobación (Nivel 3).", "id_rfq": 7 }
```

**Errors:** `400` if lev6 is active (edit locked)

---

### PATCH `/api/rfq/<pk>/revision-ind/`
Approve or reject an RFQ in lev3 (pending technical review).

**Permissions:** `Industrialization_Admin`, `SuperAdmin`

**Request:**
```json
{ "is_approved": true }
```

**State transitions:**
- `true` → validates technical data exists → `lev3=False, lev4=True` (sent to Purchases)
- `false` → `lev3=False, lev2=True` (returned to draft for corrections)

**Response 200:**
```json
{
  "mensaje": "RFQ 7 (mold) evaluado correctamente.",
  "id_rfq": 7,
  "estado_actual": "APPROVED_BY_IND (Aprobado y transferido a Compras)"
}
```

---

## 6. RFQ — Purchases Module

### GET `/rfqs/pendientes-compras/`
List RFQs that have been approved by Industrialization and are waiting for Purchases action (lev4).

**Permissions:** `Purchases`, `Purchases_Admin`, `SuperAdmin`

> **Warning:** `RFQAprobadosListView` is imported in `urls.py` but is **not defined** in `views.py`. This route will cause a server `ImportError` on startup. Use `/api/rfqs/lista/?vista=draft` as a functional equivalent from the `Purchases` role.

---

### PUT `/rfq/<pk>/asignar-proveedores/`
Assign a list of supplier candidates to an RFQ in lev4. Clears previous assignments, bulk-creates new `RFQ_Assignment` entries, and initializes empty cost breakdown rows for each supplier.

**Permissions:** `Purchases`, `Purchases_Admin`

> **Note:** Missing `/api/` prefix — lives at `/rfq/<pk>/asignar-proveedores/`.

**Request:**
```json
{ "proveedores_ids": [12, 15, 18] }
```

**State transition:** `lev4=False, lev5=True`

**Response 200:**
```json
{ "message": "Proveedores guardados para el RFQ 7. Enviado a gerencia.", "cantidad_proveedores": 3 }
```

---

### GET `/api/rfqs/pendientes-aprobacion-gerencia/`
List RFQs in lev5 (waiting for Purchases_Admin to approve the supplier list).

**Permissions:** `Purchases_Admin`

**Response 200:** Array of `RFQBase` objects.

---

### PATCH `/api/rfq/<pk>/aprobar-proveedores/`
Approve or reject the supplier candidate list for an RFQ in lev5.

**Permissions:** `Purchases_Admin`

**Request:**
```json
{ "accion": "aprobar" }
```

**State transitions:**
- `"aprobar"` → `lev5=False, lev6=True` (published to suppliers)
- `"rechazar"` → `lev5=False, lev4=True` (returned to Purchases for new selection)

**Response 200:**
```json
{ "mensaje": "Lista de proveedores aprobada. El RFQ ha sido publicado a los proveedores (Nivel 6).", "id_rfq": 7 }
```

---

### GET `/rfq/<pk>/comparativa/`
Retrieve a side-by-side comparison of all supplier quotes for an RFQ in lev7.

**Permissions:** `Purchases`, `Purchases_Admin`

> **Note:** Missing `/api/` prefix — lives at `/rfq/<pk>/comparativa/`.

**Response 200:**
```json
{
  "id_rfq": 7,
  "tipo": "mold",
  "comparativa": [
    {
      "proveedor": "John Brennan",
      "datos": {
        "parte_1": { "cavity_machining_usd": 12500.0, ... },
        "parte_2": { ... }
      }
    }
  ]
}
```

---

### PATCH `/api/rfq/<pk>/seleccionar-proveedor/`
Mark a supplier as the winner candidate and advance to lev8 (pending final manager approval).

**Permissions:** `Purchases`, `Purchases_Admin`

**Request:**
```json
{ "proveedor_id": 15 }
```

**State transition:** `lev7=False, lev8=True`

**Response 200:**
```json
{ "mensaje": "Proveedor marcado como ganador virtual. RFQ enviado a validación gerencial (Nivel 8).", "id_rfq": 7 }
```

---

### PATCH `/api/rfq/<pk>/fallo-gerencial/`
Final manager decision: approve or reject the selected winner.

**Permissions:** `Purchases_Admin`

**Request:**
```json
{ "accion": "aprobar" }
```

**State transitions:**
- `"aprobar"` → `lev8=False, lev9=True` (awarded, all data frozen)
- `"rechazar"` → `lev8=False, lev7=True` + clears `winning_supplier` (forces re-evaluation)

**Response 200:**
```json
{
  "mensaje": "Fallo aprobado exitosamente. El Molde ha sido adjudicado y la licitación está cerrada (Nivel 9).",
  "id_rfq": 7,
  "tipo": "mold",
  "proveedor_ganador": "supplier_brennan"
}
```

---

## 7. RFQ — Supplier Portal

### GET `/api/rfq/buzon-proveedor/`
List all RFQs in lev6 assigned to the authenticated supplier.

**Permissions:** `Supplier`

**Response 200:** Array of `RFQBase` objects.

---

### POST `/api/rfq/<pk>/cotizar/`
Submit a cost breakdown quote for an RFQ in lev6. Supports draft saves.

**Permissions:** `Supplier`

**Request — Mold:**
```json
{
  "is_draft": false,
  "mold_cost_p1": { "cavity_machining_usd": 12500.00, "core_machining_usd": 11000.00 },
  "mold_cost_p2": { "hot_runner_system_usd": 8500.00, "accessories_components_usd": 2400.00 },
  "mold_cost_p3": { "tryout_costs_usd": 3500.00, "engraving_texturing_usd": 1500.00 },
  "mold_cost_p4": {},
  "mold_cost_p5": {}
}
```

**Request — Die:**
```json
{
  "is_draft": false,
  "die_cost_p1": {},
  "die_cost_p2": {},
  "die_cost_p3": {},
  "die_cost_p4": {}
}
```

**`is_draft` behavior:**
- `true` → saves data, stays in lev6
- `false` → locks submission, transitions `lev6=False, lev7=True`

**Response 200:**
```json
{ "mensaje": "Cotización enviada oficialmente para revisión (Nivel 7).", "id_rfq": 7 }
```

---

## 8. Dashboards

### GET `/api/dashboard/industrializacion/`
KPIs and project status for the Industrialization team.

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
Procurement funnel and supplier response KPIs for Purchases team.

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

---

### GET `/api/dashboard/proveedor/`
Monthly workload histogram and win-rate metrics for the authenticated supplier.

**Permissions:** `Supplier`

**Response 200:**
```json
{
  "histograma_mensual": [
    { "mes": "2026-01", "total": 3 },
    { "mes": "2026-02", "total": 8 }
  ],
  "metricas": {
    "rfqs_en_borrador": 2,
    "rfqs_ganados": 12,
    "rfqs_perdidos": 24,
    "win_rate_porcentaje": 33.33
  }
}
```

---

## Known Issues / Inconsistencies

| Route | Issue |
|-------|-------|
| `/rfq/crear/` | Missing `/api/` prefix (inconsistent with other routes) |
| `/rfqs/pendientes-compras/` | Missing `/api/` prefix + `RFQAprobadosListView` is imported in `urls.py` but **not defined** in `views.py` — causes `ImportError` on server startup |
| `/usuarios/proveedores/` | Missing `/api/` prefix |
| `/rfq/<pk>/asignar-proveedores/` | Missing `/api/` prefix |
| `/rfq/<pk>/comparativa/` | Missing `/api/` prefix |
