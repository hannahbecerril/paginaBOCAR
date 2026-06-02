# Frontend API Contract — BOCAR Procurement Platform

This document describes every backend endpoint the frontend needs, organized by domain.
For each endpoint: which component calls it, what triggers the call, what data flows in each direction, and how the response shapes the UI.

All protected endpoints require:
```
Authorization: Bearer <ACCESS_TOKEN_JWT>
Content-Type: application/json
```

Tokens are stored as cookies (`access_token`, `refresh_token`). The user object is stored in `localStorage` under the key `"user"`, containing `{ id, username, email, grupos, rol, rolParaRuta }`.

---

## Role → Route mapping

After login, `App.jsx` redirects the user based on `rol`:

| `rol` value | Redirects to |
|-------------|-------------|
| `Industrialization` / `Industrialization_Admin` | `/Industrialization` |
| `Purchases` / `Purchases_Admin` | `/Purchases` |
| `Suppliers` | `/Suppliers` |

The route guard in `App.jsx` normalizes roles by stripping `_Admin` before comparing, so `Industrialization_Admin` passes the `Industrialization` guard.

---

## RFQ State Machine — Quick Reference

The state machine uses named `status` CharField values (not lev1–lev9 booleans). Import and use the `STATUS` constants from `src/constants/rfqStatus.js` — never use raw strings.

```
industrialization_draft  (Ind engineer + Ind_Admin)
  ↓ [submitted_for_review=True → in Ind_Admin inbox]
  ↓ Ind_Admin approves → sent_to_purchases
sent_to_purchases        (Purchases inbox)
  ↓ Purchases assigns suppliers → purchases_draft
purchases_draft          (Purchases builds supplier list)
  ↓ [submitted_for_review=True → in Purchases_Admin inbox]
  ↓ Purchases_Admin approves → sent_to_suppliers
sent_to_suppliers        (Published — suppliers invited, no responses yet)
  ↓ First supplier submits → waiting_for_suppliers
waiting_for_suppliers    (Quote analysis — more suppliers can still submit)
  ↓ Purchases selects winner → supplier_selected
supplier_selected        (Winner chosen — pending final award)
  ↓ Purchases_Admin approves → rfq_closed
rfq_closed               (Awarded and frozen)
```

| `status` value (snake_case) | Who acts | Human label |
|-----------------------------|---------|-------------|
| `industrialization_draft` | Ind engineer + Ind_Admin | Industrialization Draft |
| `sent_to_purchases` | Purchases team | Sent to Purchases |
| `purchases_draft` | Purchases (supplier list) | Purchases Draft |
| `sent_to_suppliers` | Supplier portal | Sent to Suppliers |
| `waiting_for_suppliers` | Purchases analysis | Waiting for Suppliers |
| `supplier_selected` | Purchases_Admin final award | Supplier Selected |
| `rfq_closed` | Read-only | RFQ Closed |

`submitted_for_review` flag distinguishes "draft in progress" vs "pending admin action" within `industrialization_draft` and `purchases_draft`.

Supplier-level display (derived from `RFQ_Assignment`, injected by `normalizeRFQDetail`):

| Display in frontend | Condition |
|---------------------|-----------|
| Quote form visible | `status` is `sent_to_suppliers` or `waiting_for_suppliers` |
| `is_winner: true` | `status === supplier_selected` and this supplier won |
| `is_winner: false` | `status === supplier_selected` and this supplier lost |

---

## 1. Authentication

### POST `/api/auth/login/interno/`

**Caller:** `Login/index.jsx` — triggered on form submit when `userType === "internal"`

**Trigger:** User clicks "Access System" with Internal Staff selected.

**Request body:**
```json
{
  "username": "maria.garcia",
  "password": "••••••••"
}
```
The body is JSON-stringified with keys sorted alphabetically before sending (required by backend signature scheme).

**Expected response `200`:**
```json
{
  "access": "<JWT>",
  "refresh": "<JWT>",
  "usuario": {
    "id": 4,
    "username": "maria.garcia",
    "email": "maria@bocar.com",
    "grupos": ["Industrialization_Admin"]
  }
}
```

**Frontend consumes:**
- `data.access` → stored as cookie `access_token` (expires 1 day)
- `data.refresh` → stored as cookie `refresh_token` (expires 7 days)
- `data.usuario.grupos[0]` → used as `rol`, stored in `localStorage.user`
- `rol` stripped of `_Admin` becomes `rolParaRuta` for routing

**On failure:** `error` field from response body is displayed as inline error message.

---

### POST `/api/auth/login/proveedor/`

**Caller:** `Login/index.jsx` — triggered on form submit when `userType === "supplier"`

**Trigger:** User selects "Suppliers" user type and submits the form.

**Special header required:**
```
X-Signature: <HMAC-SHA256 hex>
```
Computed in the frontend via `CryptoJS.HmacSHA256(bodyString, "clave_secreta")`. The body string must have keys sorted alphabetically: `{"password":"...","username":"..."}`.

**Request body:** Same shape as internal login.

**Expected response `200`:** Same shape as internal login. `grupos` will contain `["Supplier"]`.

**Frontend consumes:** Identical to internal login flow.

**Note:** The secret key `"clave_secreta"` is hardcoded in the frontend. This must change to an environment variable before production.

---

### POST `/api/auth/token/refresh/`

**Caller:** `api.js` — `refreshAccessToken()` called automatically by `apiFetch()` on any `401` response.

**Trigger:** Any API call returns `401 Unauthorized` with an expired access token.

**Request:**
```json
{ "refresh": "<REFRESH_TOKEN>" }
```

**Expected response `200`:**
```json
{ "access": "<NEW_JWT>" }
```

**Frontend flow:** Replace `access_token` cookie with the new token and retry the original request. If refresh also fails, clear both cookies + localStorage and redirect to `/Login`.

---

## 2. RFQ Lists

All list calls use a single endpoint: `GET /api/rfqs/lista/?vista=all|draft`. Role scoping is automatic (backend filters by JWT user group). `api.js` functions call the correct `vista` parameter and apply additional client-side filtering where needed. Every row's `id` is an integer from `id_rfq`.

**Backend response shape (after `normalizeRFQ` in `api.js`):**
```json
{
  "id": 42,
  "title": "Molde Fascia Delantera",
  "type": "mold",
  "category": "Metal",
  "priority": "High",
  "status": "sent_to_purchases",
  "submitted_for_review": false,
  "lastModified": "2024-04-08",
  "createdBy": "ind_user",
  "offersCount": 2,
  "stage1": { "data": { "completionPercentage": 75 } },
  "stage3": { "data": { "responses": [ ... ] } }
}
```

`status` is always snake_case — use `STATUS_LABEL[status]` from `src/constants/rfqStatus.js` for display.

---

### Industrialization — All RFQs
**api.js:** `getIndustrializationAllRFQs()` → `GET /api/rfqs/lista/?vista=all`
Returns RFQs in `sent_to_purchases` and beyond (left Ind). Row click → `/Industrialization/rfq/{id}`.

### Industrialization — Drafts
**api.js:** `getIndustrializationDrafts()` → `GET /api/rfqs/lista/?vista=draft`
Returns **all** `industrialization_draft` RFQs (not filtered by creator). `completionPercentage` from backend drives the progress bar column.

### Purchases — All RFQs
**api.js:** `getPurchasesAllRFQs()` → `GET /api/rfqs/lista/?vista=all`
Returns RFQs in `sent_to_suppliers` and beyond.

### Purchases — Inbox (Not Answered)
**api.js:** `getPurchasesInbox()` → `GET /api/rfqs/lista/?vista=draft` filtered client-side to `status === 'sent_to_purchases'`

### Purchases — Drafts
**api.js:** `getPurchasesDrafts()` → `GET /api/rfqs/lista/?vista=draft` filtered client-side to `status === 'purchases_draft'`

### Suppliers — All RFQs
**api.js:** `getSuppliersAllRFQs()` → `GET /api/rfqs/lista/?vista=all`
Scoped to assigned RFQs in `waiting_for_suppliers`, `supplier_selected`, `rfq_closed`.

### Suppliers — Drafts (unresponded invitations)
**api.js:** `getSuppliersDrafts()` → `GET /api/rfqs/lista/?vista=draft`
Returns assigned RFQs in `sent_to_suppliers` / `waiting_for_suppliers` where `has_responded=False`.

### Suppliers — Inbox (Not Answered)
**api.js:** `getSuppliersInbox()` → same as Drafts

---

## 3. RFQ Detail

### GET `/api/rfqs/{id}/`

**Caller:** `components/layout/RFQDetails.jsx` — on mount, `id` comes from `useParams()`
**Triggered by:** Clicking any row in any RFQ table (all three roles)

**Logic:** Fetches the full RFQ object normalized by `normalizeRFQDetail()` in `api.js`. The component determines which stages to display based on the URL path (`userRole` from `location.pathname`):
- `/Industrialization/rfq/:id` → can edit stage1 (specifications + document uploads via `handleDocUpload()`); "Submit for Approval" button added alongside "Save Changes"
- `/Purchases/rfq/:id` → can edit stage2 (metadata + supplier picker); stage2 hidden from Supplier role. Edit mode offers "Save as Draft" (`submitted_for_review=false`) and "Submit for Approval" (`submitted_for_review=true`); "Send to Suppliers" admin button only appears in ActionBar (not in edit mode)
- `/Suppliers/rfq/:id` → sees `QuoteForm` in stage3, stage2 is hidden

**Actual normalized response shape (from `normalizeRFQDetail`):**
```json
{
  "id": 42,
  "title": "Molde Fascia Delantera",
  "type": "mold",
  "status": "sent_to_purchases",
  "priority": "High",
  "category": "Metal",
  "lastModified": "2024-04-08",
  "createdBy": "ind_user",
  "submitted_for_review": false,
  "is_winner": null,
  "response_deadline": null,
  "shipping_terms": "",
  "quality_requirements": "",
  "stage1": {
    "name": "Industrialization",
    "data": {
      "specifications": { "DESC": "...", "CUST": "...", "No_CAV": "2", ... },
      "documents": [{ "id": 1, "name": "specs.pdf", "date": "2024-04-01", "type": "pdf", "is3D": false }],
      "completionPercentage": 75
    }
  },
  "stage2": {
    "name": "Purchases",
    "data": {
      "suppliers": [{ "id": 6, "name": "supplier_user", "email": "...", "status": "Pending", "is_winner": false, "has_responded": false }],
      "metadata": { "responseDeadline": null, "shippingTerms": "", "qualityRequirements": "" }
    }
  },
  "stage3": {
    "name": "Suppliers",
    "data": {
      "responses": [{ "id": 0, "supplier": "supplier_user", "status": "Final Quote", "p1": {...}, "p2": {...} }],
      "statistics": { "responsesReceived": 1, "totalInvited": 2 }
    }
  }
}
```

`stage2` is `null` for Supplier role. `stage3` is `null` until `waiting_for_suppliers`.

---

### PATCH `/api/rfqs/{id}/especificaciones/`

**Caller:** `RFQDetails.jsx` `saveSection('stage1')` → `saveSpecifications(id, payload)`
**Request body for mold:** `{ "mold_info_p1": { "DESC": "...", "CUST": "..." }, "mold_info_p2": {...} }`
**Request body for die:** `{ "die_trim": { "DESC": "...", "Press": "..." } }`

---

### PATCH `/api/rfqs/{id}/compras-metadata/`

**Caller:** `RFQDetails.jsx` `saveSection('stage2')` → `savePurchasesMetadata(id, metadata)`
**Request body:** `{ "metadata": { "responseDeadline": "2024-04-30", "shippingTerms": "FOB Origin", "qualityRequirements": "ISO 9001" } }`

---

### GET `/api/rfqs/{id}/progreso/`

**Caller:** Available for on-demand refresh. Also injected into list responses as `completion_percentage`.
**Response:** `{ "percentage": 75, "filled": 6, "total": 8, "filled_fields": [...], "missing_fields": [...] }`

---

## 4. RFQ State Transitions (all wired in `RFQDetails.jsx` ActionBar)

| Action | Shown to | When | api.js function | Backend endpoint |
|--------|----------|------|-----------------|-----------------|
| Submit for Approval | Ind (non-admin) | `IND_DRAFT` + not submitted | `submitRFQForReview(id, type, tool)` | `PUT /api/rfq/{pk}/editar/` `{is_draft:false}` |
| Save + Submit for Approval | Ind (any) | `IND_DRAFT`, in stage1 edit mode | `saveAndSubmit()` (saves specs then submits) | `PATCH /rfqs/{pk}/especificaciones/` then `submitRFQForReview` |
| Approve → Purchases | Ind_Admin | `IND_DRAFT` + submitted | `approveRFQInd(id, true)` | `PATCH /api/rfqs/{pk}/revision-ind/` `{is_approved:true}` |
| Reject → Engineer | Ind_Admin | `IND_DRAFT` + submitted | `approveRFQInd(id, false)` | `PATCH /api/rfqs/{pk}/revision-ind/` `{is_approved:false}` |
| Save as Draft (suppliers) | Purchases (any) | `SENT_TO_PURCHASES` or `PURCHASES_DRAFT`, in stage2 edit | `savePurchaseDraft()` → `assignSuppliers(id, ids, true)` | `PUT /api/rfqs/{pk}/asignar-proveedores/` `{is_draft:true}` |
| Submit Supplier List | Purchases (any) | same, at least 1 supplier selected | `submitForApproval()` → `assignSuppliers(id, ids, false)` | `PUT /api/rfqs/{pk}/asignar-proveedores/` `{is_draft:false}` |
| Approve Supplier List | Purchases_Admin | `PURCHASES_DRAFT` + submitted | `approveSupplierList(id, 'aprobar')` | `PATCH /api/rfqs/{pk}/aprobar-proveedores/` |
| Reject Supplier List | Purchases_Admin | `PURCHASES_DRAFT` + submitted | `approveSupplierList(id, 'rechazar')` | same |
| Select as Winner | Purchases (any) | `WAITING_FOR_SUPPLIERS` (per response card) | `selectWinner(id, supplierId)` | `PATCH /api/rfqs/{pk}/seleccionar-proveedor/` `{proveedor_id:N}` |
| Final Award | Purchases_Admin | `SUPPLIER_SELECTED` | `finalManagerDecision(id, 'aprobar')` | `PATCH /api/rfqs/{pk}/fallo-gerencial/` |
| Reject Award | Purchases_Admin | `SUPPLIER_SELECTED` | `finalManagerDecision(id, 'rechazar')` | same |

Supplier quoting: `QuoteForm.jsx` renders inside stage3 and calls `submitQuote(rfqId, { is_draft, mold_cost_p1, … })` → `POST /api/rfqs/{pk}/cotizar/`.

After `sendToSuppliers()` completes (Purchases_Admin approves supplier list from ActionBar), the component navigates to `/Purchases/All-RFQ`.

---

## 5. RFQ Creation

### POST `/api/rfq/crear/`

**Caller:** `Industrialization/CreateRFQ.jsx` — `submitRFQ(isDraft)` function
**Already wired to real backend.**

**Trigger:** "Save as Draft" (step ≥ 2) or "Submit for Approval" (step 3, all fields valid)

**Request body — Die type:**
```json
{
  "tool": "CVT AIR GUIDE BR01-25025-1003",
  "type": "die",
  "is_draft": true,
  "die_trim": {
    "DESC": "Part description",
    "PPY": "35000",
    "CUST": "BMW",
    "PT_No": "900212614",
    "PROJ_L": "6 Years",
    "DTQB": "2024-06-01",
    "Press": "SEP 16-100",
    "No_cavities": "1x",
    "No_hydra_slides": "Defined by toolmaker",
    "Ful_Auto_proc": "Yes",
    "Presence_Detec": "Yes",
    "Trim_proc": "Cold",
    "Pun_pins_req": "Yes",
    "Admissible_res_burr_mm": "0.2",
    "Castings_supp": "Yes",
    "Adjust_opt_tool_maker": "Yes",
    "Gas_spri": "No",
    "Desi_3D": false,
    "Desi_3D_notes": "",
    "Desi_2D": true,
    "Desi_2D_notes": "Include all views"
  }
}
```

**Request body — Mold type:**
```json
{
  "tool": "OIL PAN MOLD 2024",
  "type": "mold",
  "is_draft": false,
  "mold_info_p1": {
    "DESC": "Oil pan casting mold",
    "PPY": "40000",
    "CUST": "Volkswagen",
    "PT": "Oil Pan",
    "PNUM": "NK4E-6675-AA",
    "PRLF": "8 Years",
    "TT": "Die Cast",
    "DTQ": "2024-07-01",
    "ELAB": "Maria Garcia",
    "Smach": "Bühler 900T",
    "No_CAV": "1x",
    "No_ofHS": "2",
    "No_ofMS": "Defined by toolmaker"
  },
  "mold_info_p2": {
    "ThreeD": true,
    "ThreeD_notes": "Full solid model required",
    "FlAn": false,
    "FlAn_notes": ""
  }
}
```

**Expected response `200`:**
```json
{ "id_rfq": 42 }
```

**Frontend flow:**
- `is_draft: true` → shows "Draft saved — RFQ #42" feedback, stays on form
- `is_draft: false` → shows "RFQ #42 submitted for approval" feedback, resets form after 3s

---

## 6. Supplier Responses (Quotes)

These actions happen inside `RFQDetails.jsx` stage3 section, visible when `userRole === 'suppliers'`. Quotes are full cost-breakdown forms (mold: 5 parts, die: 4 parts), not simple amount fields.

### POST `/api/rfqs/{id}/cotizar/`

**Caller:** `Suppliers/QuoteForm.jsx` — `submitQuote(rfqId, data)`
**Trigger:** Supplier fills out the tabbed quote form and clicks "Submit Quote" or "Save Draft"

**Request body — Mold:**
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

**Request body — Die:**
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
- `true` → saves data, RFQ status unchanged
- `false` → sets `RFQ_Assignment.has_responded=True`; if RFQ was `sent_to_suppliers`, advances to `waiting_for_suppliers`

**Expected response:** `{ "message": "..." }`

**Frontend flow:** On success, `QuoteForm` shows a confirmation message. The form pre-populates on re-entry from `stage3.responses[0].p1..p5` in the detail response.

---

## 7. Documents / File Attachments

Document buttons (`Download`, `Preview 3D`) are rendered in `RFQDetails.jsx` stage1. Upload happens in `CreateRFQ.jsx` step 3 (after RFQ creation) and in `RFQDetails.jsx` stage1 edit mode.

### GET `/api/rfqs/{id}/documentos/{doc_id}/download/`

**Caller:** `RFQDetails.jsx` — "Download" button per document
**Trigger:** User clicks download on a document row
**Response:** Binary file stream with appropriate `Content-Disposition` header

---

### POST `/api/rfqs/{id}/documentos/`

**Caller:** `CreateRFQ.jsx` — after a successful RFQ creation (`id_rfq` from creation response), uploads all selected files via `uploadDocument(rfqId, file, type)`. Also callable from `RFQDetails.jsx` stage1 edit mode via `handleDocUpload()`.
**Trigger:** User selects files in `UploadCard` components in step 3, then submits the RFQ

**Request:** `multipart/form-data`
```
file: <binary>
type: "pdf" | "presentation" | "3d"
```

**Expected response:**
```json
{ "id": 3, "name": "Mold_Design.stp", "size": "25.6 MB", "type": "STEP", "is3D": true }
```

---

## 8. User Management

### GET `/api/usuarios/listar/`

**api.js function:** `getUsers()`
**Callers:**
- `Industrialization/Users.jsx` — on mount
- `Purchases/Users.jsx` — on mount

**Logic:** Returns all internal system users (not suppliers). Both Industrialization and Purchases see the same user list (admins can manage, standard users view only).

**Actual backend response (array, not wrapped):**
```json
[
  {
    "id": 4,
    "username": "ind_admin",
    "first_name": "Maria",
    "last_name": "Garcia",
    "email": "maria.garcia@bocar.com",
    "is_active": true,
    "last_login": "2024-04-15T10:30:00Z",
    "grupos": ["Industrialization_Admin"],
    "department": "Industrialization"
  }
]
```
Normalized by `normalizeUser()` into `{ id, name, username, email, role, department, status, lastLogin, permissions }`. `createdAt` is always `null` (Django `User.date_joined` not in serializer). `recentActivity` is always `[]`.

---

### GET `/api/usuarios/{id}/`

**api.js function:** `getUserById(id)`
**Caller:** `components/layout/UserDetails.jsx` — on mount, `id` from URL params
**Trigger:** Clicking a user row in the Users table → navigates to `/Industrialization/user/{id}`

**Expected response:** Single user object, same shape as list items.

---

### POST `/api/usuarios/crear/`

**Caller:** `UserDetails.jsx` — `handleSave()` when `isNewUser === true`
**Trigger:** Navigating to `/Industrialization/user/new-user` and filling + submitting the form

**Request body (required fields):**
```json
{
  "username": "juan.perez",
  "password": "SecurePass1!",
  "email": "juan.perez@bocar.com",
  "rol": "Industrialization"
}
```
Valid `rol` values: `SuperAdmin`, `Industrialization`, `Industrialization_Admin`, `Purchases`, `Purchases_Admin`, `Supplier`.

**Frontend flow:** On success → navigates to `/Industrialization/user/{newId}` using the ID returned by the backend.

**Note:** `CrearUsuarioView` responds with `UsuarioCreateSerializer` (minimal: `username`, `email`). `normalizeUser` will return an incomplete object until the user is re-fetched. Not a crash because the post-creation navigate uses the returned `id`.

---

### PATCH `/api/usuarios/{id}/`

**Caller:** `UserDetails.jsx` — `handleSave()` when editing an existing user
**Trigger:** Edit User → modify fields → Save Changes

**Request body:** Partial update — accepted fields: `email`, `first_name`, `last_name`, `rol` (exact Group name), `is_active` (boolean):
```json
{
  "rol": "Industrialization_Admin",
  "is_active": false
}
```

---

### DELETE `/api/usuarios/{id}/`

**Caller:** `UserDetails.jsx` — "Delete User" quick action button
**Trigger:** Clicking "Delete User" in the Quick Actions card

**Frontend flow:** On success → navigate back to the users list.

---

### POST `/api/usuarios/{id}/reset-password/`

**Caller:** `UserDetails.jsx` — "Reset Password" quick action button
**Request body:** `{}` — backend generates and sends a reset link to the user's email

---

## 9. Supplier Management

### GET `/api/proveedores/`

**api.js function:** `getSuppliers()`
**Caller:** `Purchases/SuppliersList.jsx` — on mount
**Trigger:** Navigating to Purchases → "Suppliers List" tab

**Expected response:** Array of supplier objects (each with `id`, `username`, `first_name`, `last_name`, `email`, `is_active`, `last_login`). Normalized by `normalizeSupplier()` in `api.js`.

**Row click:** navigates to `/Purchases/supplier/{id}` which renders `UserDetails.jsx`

---

### GET `/api/proveedores/{id}/`

**api.js function:** `getSupplierById(id)`
**Caller:** `UserDetails.jsx` — when `id` resolves to a supplier
**Trigger:** Clicking a supplier row from SuppliersList

---

### POST `/api/proveedores/`

**api.js function:** `createSupplier(data)`
**Caller:** `UserDetails.jsx` when navigated to `/Purchases/supplier/new-supplier`
**Request body:** Must include `username`, `password`, `email`. Backend forces `rol: 'Supplier'`.

---

### PATCH `/api/proveedores/{id}/`

**api.js function:** `updateSupplier(id, data)`
**Caller:** `UserDetails.jsx` — edit + save on an existing supplier profile

---

### DELETE `/api/proveedores/{id}/`

**api.js function:** `deleteSupplier(id)`
**Caller:** `UserDetails.jsx` — "Delete User" quick action (reused for suppliers)

---

## 10. RFQ ↔ Supplier Assignment

Supplier assignment uses a single bulk PUT endpoint. The Stage 2 panel in `RFQDetails.jsx` now has a full **Supplier Picker** UI: selected suppliers shown as removable badges, live-search input, and a clickable results list to add suppliers. Two save modes are available via the edit buttons.

### GET `/api/proveedores/`

**api.js function:** `getSuppliers()`
**Caller:** `RFQDetails.jsx` — called when `startEditing('stage2')` is triggered
**Trigger:** Purchases user clicks "Edit" on the Stage 2 (Purchases) section of an RFQ detail page

---

### PUT `/api/rfqs/{id}/asignar-proveedores/`

**api.js function:** `assignSuppliers(rfqId, proveedoresIds, isDraft=false)`
**Callers:**
- `RFQDetails.jsx` `savePurchaseDraft()` → `assignSuppliers(id, supplierIds, true)` — saves without submitting; navigates to `/Purchases/Drafts`
- `RFQDetails.jsx` `submitForApproval()` → `assignSuppliers(id, supplierIds, false)` — submits for Purchases_Admin review; navigates to `/Purchases/Drafts`

**Request body:**
```json
{ "proveedores_ids": [6, 9], "is_draft": false }
```
Replaces the entire supplier list atomically.

**`is_draft` behavior:**
- `true` → sets `submitted_for_review=False`, allows empty `proveedores_ids`
- `false` (default) → sets `submitted_for_review=True`, requires at least one supplier; Submit button is disabled in the UI when no suppliers are selected

**State transitions:**
- `sent_to_purchases` → advances to `purchases_draft`
- `purchases_draft` → stays `purchases_draft`, supplier list replaced

**Response 200:**
```json
{ "message": "...", "cantidad_proveedores": 2, "submitted_for_review": false }
```

---

## 11. Notifications

### GET `/api/notificaciones/`

**api.js function:** `getNotifications(department)`
**Caller:** `contexts/NotificationContext.jsx` — `loadNotificationsForRole(role)`
**Trigger:** Called initially on app load and again whenever `updateUserRole(pathname)` detects a route change that implies a different role.

**Query params needed:**
```
GET /api/notificaciones/?role=industrialization
```
or per-user:
```
GET /api/notificaciones/
```
(backend scopes to authenticated user's role automatically)

**Expected response:**
```json
{
  "notifications": [
    {
      "id": 1,
      "title": "RFQ Draft Saved",
      "message": "RFQ SOL-001 has been saved as draft",
      "type": "info",
      "categoryId": "industrialization_draft",
      "rfqId": "SOL-001",
      "date": "2024-05-20T10:30:00Z",
      "read": false
    }
  ]
}
```

**Frontend consumes:**
- `unreadCount` badge on NavBar is derived from `notifications.filter(n => !n.read).length`
- `categoryId` is resolved to a full category object using `NOTIFICATION_CATEGORIES` (from `notification-config.json`)
- Notification category preferences (enabled/disabled toggles) are stored in localStorage under `notif_prefs_{userId}` (per-user) or `notif_prefs_global` (fallback). These preferences are managed in `UserDetails.jsx` via `NotificationPreferencesCard`, not in `NotisSidebar.jsx`.

---

### PATCH `/api/notificaciones/{id}/`

**Caller:** `NotificationContext.jsx` — `markAsRead(notificationId)`
**Trigger:** User clicks a notification in the sidebar, or "Mark all as read"

**Request body:**
```json
{ "read": true }
```

For "mark all as read", call `PATCH /api/notificaciones/` with:
```json
{ "read_all": true }
```

---

### DELETE `/api/notificaciones/`

**Caller:** `NotificationContext.jsx` — `clearAll()`
**Trigger:** "Clear all" button in `NotisSidebar.jsx`
**Request:** No body — clears all notifications for the authenticated user

---

## 12. Dashboard / Analytics

### GET `/api/dashboard/industrializacion/?range=week`

**api.js function:** `getDashboardData(timeRange)`
**Caller:** `Industrialization/Dashboard.jsx` — in `useEffect` on `timeRange` change
**Trigger:** Page mount, or clicking Week / Month / Quarter buttons

**Query params:** `range` = `week` | `month` | `quarter`

**Expected response:**
```json
{
  "statusChangeData": {
    "labels": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    "draftToSent": [2.5, 3.2, 2.8, 4.1, 3.5, 2.9, 3.0],
    "createdToDraft": [1.2, 1.5, 1.3, 1.8, 1.4, 1.1, 1.3],
    "stats": {
      "avgDraftToSent": 3.2,
      "avgCreatedToDraft": 1.4,
      "fastestDraftToSent": 2.5,
      "slowestDraftToSent": 4.1
    }
  },
  "rfqDistributionData": {
    "labels": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    "drafts": [3, 2, 4, 3, 2, 1, 2],
    "accepted": [1, 2, 1, 2, 1, 1, 1],
    "declined": [0, 1, 0, 1, 0, 0, 1],
    "stats": {
      "totalDrafts": 17,
      "totalAccepted": 9,
      "totalDeclined": 3,
      "acceptanceRate": 34.6
    }
  }
}
```

**Frontend consumes:**
- `statusChangeData.labels` + `draftToSent`/`createdToDraft` → bar chart datasets
- `statusChangeData.stats.*` → KPI boxes (Avg. Draft → Sent, Fastest, Slowest, Efficiency Score)
- `rfqDistributionData.*` → second bar chart + acceptance rate progress bar

**Loading behavior:** The component shows a spinner (driven by `loading` state) while the request is in flight. The `getDashboardData` function currently uses a 500ms artificial delay to simulate this — the real endpoint replaces it.

---

## 13. api.js → Real Endpoint Map (current implementation)

All functions below are **already wired** to real endpoints in `api.js`. IDs are integers throughout.

| api.js function | Real endpoint | Notes |
|-----------------|--------------|-------|
| `getRFQById(id)` | `GET /api/rfqs/{id}/` | Returns `normalizeRFQDetail()` shape |
| `getIndustrializationAllRFQs()` | `GET /api/rfqs/lista/?vista=all` | Ind JWT → `sent_to_purchases` and beyond |
| `getIndustrializationDrafts()` | `GET /api/rfqs/lista/?vista=draft` | Own `industrialization_draft` RFQs |
| `getPurchasesAllRFQs()` | `GET /api/rfqs/lista/?vista=all` | Purchases JWT → `sent_to_suppliers` and beyond |
| `getPurchasesDrafts()` | `GET /api/rfqs/lista/?vista=draft` filtered to `purchases_draft` | |
| `getPurchasesInbox()` | `GET /api/rfqs/lista/?vista=draft` filtered to `sent_to_purchases` | |
| `getSuppliersAllRFQs()` | `GET /api/rfqs/lista/?vista=all` | Supplier JWT → assigned RFQs |
| `getSuppliersDrafts()` | `GET /api/rfqs/lista/?vista=draft` | Unresponded assigned RFQs |
| `getSuppliersInbox()` | `GET /api/rfqs/lista/?vista=draft` | Same as drafts |
| `getRFQProgress(id)` | `GET /api/rfqs/{id}/progreso/` | Returns `{ percentage, filled, total }` |
| `getUsers()` | `GET /api/usuarios/listar/` | Internal staff only (no Suppliers) |
| `getUserById(id)` | `GET /api/usuarios/{id}/` | |
| `createUser(data)` | `POST /api/usuarios/crear/` | Requires `username`, `password`, `email`, `rol` |
| `updateUser(id, data)` | `PATCH /api/usuarios/{id}/` | |
| `deleteUser(id)` | `DELETE /api/usuarios/{id}/` | |
| `resetUserPassword(id)` | `POST /api/usuarios/{id}/reset-password/` | |
| `getSuppliers()` | `GET /api/proveedores/` | |
| `getSupplierById(id)` | `GET /api/proveedores/{id}/` | |
| `createSupplier(data)` | `POST /api/proveedores/` | Forces `rol: 'Supplier'` |
| `updateSupplier(id, data)` | `PATCH /api/proveedores/{id}/` | |
| `deleteSupplier(id)` | `DELETE /api/proveedores/{id}/` | |
| `getNotifications()` | `GET /api/notificaciones/` | Returns `{ notifications: [...] }` |
| `markNotificationRead(id)` | `PATCH /api/notificaciones/{id}/` | Or `/api/notificaciones/` for all |
| `clearNotifications()` | `DELETE /api/notificaciones/` | |
| `getDashboardData(range)` | `GET /api/dashboard/industrializacion/?range={range}` | Returns `{ statusChange, rfqDistribution, kpis }` |
| `getPurchasesDashboardData(range)` | `GET /api/dashboard/compras/?range={range}` | Same shape |
| `getSupplierDashboardData()` | `GET /api/dashboard/proveedor/` | |
| `submitRFQForReview(id, type, tool)` | `PUT /api/rfq/{id}/editar/` `{is_draft:false}` | |
| `approveRFQInd(id, bool)` | `PATCH /api/rfqs/{id}/revision-ind/` | |
| `assignSuppliers(id, ids[], isDraft=false)` | `PUT /api/rfqs/{id}/asignar-proveedores/` | `isDraft=true` → save draft; `isDraft=false` → submit for review |
| `approveSupplierList(id, action)` | `PATCH /api/rfqs/{id}/aprobar-proveedores/` | |
| `selectWinner(id, supplierId)` | `PATCH /api/rfqs/{id}/seleccionar-proveedor/` | |
| `finalManagerDecision(id, action)` | `PATCH /api/rfqs/{id}/fallo-gerencial/` | |
| `submitQuote(id, data)` | `POST /api/rfqs/{id}/cotizar/` | Used by `QuoteForm.jsx` |
| `downloadDocument(rfqId, docId, name)` | `GET /api/rfqs/{rfqId}/documentos/{docId}/download/` | Fetch + blob |
| `uploadDocument(rfqId, file, type)` | `POST /api/rfqs/{rfqId}/documentos/` | multipart/form-data |
| `saveSpecifications(id, data)` | `PATCH /api/rfqs/{id}/especificaciones/` | |
| `savePurchasesMetadata(id, meta)` | `PATCH /api/rfqs/{id}/compras-metadata/` | |
| `getRFQFormConfig()` | Static JSON — no backend needed | |

`NOTIFICATION_CATEGORIES` is also static config — keep reading from `notification-config.json`.

---

## 14. Auth Token Lifecycle

```
User submits login form
       │
       ▼
POST /api/auth/login/interno/   or   POST /api/auth/login/proveedor/
       │
       ▼ 200
access_token (cookie, 1 day)
refresh_token (cookie, 7 days)
user object (localStorage)
       │
       ▼
App.jsx reads user from localStorage on mount
→ sets userRole → renders correct dashboard
       │
       ▼
Every api.js fetch sends Authorization: Bearer <access_token>
       │
       ▼ 401 (token expired)
POST /api/auth/token/refresh/  (send refresh_token)
       │
       ├─▶ 200 → update access_token cookie → retry original request
       └─▶ 401 → clear cookies + localStorage → redirect to /Login
       │
       ▼
User clicks logout (handleLogout in App.jsx)
→ clear access_token cookie
→ clear refresh_token cookie  
→ clear localStorage user
→ navigate to /Login
```

---

## 15. Complete Frontend Route → API Calls Matrix

| Frontend route | On mount calls | User actions call |
|----------------|---------------|-------------------|
| `/Login` | — | `POST /api/auth/login/interno/` or `/proveedor/` |
| `/Industrialization/Create-RFQ` | `getRFQFormConfig()` | `POST /api/rfq/crear/` |
| `/Industrialization/All-RFQ` | `getIndustrializationAllRFQs()` | row click → navigate |
| `/Industrialization/Drafts` | `getIndustrializationDrafts()` | row click → navigate |
| `/Industrialization/Dashboard` | `getDashboardData('week')` | time button → `getDashboardData(range)` |
| `/Industrialization/Users` | `getUsers()` | row click → navigate; Add → navigate |
| `/Industrialization/rfq/:id` | `getRFQById(id)` | Edit specs → `PATCH /rfqs/{id}/especificaciones/`; Send → state transition endpoint |
| `/Industrialization/user/:id` | `getUserById(id)` | Save → `PATCH /usuarios/{id}/`; Delete → `DELETE /usuarios/{id}/` |
| `/Industrialization/user/new-user` | — | Save → `POST /usuarios/crear/` |
| `/Purchases/Suppliers` | `getSuppliers()` | row click → navigate; Add → navigate |
| `/Purchases/Users` | `getUsers()` | row click → navigate |
| `/Purchases/All-RFQ` | `getPurchasesAllRFQs()` | row click → navigate |
| `/Purchases/Drafts` | `getPurchasesDrafts()` | row click → navigate |
| `/Purchases/Not-Answered-RFQs` | `getPurchasesInbox()` | row click → navigate |
| `/Purchases/rfq/:id` | `getRFQById(id)` + `getSuppliers()` (on stage2 edit) | Edit metadata → `PATCH /rfqs/{id}/compras-metadata/`; Assign suppliers (draft) → `PUT /rfqs/{id}/asignar-proveedores/` `{is_draft:true}`; Submit for review → same `{is_draft:false}`; Publish → state transition |
| `/Purchases/supplier/:id` | `getSupplierById(id)` | Save/Delete → supplier endpoints |
| `/Suppliers/All-RFQ` | `getSuppliersAllRFQs()` | row click → navigate |
| `/Suppliers/Drafts` | `getSuppliersDrafts()` | row click → navigate |
| `/Suppliers/Not-Answered-RFQ` | `getSuppliersInbox()` | row click → navigate |
| `/Suppliers/rfq/:id` | `getRFQById(id)` | Submit quote → `POST /api/rfqs/{id}/cotizar/` via `submitQuote()` in `QuoteForm.jsx` |
| `/Industrialization/Calendar` | — (simulated data) | Static — no backend call; role-specific events generated client-side |
| `/Industrialization/Chatbot` | — (simulated data) | Static — no backend call; pattern-matched responses |
| `/Purchases/Calendar` | — (simulated data) | Same as Industrialization variant |
| `/Purchases/Chatbot` | — (simulated data) | Same as Industrialization variant |
| `/Suppliers/Calendar` | — (simulated data) | Same as Industrialization variant |
| `/Suppliers/Chatbot` | — (simulated data) | Same as Industrialization variant |
| Anywhere (NavBar) | `getNotifications(role)` on role change | Mark read → `PATCH /notificaciones/{id}/`; Clear all → `DELETE /notificaciones/` |
