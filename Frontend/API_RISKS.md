# API Risks — Frontend ↔ Backend Contract Comparison

**Compared sources:**
- Backend: `backend/core/urls.py` · `backend/api/views.py` · `backend/api/serializers.py`
- Frontend: `Frontend/src/sections/api.js` · `Frontend/src/components/layout/RFQDetails.jsx` · `Frontend/src/sections/Industrialization/CreateRFQ.jsx`
- **Last full audit: 2026-06-04**

**Severity:**
- 🔴 Critical — broken right now, blocks users
- 🟠 High — feature section broken
- 🟡 Medium — partial data or minor mismatch
- 🔵 Low — cosmetic / negligible impact
- ✅ Resolved / works correctly
- ⚪ Backend-only — endpoint exists, no frontend call needed

---

## 1. Authentication

| Frontend call | Backend endpoint | Status | Notes |
|---|---|---|---|
| `POST /api/auth/login/interno/` | `LoginInternoView` | ✅ | Returns `{ refresh, access, usuario: { id, username, email, grupos } }` |
| `POST /api/auth/login/proveedor/` + `X-Signature` header | `LoginProveedorView` | ✅ | HMAC key reads from `VITE_PROVEEDOR_HMAC_KEY` env var; backend reads `PROVEEDOR_SECRET_KEY` env var |
| `POST /api/auth/token/refresh/` (auto-called by `apiFetch` interceptor on 401) | `TokenRefreshView` | ✅ | |

---

## 2. RFQ Lists

| Frontend call | Backend endpoint | Status | Notes |
|---|---|---|---|
| `GET /api/rfqs/lista/?vista=all` (Ind token) | `RFQClasificadoListView` | ✅ | Returns `sent_to_purchases` and beyond |
| `GET /api/rfqs/lista/?vista=draft` (Ind token) | same | ✅ | Returns **all** `industrialization_draft` RFQs (no creator filter since recent backend change) |
| `GET /api/rfqs/lista/?vista=all` (Purchases token) | same | ✅ | Returns `sent_to_suppliers` and beyond |
| `GET /api/rfqs/lista/?vista=draft` (Purchases token) | same | ✅ | Returns `sent_to_purchases` + `purchases_draft`; frontend filters client-side for inbox vs drafts tab |
| `GET /api/rfqs/lista/?vista=all` (Supplier token) | same | ✅ | Returns assigned RFQs in `waiting_for_suppliers`, `supplier_selected`, `rfq_closed`. After submitting a Final Quote the RFQ advances to `waiting_for_suppliers` and becomes visible here. |
| `GET /api/rfqs/lista/?vista=draft` (Supplier token) | same | ✅ | Returns unresponded assigned RFQs in `sent_to_suppliers` / `waiting_for_suppliers` |

**Response shape match:**
Each item returned from the backend is normalized by `normalizeRFQ()` in `api.js`:

| Backend field | Normalized field | Status |
|---|---|---|
| `id_rfq` (int) | `id` (int) | ✅ |
| `tool` / `title` | `title` | ✅ Both present in serializer |
| `type` | `type` | ✅ |
| `category` | `category` | ✅ Added in migration 0011 |
| `priority` | `priority` | ✅ Added in migration 0011 |
| `status` (snake_case) | `status` | ✅ Displayed via `STATUS_LABEL[]` in TableComponent |
| `submitted_for_review` | `submitted_for_review` | ✅ |
| `modified_date` (ISO 8601) | `lastModified` (date only) | ✅ `.split('T')[0]` applied |
| `created_by` | `createdBy` | ✅ |
| `completion_percentage` (0–100) | `stage1.data.completionPercentage` | ✅ Injected by `_inject_detalles()` |
| `offers_count` | `stage3.data.responses.length` (synthetic Array) | ✅ Injected by `_inject_detalles()` |
| `detalles_tecnicos` (spec preview) | `detalles_tecnicos` | ✅ |

---

## 3. RFQ Detail

| Frontend call | Backend endpoint | Status | Notes |
|---|---|---|---|
| `GET /api/rfqs/{id}/` | `RFQDetailView` | ✅ | |

**Response shape match (after `normalizeRFQDetail`):**

| Backend field | Frontend field | Status | Notes |
|---|---|---|---|
| `id_rfq` | `id` | ✅ |
| `tool` + `title` alias | `title` | ✅ |
| `type` | `type` | ✅ |
| `status` | `status` | ✅ snake_case throughout |
| `category`, `priority` | `category`, `priority` | ✅ |
| `submitted_for_review` | `submitted_for_review` | ✅ |
| `modified_date` | `lastModified` (date only) | ✅ |
| `created_by` | `createdBy` | ✅ |
| `is_winner` | `is_winner` | ✅ Only non-null for Supplier + `supplier_selected` |
| `response_deadline`, `shipping_terms`, `quality_requirements` | same + in `stage2.data.metadata` | ✅ Added in migration 0012 |
| `documentos[]` (`name`, `date`, `type`, `is3D`, `uploadedBy`) | `stage1.data.documents[]` | ✅ English field names since migration 0012 |
| `stage1.p1` or `stage1.die_trim` | `stage1.data.specifications` | ✅ |
| `stage1.p2` | `stage1.data.moldP2` | ✅ |
| `stage2.suppliers[]` | `stage2.data.suppliers[]` | ✅ Username mapped to `name` |
| `stage3.responses[]` (with `p1`–`p5`) | `stage3.data.responses[]` | ✅ Parts preserved as `p1`–`p5`. For Supplier role, only that supplier's own response is included. |
| `stage3.statistics` | `stage3.data.statistics` | ✅ `responsesReceived` uses `has_responded=True` count |
| `stage3` now visible to Supplier from `sent_to_suppliers` | `RFQDetailView` | ✅ Fixed — was null until `waiting_for_suppliers`; `QuoteForm` was never visible for first responder |
| `description` field | *(not in model)* | 🔵 Minor — `RFQ_Base` has no description column. Detail card omitted from UI |
| `createdAt` field | *(not in model)* | 🔵 Minor — only `modified_date` is tracked. Header shows `lastModified` |
| `stage1.approvedBy` | *(not returned)* | 🔵 Low — no approval metadata tracked. Approval banner hidden |
| `completionPercentage` in detail | hardcoded 0 in `normalizeRFQDetail` | 🟡 Medium — list view injects correctly via `_inject_detalles`, but detail route doesn't call `progreso/`. Should call `getRFQProgress` or inject in `RFQDetailView` |

---

## 4. RFQ Progress

| Frontend call | Backend endpoint | Status | Notes |
|---|---|---|---|
| `GET /api/rfqs/{id}/progreso/` via `getRFQProgress(id)` | `RFQProgresoView` | ✅ |
| Injected in list via `completion_percentage` | `_inject_detalles()` | ✅ No extra request needed for lists |

**Remaining:** Detail page (`RFQDetails.jsx`) does not call `getRFQProgress` — `completionPercentage` is hardcoded 0 in `normalizeRFQDetail`. Fix: call `getRFQProgress(id)` inside `RFQDetailView.get()` and add `completion_percentage` to the response, or call it client-side in `RFQDetails.jsx` after mount.

---

## 5. RFQ State Transitions

| Action | Frontend call | Backend endpoint | Status | Notes |
|---|---|---|---|---|
| Submit for review | `submitRFQForReview(id, type, tool)` → `PUT /api/rfq/{id}/editar/` | `EditarRFQView` | ✅ | Sets `submitted_for_review=True` |
| Ind_Admin approve | `approveRFQInd(id, true)` → `PATCH /api/rfqs/{id}/revision-ind/` | `ReviewRFQIndView` | ✅ | |
| Ind_Admin reject | `approveRFQInd(id, false)` → same | same | ✅ | |
| Assign suppliers (draft) | `assignSuppliers(id, ids[], true)` → `PUT /api/rfqs/{id}/asignar-proveedores/` | `AssignSuppliersRFQView` | ✅ | `savePurchaseDraft()` in stage2 edit mode. Supplier picker UI added to `RFQDetails.jsx`. |
| Assign suppliers (submit) | `assignSuppliers(id, ids[], false)` → `PUT /api/rfqs/{id}/asignar-proveedores/` | `AssignSuppliersRFQView` | ✅ | `submitForApproval()` in stage2 edit mode. Submit button disabled when no suppliers selected. |
| Approve supplier list | `approveSupplierList(id, 'aprobar')` → `PATCH /api/rfqs/{id}/aprobar-proveedores/` | `AprobarRechazarProveedoresView` | ✅ | ActionBar wired |
| Reject supplier list | `approveSupplierList(id, 'rechazar')` → same | same | ✅ | ActionBar wired |
| Select winner | `selectWinner(id, supplierId)` → `PATCH /api/rfqs/{id}/seleccionar-proveedor/` | `SelectWinningSupplierView` | ✅ | Stage3 response card wired |
| Final award | `finalManagerDecision(id, 'aprobar')` → `PATCH /api/rfqs/{id}/fallo-gerencial/` | `FalloFinalGerencialView` | ✅ | ActionBar wired |
| Reject award | `finalManagerDecision(id, 'rechazar')` → same | same | ✅ | ActionBar wired |
| Submit quote | `submitQuote(id, payload)` → `POST /api/rfqs/{id}/cotizar/` | `CotizacionProveedorView` | ✅ | Called by `QuoteForm.jsx` |

**Note on `submitRFQForReview`:** Uses `EditarRFQView` which also resets `status` to `industrialization_draft`. This is safe for IND_DRAFT RFQs but would incorrectly regress a `sent_to_purchases` RFQ. The backend blocks edits at `sent_to_suppliers` and beyond, but not at `sent_to_purchases`. The ActionBar only shows this button when `status === IND_DRAFT`, so in practice this is not reachable from bad state — but the backend should also guard against it.

---

## 6. RFQ Creation

| Frontend call | Backend endpoint | Status | Notes |
|---|---|---|---|
| `createRFQ(payload)` → `POST /api/rfq/crear/` (via `api.js`) | `CrearRFQView` | ✅ | Uses `apiFetch()` — includes automatic 401 token refresh. Previously used raw `fetch()` which caused 401 errors when the token expired mid-form. |
| `POST /api/rfqs/{id}/documentos/` via `uploadDocument()` | `RFQDocumentListView.post` | ✅ | Called for each selected file after RFQ creation using `id_rfq` from creation response |

**Validation improvement:** `CreateRFQ.jsx` now validates all required step-2 fields at once and shows every missing field in a red dashed panel below the navigation buttons (not just the first failure). Step 3 shows an amber panel listing all remaining blockers for "Submit for Approval".

**Upload detection fix:** `UploadCard.jsx` previously had a stale closure bug in `simulateUpload` — it read from an empty `files` state array, so `onFileUpload` was never called and `CreateRFQ.jsx` never knew a file was selected (`canSubmit` was always false). Fixed by passing the raw `File` object directly to `simulateUpload` instead of reading from state.

---

## 7. RFQ Documents

| Frontend call | Backend endpoint | Status | Notes |
|---|---|---|---|
| Documents embedded in `GET /api/rfqs/{id}/` response | `RFQDetailView` | ✅ | `documentos` array included, `name`/`date`/`type`/`is3D`/`uploadedBy` all correct |
| `downloadDocument(rfqId, docId, name)` → `GET /api/rfqs/{id}/documentos/{docId}/download/` | `RFQDocumentDownloadView` | ✅ | fetch+blob approach (no query-param auth) |
| `uploadDocument(rfqId, file, type)` → `POST /api/rfqs/{id}/documentos/` | `RFQDocumentListView.post` | ✅ | Called from `CreateRFQ.jsx` after creation and from `RFQDetails.jsx` stage1 edit via `handleDocUpload()` |
| `getDocuments(rfqId)` → `GET /api/rfqs/{id}/documentos/` | `RFQDocumentListView.get` | ✅ | Function exists; not called separately (embedded in detail) |

---

## 8. Supplier Quote Form

| Frontend call | Backend endpoint | Status | Notes |
|---|---|---|---|
| `submitQuote(rfqId, { is_draft, mold_cost_p1..p5 })` | `CotizacionProveedorView` (POST) | ✅ | `QuoteForm.jsx` 5-tab mold form |
| `submitQuote(rfqId, { is_draft, die_cost_p1..p4 })` | same | ✅ | `QuoteForm.jsx` 4-tab die form |
| Pre-fill from `stage3.responses[0].p1..p5` | `RFQDetailView` stage3 data | ✅ | `cleanSeed()` strips DB-internal keys (`id`, `id_rfq_id`, `Last_change`, `Elaborated_by`, etc.) before seeding `formData` — prevents 500 on re-submission |

**Die quote 500 fixes:**
- `Last_change` (DateField in `DIE_COSTBR_P1_S`) was NOT NULL without a default — made nullable via migration 0013.
- `_clean_cost()` helper in `CotizacionProveedorView` now strips all DB/metadata keys and converts `null → 0` for numeric fields, preventing NOT NULL constraint errors on FloatFields across all four die cost blocks.
- `Elaborated_by` is always set server-side from the authenticated user — the frontend cannot spoof it.

**Submit Final Quote visibility:** The button is now **hidden** (not just disabled) until `formData.p1.Company` and `formData.p1.Country` are non-empty. A hint text appears when fields are missing.

**Post-quote navigation:** On successful Final Quote submission, `onSubmitSuccess` navigates to `/Suppliers/All-RFQ` where the RFQ appears in the updated `waiting_for_suppliers` status.

---

## 9. User Management

| Frontend call | Backend endpoint | Permission | Status | Notes |
|---|---|---|---|---|
| `GET /api/usuarios/listar/` | `ListarUsuariosView` | `IsInternalUser` | ✅ | Excludes Supplier group. Returns `UsuarioReadSerializer` |
| `GET /api/usuarios/{id}/` | `UsuarioDetailView.get` | `IsInternalUser` | ✅ | |
| `POST /api/usuarios/crear/` | `CrearUsuarioView` | `IsSuperAdmin` | ✅ | Requires `username`, `password`, `email`, `rol` |
| `PATCH /api/usuarios/{id}/` | `UsuarioDetailView.patch` | `IsSuperAdmin` | ✅ | Accepts `email`, `first_name`, `last_name`, `rol`, `is_active`, `password` (calls `set_password()`) |
| `DELETE /api/usuarios/{id}/` | `UsuarioDetailView.delete` | `IsSuperAdmin` | ✅ | |
| `POST /api/usuarios/{id}/reset-password/` | `ResetPasswordView` | `IsSuperAdmin` | ✅ | Placeholder — logs intent, no email sent |

**Response mapping (`UsuarioReadSerializer` → `normalizeUser`):**

| Backend field | Frontend field | Status |
|---|---|---|
| `id` | `id` | ✅ |
| `username` | `username` | ✅ |
| `first_name` + `last_name` | `name` (combined) | ✅ Falls back to `username` if empty |
| `email` | `email` | ✅ |
| `is_active` | `status` (`'active'/'inactive'`) | ✅ |
| `grupos` | `role` (first group) + `permissions` (all groups) | ✅ |
| `department` (computed from first group) | `department` | ✅ |
| `last_login` | `lastLogin` (date only) | ✅ |
| `createdAt` | `null` | 🔵 Django User has no `date_joined` in serializer |
| `recentActivity` | `[]` | 🔵 Not tracked |

**Create user response gap:** `CrearUsuarioView` uses `UsuarioCreateSerializer` for the response (minimal: only `username`, `email`). `normalizeUser` will receive an incomplete object — `role` and `department` will be empty until the user navigates to the detail page. Not a crash, but the post-creation navigate uses the returned `id` which is present.

---

## 10. Supplier Management

| Frontend call | Backend endpoint | Permission | Status | Notes |
|---|---|---|---|---|
| `GET /api/proveedores/` | `ProveedorListCreateView.get` | `IsPurchasesUser` | ✅ | |
| `GET /api/proveedores/{id}/` | `ProveedorDetailView.get` | `IsPurchasesUser` | ✅ | |
| `POST /api/proveedores/` | `ProveedorListCreateView.post` | `IsSuperAdmin` | ✅ | Forces `rol: 'Supplier'` |
| `PATCH /api/proveedores/{id}/` | `ProveedorDetailView.patch` | `IsPurchasesUser` | ✅ | Accepts `email`, `first_name`, `last_name`, `username`, `is_active`, `password` (calls `set_password()`) |
| `DELETE /api/proveedores/{id}/` | `ProveedorDetailView.delete` | `IsPurchasesUser` | ✅ | |

**Note:** PATCH and DELETE require only `IsPurchasesUser` — any Purchases user can delete suppliers. Consider raising to `IsPurchasesAdmin`.

**Response mapping (`ProveedorSerializer` → `normalizeSupplier`):**

| Backend field | Frontend field | Status |
|---|---|---|
| `id` | `id` | ✅ |
| `username` | `username` + `name` fallback | ✅ |
| `first_name` + `last_name` | `name` (combined) | ✅ |
| `email` | `email` | ✅ |
| `status` (computed `'active'/'inactive'`) | `status` | ✅ |
| `last_login` | `lastLogin` (date only) | ✅ |
| `recentActivity` | `[]` | 🔵 Not tracked |

---

## 11. Notifications

| Frontend call | Backend endpoint | Status | Notes |
|---|---|---|---|
| `GET /api/notificaciones/` | `NotificacionListView.get` | ✅ | Returns `{ notifications: [...] }` wrapper; `normalizeNotification` maps fields |
| `PATCH /api/notificaciones/` `{ read_all: true }` | `NotificacionListView.patch` | ✅ | Mark all as read |
| `DELETE /api/notificaciones/` | `NotificacionListView.delete` | ✅ | Clear all |
| `PATCH /api/notificaciones/{id}/` `{ read: true }` | `NotificacionDetailView.patch` | ✅ | Mark one as read |

**Response mapping (`NotificacionSerializer` → `normalizeNotification`):**

| Serializer field (English) | Frontend field | Status |
|---|---|---|
| `id` | `id` | ✅ |
| `title` (from `titulo`) | `title` | ✅ |
| `message` (from `mensaje`) | `message` | ✅ |
| `type` (from `tipo`) | `type` | ✅ |
| `categoryId` (from `category_id`) | `categoryId` | ✅ Matched against `NOTIFICATION_CATEGORIES` |
| `rfqId` (from `rfq.id_rfq`) | `rfqId` | ✅ Used for navigation |
| `read` (from `leida`) | `read` | ✅ |
| `date` (from `fecha`) | `date` | ✅ Used by `formatTime()` in sidebar |

**Gap:** `Notificacion` records are never created by any view (no `signals.py`, no `registrar_notificacion` helper). The notification table is always empty in the current implementation. The frontend UI renders correctly when empty (shows "No notifications"). Notifications would need to be emitted from state transition views.

**NotisSidebar changes:** Settings gear button and `NotificationConfig` integration have been removed from `NotisSidebar.jsx`. The component no longer accepts `onUpdateCategory`, `enabledCategories`, or `userRole` props. Notification preferences (category toggles, stored at `notif_prefs_{userId}` in localStorage) are now exclusively managed in `UserDetails.jsx` via the `NotificationPreferencesCard` component.

**NotificationContext changes:** Storage key changed from the global `'notification_categories'` to per-user `notif_prefs_{userId}` (falls back to `notif_prefs_global` if no user ID is available). `NavBar.jsx` no longer destructures `enabledCategories`, `updateCategorySettings`, or `userRole` from the context.

---

## 12. Dashboards

| Frontend call | Backend endpoint | Status | Notes |
|---|---|---|---|
| `GET /api/dashboard/industrializacion/?range=week\|month\|quarter` | `DashboardIndustrializacionView` | ✅ | Returns `statusChangeData` + `rfqDistributionData` + `kpis` + legacy `estado_requerimientos` |
| `GET /api/dashboard/compras/?range=week\|month\|quarter` | `DashboardComprasView` | ✅ | Same shape. Purchases Dashboard component wired. |
| `GET /api/dashboard/proveedor/` | `DashboardProveedorView` | ✅ | Function `getSupplierDashboardData()` exported in api.js but no Suppliers Dashboard component exists |

**Ind dashboard response → component mapping:**
- `data.statusChangeData` → `chartData.statusChange` (chart 1 datasets: `draftToSent`, `createdToDraft`, stats)
- `data.rfqDistributionData` → `chartData.rfqDistribution` (chart 2 datasets: `drafts`, `accepted`, `declined`, stats)
- `declined` series is always `[0, 0, …]` — no rejection event is tracked in `RFQ_Tracking`

---

## 12b. Role-Based UI Changes

The following navigation and access control changes were made in the section index files:

| Section | Change |
|---|---|
| `Industrialization/index.jsx` | "Users" tab hidden for non-admin users; `/Users` route redirects non-admins to Dashboard; Calendar and Assistant tabs always rendered last |
| `Purchases/index.jsx` | "Suppliers List" and "Users" tabs hidden for non-admin; `/Suppliers` and `/Users` routes redirect non-admins to Dashboard; default route is `Dashboard`; `sectionsFirst={true}` passed to NavBar (dropdown before tabs) |
| `Suppliers/index.jsx` | Calendar and Assistant tabs added |
| `Industrialization/Users.jsx` | Filters user list to only `Industrialization` and `Industrialization_Admin` roles |
| `Purchases/Users.jsx` | Filters user list to only `Purchases` and `Purchases_Admin` roles |
| `Industrialization/Drafts.jsx` | `submitted_for_review` shown as "Submitted for Approval" badge column; admin users see inline "Send to Purchases" and "Discard" action buttons for rows where `ready=true` |
| `Purchases/Drafts.jsx` | Same pattern — admin users see "Send to Suppliers" and "Discard" inline buttons |
| All table components (8 files) | `category` column now shows `rfq.type` ("mold"/"die") instead of `rfq.category` |

---

## 13. New Frontend Components (no backend calls)

The following components were added but make no backend API calls — they use static/simulated data:

| Component | File | Routes | Notes |
|---|---|---|---|
| `Calendar` | `components/layout/Calendar.jsx` | `/Industrialization/Calendar`, `/Purchases/Calendar`, `/Suppliers/Calendar` | Month/Week/Day/Agenda views; "Connected to Microsoft Outlook" badge; accepts `userRole` prop; generates role-specific events (deadlines, approvals, meetings, awards) |
| `Chatbot` | `components/layout/Chatbot.jsx` | `/Industrialization/Chatbot`, `/Purchases/Chatbot`, `/Suppliers/Chatbot` | Simulated AI procurement assistant; role-aware quick prompts; pattern-matched responses; accepts `userRole` prop |

---

## 13b. Backend Endpoints NOT Called by Frontend

These endpoints exist and work but no frontend code currently calls them. They are not gaps — they are either legacy, unused aliases, or future features.

| Endpoint | View | Why not called |
|---|---|---|
| `GET /api/rfqs/pendientes-aprobacion-gerencia/` | `RFQPendientesAprobacionComprasListView` | Replaced by `RFQClasificadoListView` with role scoping |
| `GET /api/rfq/buzon-proveedor/` | `BuzonProveedorListView` | Replaced by `lista/?vista=draft` (Supplier role) |
| `GET /api/rfqs/{pk}/comparativa/` | `ComparativaCotizacionesView` | Data now comes from `RFQDetailView` stage3 |
| `GET/POST/PUT/PATCH/DELETE /api/archivos/` | `ArchivoViewSet` (DRF router) | Legacy free-floating file CRUD, replaced by RFQ-scoped docs |
| `GET /api/archivos/{pk}/descargar/` | `DescargarArchivoSeguroView` | Replaced by RFQ-scoped download |
| `GET /api/usuarios/proveedores/` | `ProveedorListView` | Replaced by `/api/proveedores/` |
| `PUT /api/usuarios/{pk}/estado/` | `CambiarEstadoUsuarioView` | Covered by `PATCH /api/usuarios/{pk}/` with `is_active` field |
| `PATCH /api/notificaciones/bulk/` | `NotificacionBulkView` | Kept for backwards compatibility; main endpoint handles bulk ops |
| `GET /api/dashboard/proveedor/` | `DashboardProveedorView` | `getSupplierDashboardData()` exported but no Suppliers dashboard component |

---

## 14. Summary of Remaining Gaps

| # | Issue | Severity | Where | Fix |
|---|---|---|---|---|
| A | `completionPercentage` always 0 in RFQ detail page | 🟡 Medium | `normalizeRFQDetail` hardcodes 0. `RFQDetailView` does not include `completion_percentage`. | Call `getRFQProgress(id)` inside `RFQDetailView.get()` and add to response, or call it from `RFQDetails.jsx` `reloadRFQ` |
| B | ~~Supplier assignment has no UI button~~ | ✅ Resolved | Stage2 in `RFQDetails.jsx` now has a full supplier picker with search, add/remove badges, and separate Save Draft / Submit for Approval buttons | |
| C | `createUser` POST returns incomplete serializer | 🔵 Low | `CrearUsuarioView` responds with `UsuarioCreateSerializer` (no `grupos`). `normalizeUser` returns empty `role`/`department` immediately after creation. | Return `UsuarioReadSerializer` instead in `CrearUsuarioView`, or re-fetch after create |
| D | ~~Document upload not wired in `CreateRFQ.jsx`~~ | ✅ Resolved | `CreateRFQ.jsx` now calls `uploadDocument(rfqId, file, type)` for each selected file after the RFQ is created. Stage1 edit in `RFQDetails.jsx` also supports `handleDocUpload()`. | |
| E | Notifications never emitted by backend | 🔵 Low | `Notificacion` table is always empty — no state transition creates notification records. | Add `Notificacion.objects.create(...)` calls inside `registrar_tracking_rfq()` or via Django signals |
| F | Supplier dashboard data function unused | 🔵 Low | `getSupplierDashboardData()` exported but no Suppliers dashboard component exists. | Create `Suppliers/Dashboard.jsx` or remove the export |
| G | `submitRFQForReview` backend guard missing | 🔵 Low | `EditarRFQView` resets status to `IND_DRAFT` for any status below `sent_to_suppliers`. A `sent_to_purchases` RFQ could be accidentally re-drafted. ActionBar guards client-side, but no backend guard. | Add `sent_to_purchases` and `purchases_draft` to `EditarRFQView` locked statuses |
| H | Supplier PATCH/DELETE requires only `IsPurchasesUser` | 🔵 Low | Any Purchases user can delete a supplier. Should require `IsPurchasesAdmin`. | Change `ProveedorDetailView` permissions for PATCH/DELETE |

**Total:** 🟡 1 Medium · 🔵 5 Low — all major functional paths work end-to-end.

---

## 15. End-to-End Flow Verification

| User flow | All calls resolve | Notes |
|---|---|---|
| Internal login → dashboard redirect | ✅ | Role detected from `grupos[0]`, redirect to correct section |
| Supplier login → `/Suppliers` | ✅ | `Supplier` (singular) now matched correctly in App.jsx |
| SuperAdmin login → `/Industrialization` | ✅ | Fallback redirect added |
| Browse RFQ list (any role) | ✅ | `?vista=all/draft` + normalizeRFQ |
| Click RFQ → detail page | ✅ | Integer ID in URL → `GET /api/rfqs/{id}/` |
| Status badge in table | ✅ | Snake_case keys matched; `STATUS_LABEL` used for display |
| Progress bar in Drafts table | ✅ | `completion_percentage` from backend |
| Ind engineer submit for approval | ✅ | ActionBar → `submitRFQForReview` |
| Ind_Admin approve/reject | ✅ | ActionBar → `approveRFQInd` |
| Purchases assign suppliers (draft save) | ✅ | Stage2 supplier picker → `savePurchaseDraft()` → `assignSuppliers(id, ids, true)` |
| Purchases assign suppliers (submit for approval) | ✅ | Stage2 supplier picker → `submitForApproval()` → `assignSuppliers(id, ids, false)` |
| Purchases_Admin approve supplier list | ✅ | ActionBar |
| Supplier quote submission (mold/die) | ✅ | `QuoteForm.jsx` → `submitQuote` |
| Purchases select winner | ✅ | Stage3 card → `selectWinner` |
| Purchases_Admin final award | ✅ | ActionBar → `finalManagerDecision` |
| Download a document | ✅ | fetch+blob (no query-param token) |
| Notifications sidebar | ✅ | Renders; always empty until backend emits events |
| Mark notification read | ✅ | Optimistic update + `markNotificationRead` |
| View/edit user profile | ✅ | `getUserById` → `UserDetails.jsx` |
| Create new user | ✅ | Form sends `username`/`password`/`email`/`rol` |
| Create new supplier | ✅ | Forces `rol: Supplier` |
| Ind dashboard charts | ✅ | Time-series data from backend |
| Purchases dashboard charts | ✅ | Same shape via `DashboardComprasView` |
| Upload document during RFQ creation | ✅ | `CreateRFQ.jsx` uploads all selected files via `uploadDocument()` after creation |
| Upload replacement document in RFQ detail | ✅ | `RFQDetails.jsx` stage1 edit `handleDocUpload()` wired |
| Calendar view (all roles) | ✅ | Simulated — no backend call; role-specific events rendered client-side |
| AI assistant chatbot (all roles) | ✅ | Simulated — no backend call; pattern-matched responses |
| Logout | ✅ | `Cookies.remove()` for both tokens |
| Token expiry + auto-refresh | ✅ | `apiFetch` interceptor retries once on 401 |
