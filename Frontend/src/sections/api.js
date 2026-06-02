// api.js — central data layer wired to the real Django backend.
// Static config files (form fields, notification categories) stay as JSON imports.

import Cookies from 'js-cookie';
import notificationConfigData from './notification-config.json';
import rfqFormConfigData from './rfq-form-config.json';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

// Exported as a plain object so context/components can use it synchronously.
export const NOTIFICATION_CATEGORIES = notificationConfigData.categories;

// ── HTTP helpers ──────────────────────────────────────────────────────────────

function authHeaders() {
    const token = Cookies.get('access_token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

async function refreshAccessToken() {
    const refresh = Cookies.get('refresh_token');
    if (!refresh) throw new Error('No refresh token');
    const res = await fetch(`${BASE_URL}/api/auth/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
    });
    if (!res.ok) throw new Error('Refresh failed');
    const data = await res.json();
    Cookies.set('access_token', data.access, { expires: 1, sameSite: 'strict' });
    return data.access;
}

/**
 * Central fetch wrapper.
 * @param {string} url
 * @param {object} options  - Standard fetch options plus:
 *   noRedirect {boolean}   - When true, auth failures throw instead of redirecting to /Login.
 *                            Use for background/silent fetches (e.g. notifications) so a
 *                            failed refresh never triggers a page-reload loop.
 */
async function apiFetch(url, options = {}) {
    const { noRedirect = false, ...fetchOptions } = options;

    let res = await fetch(`${BASE_URL}${url}`, {
        ...fetchOptions,
        headers: { ...authHeaders(), ...(fetchOptions.headers ?? {}) },
    });

    // Auto-refresh on 401 then retry once
    if (res.status === 401) {
        try {
            await refreshAccessToken();
            res = await fetch(`${BASE_URL}${url}`, {
                ...fetchOptions,
                headers: { ...authHeaders(), ...(fetchOptions.headers ?? {}) },
            });
        } catch {
            Cookies.remove('access_token');
            Cookies.remove('refresh_token');
            localStorage.removeItem('user');
            if (!noRedirect) {
                window.location.href = '/Login';
            }
            throw new Error('Session expired');
        }
    }

    if (res.status === 204) return null;

    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(payload.error ?? payload.detail ?? `HTTP ${res.status}`);
    }
    return payload;
}

// Multipart upload (files) — no Content-Type header so browser sets the boundary
async function apiUpload(url, formData) {
    const token = Cookies.get('access_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${BASE_URL}${url}`, {
        method: 'POST',
        headers,
        body: formData,
    });
    if (res.status === 204) return null;
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(payload.error ?? `HTTP ${res.status}`);
    return payload;
}

// ── Normalizers ───────────────────────────────────────────────────────────────

function normalizeRFQ(r) {
    return {
        id: r.id_rfq,
        title: r.title ?? r.tool ?? '',
        type: r.type ?? '',
        category: r.category ?? '',
        priority: r.priority ?? '',
        status: r.status ?? '',
        submitted_for_review: r.submitted_for_review ?? false,
        lastModified: r.modified_date ? r.modified_date.split('T')[0] : null,
        createdBy: r.created_by ?? '',
        is_winner: r.is_winner ?? null,
        detalles_tecnicos: r.detalles_tecnicos ?? {},
        // stage1 carries completionPercentage injected by _inject_detalles on the backend
        stage1: { data: { completionPercentage: r.completion_percentage ?? 0 } },
        // Synthetic stage3 so components can read responses.length for offers count
        stage3: { data: { responses: Array.from({ length: r.offers_count ?? 0 }) } },
    };
}

function normalizeRFQDetail(r) {
    const documents = (r.documentos ?? []).map(d => ({
        id: d.id,
        name: d.name ?? d.nombre,
        date: d.date ?? (d.fecha_subida ? d.fecha_subida.split('T')[0] : null),
        type: d.type ?? d.file_type ?? '',
        is3D: d.is3D ?? d.is3d ?? false,
        uploadedBy: d.uploadedBy ?? r.created_by ?? '',
    }));

    return {
        id: r.id_rfq,
        title: r.title ?? r.tool ?? '',
        type: r.type ?? '',
        category: r.category ?? '',
        priority: r.priority ?? '',
        status: r.status ?? '',
        submitted_for_review: r.submitted_for_review ?? false,
        lastModified: r.modified_date ? r.modified_date.split('T')[0] : null,
        createdBy: r.created_by ?? '',
        is_winner: r.is_winner ?? null,
        response_deadline: r.response_deadline ?? null,
        shipping_terms: r.shipping_terms ?? '',
        quality_requirements: r.quality_requirements ?? '',
        stage1: r.stage1 ? {
            name: 'Industrialization',
            data: {
                specifications: r.stage1.p1 ?? r.stage1.die_trim ?? {},
                moldP2: r.stage1.p2 ?? {},
                documents,
                completionPercentage: 0,
            },
        } : null,
        stage2: r.stage2 ? {
            name: 'Purchases',
            data: {
                suppliers: (r.stage2.suppliers ?? []).map(s => ({
                    id: s.id,
                    name: s.username,
                    email: s.email ?? '',
                    status: s.is_winner ? 'Selected' : (s.has_responded ? 'Responded' : 'Pending'),
                    is_winner: s.is_winner,
                    has_responded: s.has_responded,
                    amount: '-',
                    deadline: r.response_deadline ?? null,
                })),
                metadata: {
                    responseDeadline: r.response_deadline ?? null,
                    shippingTerms: r.shipping_terms ?? '',
                    qualityRequirements: r.quality_requirements ?? '',
                },
            },
        } : null,
        stage3: r.stage3 ? {
            name: 'Suppliers',
            data: {
                responses: (r.stage3.responses ?? []).map((resp, i) => ({
                    id: i,
                    supplier: resp.supplier,
                    status: 'Final Quote',
                    amount: null,
                    unitPrice: null,
                    deliveryTime: null,
                    p1: resp.p1 ?? {},
                    p2: resp.p2 ?? {},
                    p3: resp.p3 ?? {},
                    p4: resp.p4 ?? {},
                    p5: resp.p5 ?? {},
                })),
                statistics: r.stage3.statistics ?? { responsesReceived: 0, totalInvited: 0 },
            },
        } : null,
    };
}

function normalizeUser(u) {
    const fullName = [u.first_name, u.last_name].filter(Boolean).join(' ');
    return {
        id: u.id,
        name: fullName || u.username,
        username: u.username,
        email: u.email ?? '',
        role: u.grupos?.[0] ?? '',
        department: u.department ?? u.grupos?.[0] ?? '',
        status: u.is_active ? 'active' : 'inactive',
        lastLogin: u.last_login ? u.last_login.split('T')[0] : null,
        createdAt: null,
        recentActivity: [],
        permissions: u.grupos ?? [],
    };
}

function normalizeSupplier(s) {
    const fullName = [s.first_name, s.last_name].filter(Boolean).join(' ');
    return {
        id: s.id,
        name: fullName || s.username,
        username: s.username,
        email: s.email ?? '',
        role: 'Supplier',
        department: 'Suppliers',
        status: s.status ?? (s.is_active ? 'active' : 'inactive'),
        lastLogin: s.last_login ? s.last_login.split('T')[0] : null,
        recentActivity: [],
        permissions: ['View RFQs', 'Respond to RFQs'],
    };
}

function normalizeNotification(n) {
    return {
        id: n.id,
        title: n.title ?? n.titulo ?? '',
        message: n.message ?? n.mensaje ?? '',
        type: n.type ?? n.tipo ?? 'info',
        categoryId: n.categoryId ?? n.category_id ?? '',
        rfqId: n.rfqId ?? n.rfq_id ?? null,
        date: n.date ?? n.fecha ?? null,
        read: n.read ?? n.leida ?? false,
    };
}

// ── RFQ ───────────────────────────────────────────────────────────────────────

export async function getRFQById(id) {
    const data = await apiFetch(`/api/rfqs/${id}/`);
    return normalizeRFQDetail(data);
}

// Industrialization views
export async function getIndustrializationAllRFQs() {
    const list = await apiFetch('/api/rfqs/lista/?vista=all');
    return list.map(normalizeRFQ);
}

export async function getIndustrializationDrafts() {
    const list = await apiFetch('/api/rfqs/lista/?vista=draft');
    return list.map(normalizeRFQ);
}

// Purchases views
export async function getPurchasesAllRFQs() {
    const list = await apiFetch('/api/rfqs/lista/?vista=all');
    return list.map(normalizeRFQ);
}

export async function getPurchasesDrafts() {
    // Backend returns both sent_to_purchases and purchases_draft for Purchases ?vista=draft
    // Purchases "Drafts" tab = supplier list being built = purchases_draft
    const list = await apiFetch('/api/rfqs/lista/?vista=draft');
    return list
        .filter(r => r.status === 'purchases_draft')
        .map(normalizeRFQ);
}

export async function getPurchasesInbox() {
    // Inbox = RFQs that arrived from Ind but Purchases hasn't acted on yet
    const list = await apiFetch('/api/rfqs/lista/?vista=draft');
    return list
        .filter(r => r.status === 'sent_to_purchases')
        .map(normalizeRFQ);
}

// Suppliers views
export async function getSuppliersAllRFQs() {
    const list = await apiFetch('/api/rfqs/lista/?vista=all');
    return list.map(normalizeRFQ);
}

export async function getSuppliersDrafts() {
    const list = await apiFetch('/api/rfqs/lista/?vista=draft');
    return list.map(normalizeRFQ);
}

export async function getSuppliersInbox() {
    // Unresponded RFQs — backend filters has_responded=False for Supplier ?vista=draft
    const list = await apiFetch('/api/rfqs/lista/?vista=draft');
    return list.map(normalizeRFQ);
}

// ── RFQ mutations ─────────────────────────────────────────────────────────────

export async function saveSpecifications(rfqId, data) {
    return apiFetch(`/api/rfqs/${rfqId}/especificaciones/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
}

export async function savePurchasesMetadata(rfqId, metadata) {
    return apiFetch(`/api/rfqs/${rfqId}/compras-metadata/`, {
        method: 'PATCH',
        body: JSON.stringify({ metadata }),
    });
}

export async function getRFQProgress(rfqId) {
    return apiFetch(`/api/rfqs/${rfqId}/progreso/`);
}

export async function submitRFQForReview(rfqId, type, tool) {
    // Marks submitted_for_review=True by editing with is_draft:false
    return apiFetch(`/api/rfq/${rfqId}/editar/`, {
        method: 'PUT',
        body: JSON.stringify({ is_draft: false, type, tool }),
    });
}

export async function approveRFQInd(rfqId, isApproved) {
    return apiFetch(`/api/rfqs/${rfqId}/revision-ind/`, {
        method: 'PATCH',
        body: JSON.stringify({ is_approved: isApproved }),
    });
}

export async function assignSuppliers(rfqId, proveedoresIds, isDraft = false) {
    return apiFetch(`/api/rfqs/${rfqId}/asignar-proveedores/`, {
        method: 'PUT',
        body: JSON.stringify({ proveedores_ids: proveedoresIds, is_draft: isDraft }),
    });
}

export async function approveSupplierList(rfqId, action) {
    // action: 'aprobar' | 'rechazar'
    return apiFetch(`/api/rfqs/${rfqId}/aprobar-proveedores/`, {
        method: 'PATCH',
        body: JSON.stringify({ accion: action }),
    });
}

export async function selectWinner(rfqId, proveedorId) {
    return apiFetch(`/api/rfqs/${rfqId}/seleccionar-proveedor/`, {
        method: 'PATCH',
        body: JSON.stringify({ proveedor_id: proveedorId }),
    });
}

export async function finalManagerDecision(rfqId, action) {
    // action: 'aprobar' | 'rechazar'
    return apiFetch(`/api/rfqs/${rfqId}/fallo-gerencial/`, {
        method: 'PATCH',
        body: JSON.stringify({ accion: action }),
    });
}

export async function submitQuote(rfqId, data) {
    return apiFetch(`/api/rfqs/${rfqId}/cotizar/`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

// ── Documents ─────────────────────────────────────────────────────────────────

export async function getDocuments(rfqId) {
    return apiFetch(`/api/rfqs/${rfqId}/documentos/`);
}

export async function uploadDocument(rfqId, file, type = '') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return apiUpload(`/api/rfqs/${rfqId}/documentos/`, formData);
}

export async function downloadDocument(rfqId, docId, filename = 'document') {
    const token = Cookies.get('access_token');
    const res = await fetch(`${BASE_URL}/api/rfqs/${rfqId}/documentos/${docId}/download/`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ── Users ────────────────────────────────────────────────────────────────────

export async function getUsers() {
    const list = await apiFetch('/api/usuarios/listar/');
    return list.map(normalizeUser);
}

export async function getUserById(id) {
    const u = await apiFetch(`/api/usuarios/${id}/`);
    return normalizeUser(u);
}

export async function createUser(data) {
    // data must include: username, password, email, rol (exact Group name)
    const u = await apiFetch('/api/usuarios/crear/', {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return normalizeUser(u);
}

export async function updateUser(id, data) {
    const u = await apiFetch(`/api/usuarios/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
    return normalizeUser(u);
}

export async function deleteUser(id) {
    return apiFetch(`/api/usuarios/${id}/`, { method: 'DELETE' });
}

export async function resetUserPassword(id) {
    return apiFetch(`/api/usuarios/${id}/reset-password/`, { method: 'POST', body: '{}' });
}

// ── Suppliers ────────────────────────────────────────────────────────────────

export async function getSuppliers() {
    const list = await apiFetch('/api/proveedores/');
    return list.map(normalizeSupplier);
}

export async function getSupplierById(id) {
    const s = await apiFetch(`/api/proveedores/${id}/`);
    return normalizeSupplier(s);
}

export async function createSupplier(data) {
    // data must include: username, password, email
    const s = await apiFetch('/api/proveedores/', {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return normalizeSupplier(s);
}

export async function updateSupplier(id, data) {
    const s = await apiFetch(`/api/proveedores/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
    return normalizeSupplier(s);
}

export async function deleteSupplier(id) {
    return apiFetch(`/api/proveedores/${id}/`, { method: 'DELETE' });
}

// ── Notifications ─────────────────────────────────────────────────────────────

export async function getNotifications() {
    // noRedirect: notification fetches are silent background calls — a failed refresh
    // must never trigger window.location.href, which would cause a page-reload loop.
    const token = Cookies.get('access_token');
    if (!token) return [];   // Not logged in — skip entirely

    const data = await apiFetch('/api/notificaciones/', { noRedirect: true });
    const list = data?.notifications ?? (Array.isArray(data) ? data : []);
    return list.map(normalizeNotification);
}

export async function markNotificationRead(id) {
    if (id === 'all') {
        return apiFetch('/api/notificaciones/', {
            method: 'PATCH',
            body: JSON.stringify({ read_all: true }),
            noRedirect: true,
        });
    }
    return apiFetch(`/api/notificaciones/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ read: true }),
        noRedirect: true,
    });
}

export async function clearNotifications() {
    return apiFetch('/api/notificaciones/', { method: 'DELETE', noRedirect: true });
}

// ── Dashboard ────────────────────────────────────────────────────────────────

export async function getDashboardData(timeRange = 'week') {
    const data = await apiFetch(`/api/dashboard/industrializacion/?range=${timeRange}`);
    return {
        statusChange: data.statusChangeData,
        rfqDistribution: data.rfqDistributionData,
        estadoRequerimientos: data.estado_requerimientos,
        kpis: data.kpis,
    };
}

export async function getPurchasesDashboardData(timeRange = 'week') {
    const data = await apiFetch(`/api/dashboard/compras/?range=${timeRange}`);
    return {
        statusChange: data.statusChangeData,
        rfqDistribution: data.rfqDistributionData,
        funnelCotizaciones: data.funnel_cotizaciones,
        kpis: data.kpis,
    };
}

export async function getSupplierDashboardData() {
    return apiFetch('/api/dashboard/proveedor/');
}

// ── RFQ Form Config (stays static) ───────────────────────────────────────────

export async function getRFQFormConfig() {
    return rfqFormConfigData;
}
