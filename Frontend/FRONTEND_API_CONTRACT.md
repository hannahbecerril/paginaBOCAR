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

```
lev1 (created)
  → lev2 (ind. draft)
  → lev3 (pending ind. admin approval)
  → lev4 (purchases inbox)
  → lev5 (purchases draft — supplier list being built)
  → lev6 (published to suppliers — quotes open)
  → lev7 (quote analysis)
  → lev8 (pending final award)
  → lev9 (awarded / closed)
```

The frontend expresses these levels as human-readable status strings. The mapping is:

| Frontend status string | Backend level |
|------------------------|--------------|
| `industrialization draft` | lev2 |
| `sent to purchases` | lev3 → lev4 (transition) |
| `purchases draft` | lev5 |
| `sent to suppliers` | lev6 |
| `waiting for suppliers` | lev6 (some responded, not all) |
| `supplier response` | lev7 |
| `supplier selected` | lev8 |
| `rfq closed` | lev9 |

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

**Caller:** Not yet wired — needed in `api.js` as a request interceptor.

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

These are the endpoints `api.js` will call when its JSON-backed functions are swapped to real fetches. Each function currently filters `rfqs-data.json`; the filtering logic should move to the backend via query parameters.

---

### GET `/api/rfqs/lista/` — Industrialization: All RFQs

**api.js function:** `getIndustrializationAllRFQs()`
**Caller:** `Industrialization/AllRFQ.jsx` — on component mount

**Logic:** Returns all RFQs that Industrialization can see in their active view (anything not in draft status). The component filters server-side via the `exclude_drafts` param so the table shows progress already made.

**Query params needed:**
```
GET /api/rfqs/lista/?exclude_statuses=lev2
```
Or a role-scoped endpoint:
```
GET /api/rfqs/lista/?role=industrialization
```

**Expected response:**
```json
{
  "rfqs": [
    {
      "id": "SOL-001",
      "title": "High Precision Industrial Components",
      "category": "Metal",
      "priority": "High",
      "status": "sent to purchases",
      "lastModified": "2024-04-08",
      "stage3": { "data": { "responses": [] } }
    }
  ]
}
```

**Frontend consumes:**
- `id`, `title`, `category`, `priority`, `status`, `lastModified` → table row fields
- `stage3.data.responses.length` → "Offers" column count

**Row click:** navigates to `/Industrialization/rfq/{id}`

---

### GET `/api/rfqs/lista/?status=lev2` — Industrialization: Drafts

**api.js function:** `getIndustrializationDrafts()`
**Caller:** `Industrialization/Drafts.jsx` — on component mount

**Logic:** Only RFQs at level 2 (Industrialization draft). These are in-progress RFQs the engineer hasn't submitted for approval yet.

**Expected response fields additionally needed:**
```json
"stage1": { "data": { "completionPercentage": 65 } }
```
The `completionPercentage` drives the progress bar column in the Drafts table.

---

### GET `/api/rfqs/lista/?role=purchases` — Purchases: All RFQs

**api.js function:** `getPurchasesAllRFQs()`
**Caller:** `Purchases/AllRFQ.jsx` — on component mount

**Logic:** All RFQs in the Purchases active workflow (lev5–lev9, i.e. everything after the Purchases inbox). Excludes lev2/lev3/lev4 which are either drafts or the inbox.

---

### GET `/api/rfqs/lista/?status=lev5` — Purchases: Drafts

**api.js function:** `getPurchasesDrafts()`
**Caller:** `Purchases/Drafts.jsx`

**Logic:** RFQs where Purchases is currently editing the supplier list (lev5). Same shape as Industrialization drafts, uses `completionPercentage`.

---

### GET `/api/rfqs/lista/?status=lev4` — Purchases: Inbox (Not Answered)

**api.js function:** `getPurchasesInbox()`
**Caller:** `Purchases/NotAnsweredRFQ.jsx`

**Logic:** RFQs that Industrialization approved and sent to Purchases but which Purchases hasn't yet accepted/started working on. This is the Purchases "inbox". Columns are minimal: id, title, category, lastModified.

---

### GET `/api/rfqs/lista/?role=suppliers` — Suppliers: All RFQs

**api.js function:** `getSuppliersAllRFQs()`
**Caller:** `Suppliers/AllRFQ.jsx`

**Logic:** All RFQs assigned to this specific supplier that are in an active state (lev6–lev9). Must be scoped to the authenticated supplier's ID so they only see their own assignments.

---

### GET `/api/rfqs/lista/?status=supplier_draft` — Suppliers: Drafts

**api.js function:** `getSuppliersDrafts()`
**Caller:** `Suppliers/Drafts.jsx`

**Logic:** Supplier's own quote responses that are saved as draft (not yet submitted). These are draft *responses*, not draft RFQs — conceptually different from the Industrialization draft view.

---

### GET `/api/rfqs/lista/?status=lev6&no_response=true` — Suppliers: Inbox

**api.js function:** `getSuppliersInbox()`
**Caller:** `Suppliers/NotAnsweredRFQ.jsx`

**Logic:** RFQs this supplier has been invited to quote for but hasn't responded to yet. Drives the "Not Answered RFQs" view — the supplier's action queue.

---

## 3. RFQ Detail

### GET `/api/rfqs/{id}/`

**Caller:** `components/layout/RFQDetails.jsx` — on mount, `id` comes from `useParams()`
**Triggered by:** Clicking any row in any RFQ table (all three roles)

**Logic:** Fetches the full RFQ object with all three stages. The component determines which stages to display and whether edit buttons appear based on the URL path (derives `userRole` from `location.pathname`):
- `/Industrialization/rfq/:id` → can edit stage1 (specifications)
- `/Purchases/rfq/:id` → can edit stage2 (metadata), cannot see stage2 data as Supplier
- `/Suppliers/rfq/:id` → can edit stage3 (responses), stage2 is hidden

**Expected response:**
```json
{
  "id": "SOL-001",
  "title": "...",
  "description": "...",
  "status": "sent to purchases",
  "priority": "High",
  "category": "Metal",
  "createdAt": "2024-04-01",
  "lastModified": "2024-04-08",
  "createdBy": "Maria Garcia",
  "stage1": {
    "name": "Industrialization",
    "approvedBy": {
      "name": "Maria Garcia",
      "role": "Industrialization Manager",
      "approvedDate": "2024-04-07",
      "comments": "Approved"
    },
    "data": {
      "specifications": { "material": "...", "dimensions": "...", "..." : "..." },
      "documents": [
        { "id": 1, "name": "Tech_Specs.pdf", "size": "2.4 MB", "type": "PDF", "uploadedBy": "Maria Garcia", "date": "2024-04-01", "is3D": false },
        { "id": 2, "name": "CAD_Model.stp", "size": "12.5 MB", "type": "STEP", "uploadedBy": "Carlos Lopez", "date": "2024-04-02", "is3D": true }
      ],
      "defaultPreviewFile": 2,
      "completionPercentage": 100
    }
  },
  "stage2": {
    "name": "Purchases",
    "approvedBy": { "name": "Laura Fernandez", "approvedDate": null, "comments": "..." },
    "data": {
      "suppliers": [
        { "id": 1, "name": "Hydraulic Solutions Inc.", "contact": "...", "email": "...", "phone": "...", "status": "Pending", "amount": "-", "deadline": "2024-04-20", "invitedDate": "2024-04-05", "deliveryDate": null }
      ],
      "metadata": { "responseDeadline": "...", "remindersSent": 1, "priority": "...", "shippingTerms": "...", "qualityRequirements": "..." }
    }
  },
  "stage3": {
    "name": "Suppliers",
    "data": {
      "responses": [
        {
          "id": 1,
          "supplier": "RubberTech Industries",
          "contact": "Paul White",
          "email": "...",
          "phone": "...",
          "status": "Final Quote",
          "amount": "$12,500",
          "unitPrice": "$1.25",
          "deliveryTime": "3-4 weeks",
          "submittedDate": "2024-04-10",
          "documents": ["Quote_RTI_001.pdf"],
          "details": { "productionCapacity": "...", "paymentTerms": "...", "warranty": "..." }
        }
      ],
      "statistics": { "responsesReceived": 2, "totalInvited": 3, "averageQuote": "$12,850" }
    }
  }
}
```

**Stage visibility rules enforced by the component:**
- `stage2` is never shown when `userRole === 'suppliers'`
- Edit buttons only appear when the user's role matches the stage

---

### PATCH `/api/rfqs/{id}/especificaciones/`

**Caller:** `RFQDetails.jsx` `saveSection('stage1')`
**Triggered by:** Industrialization user clicks "Save Changes" after editing specs

**Request body:**
```json
{
  "specifications": {
    "material": "7075 Aluminum Alloy",
    "dimensions": "150mm x 75mm x 25mm",
    "weight": "1.2 kg per unit",
    "tolerance": "±0.01mm",
    "surfaceFinish": "Ra 0.8μm",
    "hardness": "HRC 45-50",
    "piecesRequired": 500,
    "piecesPerMonth": 100,
    "testingRequired": "Dimensional, Hardness"
  }
}
```

**Frontend flow:** On success → updates local `rfqData` state in-place (no refetch needed). On error → shows inline error message.

---

### PATCH `/api/rfqs/{id}/compras-metadata/`

**Caller:** `RFQDetails.jsx` `saveSection('stage2')`
**Triggered by:** Purchases user edits and saves RFQ metadata (deadline, terms, quality requirements)

**Request body:**
```json
{
  "metadata": {
    "responseDeadline": "2024-04-30",
    "remindersSent": 2,
    "priority": "High - Urgent",
    "shippingTerms": "FOB Origin",
    "qualityRequirements": "ISO 9001:2024"
  }
}
```

---

## 4. RFQ State Transitions

These endpoints advance the RFQ through the state machine. They are not yet wired in the frontend — the `RFQDetails.jsx` component will need action buttons (e.g. "Send to Purchases", "Approve", "Publish to Suppliers") that call these.

### POST `/api/rfqs/{id}/enviar-a-compras/`

**Who uses it:** Industrialization user or Industrialization_Admin
**When:** The RFQ is at lev2 (draft) or lev3 (pending approval) and is ready to move forward
**Frontend trigger (to be added):** "Send to Purchases" button in `RFQDetails.jsx` stage1 section, visible only when `userRole === 'industrialization'` and status is `industrialization draft`

**Logic:** Moves lev2 → lev3 (engineer sends for admin review) or lev3 → lev4 (admin approves, enters Purchases)

**Request:** `{}` (no body needed, identity comes from JWT)

**Expected response:** Updated RFQ status

---

### POST `/api/rfqs/{id}/aprobar-industrial/`

**Who uses it:** Industrialization_Admin
**When:** RFQ is at lev3 (pending Ind. approval)
**Frontend trigger:** Approve/Reject buttons in `RFQDetails.jsx` stage1, visible only to `Industrialization_Admin`

**Request:**
```json
{ "action": "approve", "comments": "Technical specs verified" }
```
or
```json
{ "action": "reject", "comments": "Missing tolerance data" }
```

---

### POST `/api/rfqs/{id}/publicar-proveedores/`

**Who uses it:** Purchases_Admin
**When:** RFQ is at lev5 (supplier list ready) → moves to lev6 (published)
**Frontend trigger:** "Publish to Suppliers" button in `RFQDetails.jsx` stage2, visible only to `Purchases_Admin`

**Request:** `{}` — the supplier list is already part of the RFQ at this point

---

### POST `/api/rfqs/{id}/seleccionar-proveedor/`

**Who uses it:** Purchases or Purchases_Admin
**When:** RFQ is at lev7 (quote analysis) → moves to lev8 then lev9
**Frontend trigger:** "Accept" button inside a supplier response card in `RFQDetails.jsx` stage3

**Request:**
```json
{ "response_id": 1, "comments": "Best value for quality" }
```

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

These actions happen inside `RFQDetails.jsx` stage3 section, visible when `userRole === 'suppliers'`.

### POST `/api/rfqs/{id}/respuestas/`

**Caller:** `RFQDetails.jsx` — `createNewResponse()` button
**Trigger:** Supplier clicks "Create Response" on an RFQ at `sent to suppliers` or `waiting for suppliers` status

**Request body:**
```json
{
  "status": "Draft",
  "amount": null,
  "unit_price": null,
  "delivery_time": null
}
```

**Expected response:** The newly created response object with its `id`

**Frontend flow:** Appends the new response card to stage3 in local state. Supplier then fills it in via the edit form.

---

### PATCH `/api/rfqs/{id}/respuestas/{response_id}/`

**Caller:** `RFQDetails.jsx` — `saveSection('stage3')`
**Trigger:** Supplier edits response fields and clicks "Save Changes"

**Request body:**
```json
{
  "supplier": "RubberTech Industries",
  "contact": "Paul White",
  "email": "paul@rubbertech.com",
  "amount": "$12,500",
  "unit_price": "$1.25",
  "delivery_time": "3-4 weeks",
  "status": "Final Quote"
}
```

---

### DELETE `/api/rfqs/{id}/respuestas/{response_id}/`

**Caller:** `RFQDetails.jsx` — `deleteResponse(id)` or `deleteResponseInEdit(id)`
**Trigger:** Delete icon on a response card (only shown for `userRole === 'suppliers'`)

---

## 7. Documents / File Attachments

Document buttons (`Download`, `Preview 3D`) are rendered in `RFQDetails.jsx` stage1. Upload happens in `CreateRFQ.jsx` step 3.

### GET `/api/rfqs/{id}/documentos/{doc_id}/download/`

**Caller:** `RFQDetails.jsx` — "Download" button per document
**Trigger:** User clicks download on a document row
**Response:** Binary file stream with appropriate `Content-Disposition` header

---

### POST `/api/rfqs/{id}/documentos/`

**Caller:** `CreateRFQ.jsx` — `UploadCard` components in step 3
**Trigger:** User selects and uploads a file (PDF, PPT, or CAD)

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

**Expected response:**
```json
{
  "users": [
    {
      "id": "maria-garcia",
      "name": "Maria Garcia",
      "email": "maria.garcia@bocar.com",
      "role": "Industrialization Manager",
      "department": "Industrialization",
      "status": "active",
      "lastLogin": "2024-04-15T10:30:00Z",
      "createdAt": "2024-01-15",
      "createdBy": "System Admin",
      "permissions": ["View RFQs", "Create RFQs", "Approve RFQs"],
      "recentActivity": [
        { "action": "Approved RFQ SOL-001", "date": "2024-04-15T10:30:00Z" }
      ]
    }
  ]
}
```

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

**Request body:**
```json
{
  "name": "Juan Perez",
  "email": "juan.perez@bocar.com",
  "role": "Industrialization Engineer",
  "department": "Industrialization",
  "status": "active",
  "permissions": ["View RFQs", "Create RFQs", "Edit Drafts"]
}
```

**Frontend flow:** On success → navigates to `/Industrialization/user/{newId}` using the ID returned by the backend.

---

### PATCH `/api/usuarios/{id}/`

**Caller:** `UserDetails.jsx` — `handleSave()` when editing an existing user
**Trigger:** Edit User → modify fields → Save Changes

**Request body:** Partial update — only the changed fields:
```json
{
  "role": "Industrialization Manager",
  "status": "inactive",
  "permissions": ["View RFQs"]
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

### GET `/api/proveedores/listar/`

**api.js function:** `getSuppliers()`
**Caller:** `Purchases/SuppliersList.jsx` — on mount
**Trigger:** Navigating to Purchases → "Suppliers List" tab

**Expected response:**
```json
{
  "suppliers": [
    {
      "id": "plastic-solutions",
      "name": "Plastic Solutions S.A.",
      "email": "maria@company.com",
      "role": "Supplier",
      "department": "Suppliers",
      "status": "active",
      "lastLogin": "2024-04-15T10:30:00Z",
      "createdAt": "2024-01-15",
      "createdBy": "System Admin",
      "permissions": ["View RFQs", "Respond to RFQs"],
      "recentActivity": [
        { "action": "Sent a response to RFQ SOL-005", "date": "2024-03-25T00:00:00Z" }
      ]
    }
  ]
}
```

**Row click:** navigates to `/Purchases/supplier/{id}` which renders `UserDetails.jsx`

---

### GET `/api/proveedores/{id}/`

**api.js function:** `getSupplierById(id)`
**Caller:** `UserDetails.jsx` — when `id` resolves to a supplier (found in `suppliersData` in the JSON layer)
**Trigger:** Clicking a supplier row from SuppliersList

---

### POST `/api/proveedores/crear/`

**Caller:** `UserDetails.jsx` when navigated to `/Purchases/supplier/new-supplier`
**Request body:** Same shape as user creation but for supplier accounts:
```json
{
  "name": "New Supplier Co.",
  "email": "contact@newsupplier.com",
  "status": "active"
}
```

---

### PATCH `/api/proveedores/{id}/`

**Caller:** `UserDetails.jsx` — edit + save on an existing supplier profile

---

### DELETE `/api/proveedores/{id}/`

**Caller:** `UserDetails.jsx` — "Delete User" quick action (reused for suppliers)

---

## 10. RFQ ↔ Supplier Assignment

These endpoints are needed by `RFQDetails.jsx` (Purchases view, stage2) when Purchases assigns which suppliers to invite.

### GET `/api/proveedores/listar/`

**Caller:** `RFQDetails.jsx` stage2 — "Add Supplier" dropdown (to be implemented)
**Trigger:** Purchases user clicks to add a supplier to the RFQ's supplier list

---

### POST `/api/rfqs/{id}/asignar-proveedor/`

**Caller:** `RFQDetails.jsx` stage2 — add supplier to an RFQ's supplier list
**Request body:**
```json
{ "supplier_id": 3, "deadline": "2024-04-20" }
```

---

### DELETE `/api/rfqs/{id}/asignar-proveedor/{supplier_id}/`

**Caller:** `RFQDetails.jsx` stage2 — remove a supplier from the invitation list before publishing

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
- Notifications are filtered client-side by `enabledCategories` (localStorage preference) and `userRole`
- `unreadCount` badge on NavBar is derived from `filteredNotifications.filter(n => !n.read).length`
- `categoryId` is resolved to a full category object using `NOTIFICATION_CATEGORIES` (now from `notification-config.json`)

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

## 13. api.js → Real Endpoint Migration Map

When switching from JSON to real backend, replace the body of each `api.js` function. The signatures stay identical so components don't change.

| api.js function | Real endpoint |
|-----------------|--------------|
| `getRFQById(id)` | `GET /api/rfqs/{id}/` |
| `getIndustrializationAllRFQs()` | `GET /api/rfqs/lista/?exclude_lev=lev2` |
| `getIndustrializationDrafts()` | `GET /api/rfqs/lista/?status=lev2` |
| `getPurchasesAllRFQs()` | `GET /api/rfqs/lista/?role=purchases&exclude_inbox=true` |
| `getPurchasesDrafts()` | `GET /api/rfqs/lista/?status=lev5` |
| `getPurchasesInbox()` | `GET /api/rfqs/lista/?status=lev4` |
| `getSuppliersAllRFQs()` | `GET /api/rfqs/lista/?assigned_to_me=true&min_lev=6` |
| `getSuppliersDrafts()` | `GET /api/rfqs/lista/?my_response_status=draft` |
| `getSuppliersInbox()` | `GET /api/rfqs/lista/?status=lev6&my_response=none` |
| `getUsers()` | `GET /api/usuarios/listar/` |
| `getUserById(id)` | `GET /api/usuarios/{id}/` |
| `getSuppliers()` | `GET /api/proveedores/listar/` |
| `getSupplierById(id)` | `GET /api/proveedores/{id}/` |
| `getNotifications(dept)` | `GET /api/notificaciones/` |
| `getDashboardData(range)` | `GET /api/dashboard/industrializacion/?range={range}` |
| `getRFQFormConfig()` | Static — keep reading from JSON (no backend needed) |

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
| `/Purchases/rfq/:id` | `getRFQById(id)` | Edit metadata → `PATCH /rfqs/{id}/compras-metadata/`; Publish → state transition |
| `/Purchases/supplier/:id` | `getSupplierById(id)` | Save/Delete → supplier endpoints |
| `/Suppliers/All-RFQ` | `getSuppliersAllRFQs()` | row click → navigate |
| `/Suppliers/Drafts` | `getSuppliersDrafts()` | row click → navigate |
| `/Suppliers/Not-Answered-RFQ` | `getSuppliersInbox()` | row click → navigate |
| `/Suppliers/rfq/:id` | `getRFQById(id)` | Create response → `POST /rfqs/{id}/respuestas/`; Save quote → `PATCH /rfqs/{id}/respuestas/{id}/` |
| Anywhere (NavBar) | `getNotifications(role)` on role change | Mark read → `PATCH /notificaciones/{id}/`; Clear all → `DELETE /notificaciones/` |
