// sections/SuperAdmin/UserManagement.jsx
// SuperAdmin-only panel: list, create, edit, and soft-delete internal users.

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Users, Plus, Pencil, Search, X, RefreshCw, Shield, ShieldOff,
    Mail, User, Building2, ChevronDown, AlertCircle, CheckCircle2,
    Eye, EyeOff, ChevronsUpDown, ArrowUp, ArrowDown, Key,
} from 'lucide-react';
import {
    getUsers,
    createUser,
    updateUser,
    deactivateUser,
    INTERNAL_ROLES,
} from '../api';
import Button from '../../components/ui/Button';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const DEPARTMENT_LABELS = {
    SuperAdmin:             'Super Admin',
    Industrialization_Admin:'Industrialization Admin',
    Industrialization:      'Industrialization',
    Purchases_Admin:        'Purchases Admin',
    Purchases:              'Purchases',
};

const AREA_COLORS = {
    SuperAdmin:             { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.35)' },
    Industrialization_Admin:{ color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.35)'  },
    Industrialization:      { color: '#38bdf8', bg: 'rgba(56,189,248,0.12)',  border: 'rgba(56,189,248,0.35)'  },
    Purchases_Admin:        { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.35)'  },
    Purchases:              { color: '#4ade80', bg: 'rgba(74,222,128,0.12)',  border: 'rgba(74,222,128,0.35)'  },
};

function AreaBadge({ role }) {
    const style = AREA_COLORS[role] ?? { color: 'var(--text-secondary)', bg: 'var(--surface-hover)', border: 'var(--border-default)' };
    return (
        <span
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium border"
            style={{ color: style.color, backgroundColor: style.bg, borderColor: style.border }}
        >
            <Building2 size={11} />
            {DEPARTMENT_LABELS[role] ?? role ?? '—'}
        </span>
    );
}

function StatusBadge({ status }) {
    const isActive = status === 'active';
    return (
        <span
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold border"
            style={{
                color:           isActive ? 'var(--status-active)'    : 'var(--text-tertiary)',
                backgroundColor: isActive ? 'rgba(16,185,129,0.1)'    : 'var(--surface-disabled)',
                borderColor:     isActive ? 'var(--status-active)'    : 'var(--border-default)',
            }}
        >
            <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: isActive ? 'var(--status-active)' : 'var(--text-tertiary)' }}
            />
            {isActive ? 'Active' : 'Inactive'}
        </span>
    );
}

function Avatar({ name }) {
    const initials = name
        ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
        : '?';
    return (
        <div
            className="w-8 h-8 flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{
                background: 'linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-accent) 100%)',
                color: '#fff',
            }}
        >
            {initials}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Toast notification
// ─────────────────────────────────────────────────────────────────────────────

function Toast({ toast, onDismiss }) {
    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(onDismiss, 4000);
        return () => clearTimeout(timer);
    }, [toast, onDismiss]);

    if (!toast) return null;

    const isError = toast.type === 'error';
    return (
        <div
            className="fixed bottom-6 right-6 flex items-start gap-3 px-4 py-3 border text-sm max-w-sm shadow-lg"
            style={{
                backgroundColor: isError ? 'rgba(239,68,68,0.1)'   : 'rgba(16,185,129,0.1)',
                borderColor:     isError ? 'var(--brand-danger)'    : 'var(--brand-success)',
                color:           isError ? 'var(--brand-danger)'    : 'var(--brand-success)',
                zIndex: 'var(--z-toast)',
            }}
        >
            {isError ? <AlertCircle size={18} className="flex-shrink-0 mt-0.5" /> : <CheckCircle2 size={18} className="flex-shrink-0 mt-0.5" />}
            <span style={{ color: 'var(--text-primary)' }}>{toast.message}</span>
            <button onClick={onDismiss} style={{ color: 'var(--text-tertiary)' }} className="ml-auto">
                <X size={14} />
            </button>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Confirm Dialog (soft-delete / deactivate)
// ─────────────────────────────────────────────────────────────────────────────

function ConfirmDialog({ confirm, onCancel, onConfirm, loading }) {
    if (!confirm) return null;
    const isDeactivate = !confirm.user.is_active === false; // toggling to inactive
    const willDeactivate = confirm.user.is_active;

    return (
        <div
            className="fixed inset-0 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 'var(--z-modal-backdrop)' }}
            onClick={onCancel}
        >
            <div
                className="w-full max-w-sm p-6 border"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-dark)', zIndex: 'var(--z-modal)' }}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center gap-3 mb-4">
                    <div
                        className="w-10 h-10 flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: willDeactivate ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)' }}
                    >
                        {willDeactivate
                            ? <ShieldOff size={20} style={{ color: 'var(--brand-danger)' }} />
                            : <Shield size={20} style={{ color: 'var(--brand-success)' }} />}
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {willDeactivate ? 'Deactivate User' : 'Reactivate User'}
                        </h3>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                            {confirm.user.name}
                        </p>
                    </div>
                </div>
                <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                    {willDeactivate
                        ? 'This user will be blocked from logging in. Their data is preserved and this action can be reversed.'
                        : 'This user will regain access to the system immediately.'}
                </p>
                <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={onCancel} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        variant={willDeactivate ? 'danger' : 'success'}
                        size="sm"
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading
                            ? <span className="animate-spin w-3 h-3 border border-white border-t-transparent rounded-full" />
                            : (willDeactivate ? 'Deactivate' : 'Reactivate')}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// User Form Page (Create / Edit)
// ─────────────────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    rol: '',
    password: '',
    confirmPassword: '',
};

function UserFormPage({ mode, user, onClose, onSave }) {
    const isEdit = mode === 'edit';
    const [form, setForm] = useState(
        isEdit
            ? {
                username:        user.username,
                first_name:      user.firstName ?? '',
                last_name:       user.lastName  ?? '',
                email:           user.email     ?? '',
                rol:             user.role       ?? '',
                password:        '',
                confirmPassword: '',
            }
            : { ...EMPTY_FORM }
    );
    const [showPwd, setShowPwd]         = useState(false);
    const [submitting, setSubmitting]   = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});

    const set = (key, val) => {
        setForm(prev => ({ ...prev, [key]: val }));
        setFieldErrors(prev => ({ ...prev, [key]: undefined }));
    };

    const validate = () => {
        const errs = {};
        if (!isEdit && !form.username.trim()) errs.username = 'Required';
        if (!form.email.trim())               errs.email    = 'Required';
        if (!form.rol)                        errs.rol      = 'Select a role';
        if (!isEdit && !form.password)        errs.password = 'Required for new users';
        if (form.password && form.password !== form.confirmPassword)
            errs.confirmPassword = 'Passwords do not match';
        return errs;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setFieldErrors(errs); return; }

        setSubmitting(true);
        try {
            const payload = {
                first_name: form.first_name,
                last_name:  form.last_name,
                email:      form.email,
                rol:        form.rol,
            };
            if (!isEdit) {
                payload.username = form.username;
                payload.password = form.password;
            } else if (form.password) {
                payload.password = form.password;
            }

            const saved = isEdit
                ? await updateUser(user.id, payload)
                : await createUser(payload);

            onSave(saved, isEdit ? 'updated' : 'created');
        } catch (err) {
            setFieldErrors({ _global: err.message });
        } finally {
            setSubmitting(false);
        }
    };

    const Field = ({ label, name, type = 'text', required, children }) => (
        <div>
            <label
                className="block text-[10px] font-semibold uppercase tracking-wider mb-2"
                style={{ color: 'var(--text-tertiary)' }}
            >
                {label}{required && <span style={{ color: 'var(--brand-danger)' }}> *</span>}
            </label>
            {children ?? (
                <input
                    id={`um-field-${name}`}
                    type={type}
                    value={form[name]}
                    onChange={e => set(name, e.target.value)}
                    autoComplete="off"
                    className="w-full border px-3 py-2 text-sm text-center outline-none transition-all"
                    style={{
                        backgroundColor: 'var(--surface)',
                        borderColor: fieldErrors[name] ? 'var(--brand-danger)' : 'var(--border-default)',
                        color: 'var(--text-primary)',
                    }}
                    onFocus={e => {
                        if (!fieldErrors[name]) e.target.style.borderColor = 'var(--ring)';
                    }}
                    onBlur={e => {
                        if (!fieldErrors[name]) e.target.style.borderColor = 'var(--border-default)';
                    }}
                />
            )}
            {fieldErrors[name] && (
                <p className="text-xs mt-1" style={{ color: 'var(--brand-danger)' }}>
                    {fieldErrors[name]}
                </p>
            )}
        </div>
    );

    return (
        <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <button
                type="button"
                onClick={onClose}
                className="mb-6 flex items-center gap-2 text-sm font-medium transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
                <X size={16} /> Back to Users
            </button>
            <div
                className="w-full border shadow-sm rounded-md"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-default)' }}
            >
                {/* Page header */}
                <div
                    className="flex items-center px-8 py-6 border-b"
                    style={{ borderColor: 'var(--border-default)' }}
                >
                    <div className="flex items-center gap-4">
                        <div
                            className="w-12 h-12 flex items-center justify-center rounded-lg"
                            style={{ backgroundColor: 'rgba(59,130,246,0.1)' }}
                        >
                            {isEdit ? <Pencil size={24} style={{ color: '#0f2742' }} /> : <Plus size={24} style={{ color: '#0f2742' }} />}
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                                {isEdit ? 'Edit User' : 'Create New User'}
                            </h2>
                            <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
                                {isEdit ? `Editing user profile: ${user.name}` : 'Add a new internal user to the system'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-8 py-6 space-y-8" noValidate>
                    {fieldErrors._global && (
                        <div
                            className="flex items-center gap-2 px-3 py-2 border text-xs mb-4"
                            style={{ borderColor: 'var(--brand-danger)', backgroundColor: 'rgba(239,68,68,0.08)', color: 'var(--brand-danger)' }}
                        >
                            <AlertCircle size={14} />
                            {fieldErrors._global}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Username — only on create */}
                        {!isEdit && (
                            <Field label="Username" name="username" required />
                        )}

                        <Field label="First Name" name="first_name" />
                        <Field label="Last Name"  name="last_name"  />

                        {/* Email */}
                        <Field label="Email Address" name="email" type="email" required />

                        {/* Role / Area */}
                        <Field label="Role / Area" name="rol" required>
                            <select
                                id="um-field-rol"
                                value={form.rol}
                                onChange={e => set('rol', e.target.value)}
                                className="w-full border px-3 py-2 text-sm text-center outline-none transition-all cursor-pointer"
                                style={{
                                    backgroundColor: 'var(--surface)',
                                    borderColor: fieldErrors.rol ? 'var(--brand-danger)' : 'var(--border-default)',
                                    color: 'var(--text-primary)',
                                }}
                            >
                                <option value="">Select a role…</option>
                                {INTERNAL_ROLES.map(r => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                            {fieldErrors.rol && (
                                <p className="text-xs mt-1" style={{ color: 'var(--brand-danger)' }}>{fieldErrors.rol}</p>
                            )}
                        </Field>
                    </div>

                    {/* Password */}
                    <div className="pt-4 mt-6 border-t" style={{ borderColor: 'var(--border-light)' }}>
                        <p className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>
                            {isEdit ? 'Change Password (optional)' : 'Set Password *'}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <div className="relative">
                                    <input
                                        id="um-field-password"
                                        type={showPwd ? 'text' : 'password'}
                                        value={form.password}
                                        onChange={e => set('password', e.target.value)}
                                        placeholder={isEdit ? 'New password…' : 'Password'}
                                        autoComplete="new-password"
                                        className="w-full border px-3 py-2 pr-9 text-sm text-center outline-none transition-all"
                                        style={{
                                            backgroundColor: 'var(--surface)',
                                            borderColor: fieldErrors.password ? 'var(--brand-danger)' : 'var(--border-default)',
                                            color: 'var(--text-primary)',
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPwd(p => !p)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2"
                                        style={{ color: 'var(--text-tertiary)' }}
                                        tabIndex={-1}
                                    >
                                        {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                                {fieldErrors.password && (
                                    <p className="text-xs mt-1" style={{ color: 'var(--brand-danger)' }}>{fieldErrors.password}</p>
                                )}
                            </div>
                            <div>
                                <input
                                    id="um-field-confirm-password"
                                    type={showPwd ? 'text' : 'password'}
                                    value={form.confirmPassword}
                                    onChange={e => set('confirmPassword', e.target.value)}
                                    placeholder="Confirm"
                                    autoComplete="new-password"
                                    className="w-full border px-3 py-2 text-sm text-center outline-none transition-all"
                                    style={{
                                        backgroundColor: 'var(--surface)',
                                        borderColor: fieldErrors.confirmPassword ? 'var(--brand-danger)' : 'var(--border-default)',
                                        color: 'var(--text-primary)',
                                    }}
                                />
                                {fieldErrors.confirmPassword && (
                                    <p className="text-xs mt-1" style={{ color: 'var(--brand-danger)' }}>{fieldErrors.confirmPassword}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-2 pt-4 mt-6 border-t" style={{ borderColor: 'var(--border-light)' }}>
                        <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={submitting} id="um-form-submit">
                            {submitting
                                ? <><span className="animate-spin w-3 h-3 border border-white border-t-transparent rounded-full" /> Saving…</>
                                : (isEdit ? 'Save Changes' : 'Create User')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function UserManagement() {
    const [users,       setUsers]       = useState([]);
    const [loading,     setLoading]     = useState(true);
    const [error,       setError]       = useState(null);
    const [search,      setSearch]      = useState('');
    const [filterRole,  setFilterRole]  = useState('');
    const [filterStatus,setFilterStatus]= useState('');
    const [sortConfig,  setSortConfig]  = useState({ key: 'name', dir: 'asc' });
    const [modal,       setModal]       = useState(null);   // null | { mode:'create'|'edit', user? }
    const [confirm,     setConfirm]     = useState(null);   // null | { user }
    const [toast,       setToast]       = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    // ── Load users ─────────────────────────────────────────────────────────────
    const loadUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (err) {
            setError(err.message ?? 'Failed to load users');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadUsers(); }, [loadUsers]);

    // ── Filtering + Sorting ────────────────────────────────────────────────────
    const processedUsers = useMemo(() => {
        let result = users;

        if (search) {
            const q = search.toLowerCase();
            result = result.filter(u =>
                u.name.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q) ||
                u.username.toLowerCase().includes(q)
            );
        }
        if (filterRole)   result = result.filter(u => u.role === filterRole);
        if (filterStatus) result = result.filter(u => u.status === filterStatus);

        return [...result].sort((a, b) => {
            const aV = (a[sortConfig.key] ?? '').toString().toLowerCase();
            const bV = (b[sortConfig.key] ?? '').toString().toLowerCase();
            if (aV < bV) return sortConfig.dir === 'asc' ? -1 : 1;
            if (aV > bV) return sortConfig.dir === 'asc' ?  1 : -1;
            return 0;
        });
    }, [users, search, filterRole, filterStatus, sortConfig]);

    const toggleSort = (key) => {
        setSortConfig(prev =>
            prev.key === key
                ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
                : { key, dir: 'asc' }
        );
    };

    // ── Actions ────────────────────────────────────────────────────────────────
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
    };

    const handleSaveUser = async (savedUser, action) => {
        setUsers(prev =>
            action === 'created'
                ? [...prev, savedUser]
                : prev.map(u => u.id === savedUser.id ? savedUser : u)
        );
        setModal(null);
        showToast(
            action === 'created'
                ? `User "${savedUser.name}" created successfully.`
                : `User "${savedUser.name}" updated successfully.`
        );
    };

    const handleToggleStatus = async () => {
        if (!confirm) return;
        setActionLoading(true);
        try {
            const updated = await deactivateUser(confirm.user.id, !confirm.user.is_active);
            setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
            showToast(
                updated.is_active
                    ? `"${updated.name}" has been reactivated.`
                    : `"${updated.name}" has been deactivated.`
            );
        } catch (err) {
            showToast(err.message ?? 'Action failed', 'error');
        } finally {
            setActionLoading(false);
            setConfirm(null);
        }
    };

    // ── Sort icon helper ───────────────────────────────────────────────────────
    const SortIcon = ({ col }) => {
        if (sortConfig.key !== col)
            return <ChevronsUpDown size={12} style={{ color: 'var(--text-tertiary)' }} />;
        return sortConfig.dir === 'asc'
            ? <ArrowUp   size={12} style={{ color: '#0f2742' }} />
            : <ArrowDown size={12} style={{ color: '#0f2742' }} />;
    };

    // ── Stats ──────────────────────────────────────────────────────────────────
    const stats = useMemo(() => ({
        total:    users.length,
        active:   users.filter(u => u.is_active).length,
        inactive: users.filter(u => !u.is_active).length,
    }), [users]);

    // ─────────────────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────────────────

    if (modal) {
        return (
            <div className="min-h-screen" style={{ backgroundColor: 'var(--background-secondary)' }}>
                <UserFormPage
                    mode={modal.mode}
                    user={modal.user}
                    onClose={() => setModal(null)}
                    onSave={handleSaveUser}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--background-secondary)' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* ── Page header ─────────────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div
                                className="w-9 h-9 flex items-center justify-center"
                                style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-accent))' }}
                            >
                                <Users size={18} color="#fff" />
                            </div>
                            <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                                User Management
                            </h1>
                        </div>
                        <p className="text-sm ml-12" style={{ color: 'var(--text-secondary)' }}>
                            Manage internal users across all departments. SuperAdmin only.
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={loadUsers}
                            disabled={loading}
                            id="um-refresh-btn"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                            Refresh
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => setModal({ mode: 'create' })}
                            id="um-create-btn"
                        >
                            <Plus size={14} />
                            Create User
                        </Button>
                    </div>
                </div>

                {/* ── Stats strip ─────────────────────────────────────────────── */}
                {!loading && !error && (
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        {[
                            { label: 'Total Users',    value: stats.total,    color: 'var(--brand-accent)' },
                            { label: 'Active',         value: stats.active,   color: 'var(--status-active)' },
                            { label: 'Deactivated',    value: stats.inactive, color: 'var(--text-tertiary)' },
                        ].map(s => (
                            <div
                                key={s.label}
                                className="flex items-center gap-4 px-5 py-4 border"
                                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-default)' }}
                            >
                                <span className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</span>
                                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{s.label}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Search + Filters ─────────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row gap-3 mb-5">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search
                            size={15}
                            className="absolute left-3 top-1/2 -translate-y-1/2"
                            style={{ color: 'var(--text-tertiary)' }}
                        />
                        <input
                            id="um-search"
                            type="text"
                            placeholder="Search by name, email, or username…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full border px-3 py-2 pl-9 text-sm outline-none"
                            style={{
                                backgroundColor: 'var(--surface)',
                                borderColor: 'var(--border-default)',
                                color: 'var(--text-primary)',
                            }}
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2"
                                style={{ color: 'var(--text-tertiary)' }}
                            >
                                <X size={13} />
                            </button>
                        )}
                    </div>

                    {/* Role filter */}
                    <select
                        id="um-filter-role"
                        value={filterRole}
                        onChange={e => setFilterRole(e.target.value)}
                        className="border px-3 py-2 text-sm outline-none cursor-pointer"
                        style={{
                            backgroundColor: 'var(--surface)',
                            borderColor: 'var(--border-default)',
                            color: filterRole ? 'var(--text-primary)' : 'var(--text-tertiary)',
                            minWidth: '180px',
                        }}
                    >
                        <option value="">All Roles</option>
                        {INTERNAL_ROLES.map(r => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                    </select>

                    {/* Status filter */}
                    <select
                        id="um-filter-status"
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        className="border px-3 py-2 text-sm outline-none cursor-pointer"
                        style={{
                            backgroundColor: 'var(--surface)',
                            borderColor: 'var(--border-default)',
                            color: filterStatus ? 'var(--text-primary)' : 'var(--text-tertiary)',
                            minWidth: '130px',
                        }}
                    >
                        <option value="">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>

                    {(filterRole || filterStatus) && (
                        <button
                            onClick={() => { setFilterRole(''); setFilterStatus(''); }}
                            className="px-3 py-2 text-xs border transition-colors"
                            style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)', backgroundColor: 'var(--surface)' }}
                        >
                            Clear filters
                        </button>
                    )}
                </div>

                {/* ── Loading state ─────────────────────────────────────────────── */}
                {loading && (
                    <div
                        className="flex flex-col items-center justify-center py-24 border"
                        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-default)' }}
                    >
                        <div
                            className="animate-spin w-8 h-8 border-2 border-t-transparent mb-4"
                            style={{ borderColor: 'var(--brand-accent)', borderTopColor: 'transparent' }}
                        />
                        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading users…</p>
                    </div>
                )}

                {/* ── Error state ───────────────────────────────────────────────── */}
                {error && !loading && (
                    <div
                        className="flex flex-col items-center justify-center py-16 border"
                        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-default)' }}
                    >
                        <AlertCircle size={32} style={{ color: 'var(--brand-danger)' }} className="mb-3" />
                        <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Failed to load users</p>
                        <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>{error}</p>
                        <Button variant="outline" size="sm" onClick={loadUsers}>
                            <RefreshCw size={14} /> Try again
                        </Button>
                    </div>
                )}

                {/* ── Table ────────────────────────────────────────────────────── */}
                {!loading && !error && (
                    <div
                        className="border overflow-hidden"
                        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-default)' }}
                    >
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead style={{ backgroundColor: 'var(--background-secondary)' }}>
                                    <tr>
                                        {[
                                            { key: 'name',       label: 'User'    },
                                            { key: 'email',      label: 'Email'   },
                                            { key: 'role',       label: 'Area'    },
                                            { key: 'dateJoined', label: 'Joined'  },
                                            { key: 'lastLogin',  label: 'Last Login' },
                                            { key: 'status',     label: 'Status'  },
                                        ].map(col => (
                                            <th
                                                key={col.key}
                                                onClick={() => toggleSort(col.key)}
                                                className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer select-none"
                                                style={{ color: 'var(--text-tertiary)' }}
                                            >
                                                <div className="flex items-center gap-1.5">
                                                    {col.label}
                                                    <SortIcon col={col.key} />
                                                </div>
                                            </th>
                                        ))}
                                        <th
                                            className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider"
                                            style={{ color: 'var(--text-tertiary)' }}
                                        >
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {processedUsers.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-6 py-16 text-center text-sm"
                                                style={{ color: 'var(--text-tertiary)' }}
                                            >
                                                {search || filterRole || filterStatus
                                                    ? 'No users match the current filters.'
                                                    : 'No users found.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        processedUsers.map((user, idx) => (
                                            <tr
                                                key={user.id}
                                                className="transition-colors"
                                                style={{
                                                    borderTop: idx > 0 ? `1px solid var(--border-light)` : undefined,
                                                    opacity: user.is_active ? 1 : 0.55,
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--surface-hover)'}
                                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                {/* User */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar name={user.name} />
                                                        <div>
                                                            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                {user.name}
                                                            </p>
                                                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                                                @{user.username}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Email */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                                        <Mail size={13} style={{ color: 'var(--text-tertiary)' }} />
                                                        {user.email || '—'}
                                                    </div>
                                                </td>

                                                {/* Area */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <AreaBadge role={user.role} />
                                                </td>

                                                {/* Joined */}
                                                <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-secondary)' }}>
                                                    {user.dateJoined ?? '—'}
                                                </td>

                                                {/* Last Login */}
                                                <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-secondary)' }}>
                                                    {user.lastLogin ?? 'Never'}
                                                </td>

                                                {/* Status */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <StatusBadge status={user.status} />
                                                </td>

                                                {/* Actions */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {/* Edit */}
                                                        <button
                                                            id={`um-edit-${user.id}`}
                                                            onClick={() => setModal({ mode: 'edit', user })}
                                                            className="p-1.5 border transition-all"
                                                            title="Edit user"
                                                            style={{
                                                                borderColor: 'var(--border-default)',
                                                                backgroundColor: 'transparent',
                                                                color: 'var(--text-secondary)',
                                                            }}
                                                            onMouseEnter={e => {
                                                                e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                                                                e.currentTarget.style.color = 'var(--text-primary)';
                                                            }}
                                                            onMouseLeave={e => {
                                                                e.currentTarget.style.backgroundColor = 'transparent';
                                                                e.currentTarget.style.color = 'var(--text-secondary)';
                                                            }}
                                                        >
                                                            <Pencil size={14} />
                                                        </button>

                                                        {/* Activate / Deactivate */}
                                                        <button
                                                            id={`um-toggle-status-${user.id}`}
                                                            onClick={() => setConfirm({ user })}
                                                            className="p-1.5 border transition-all"
                                                            title={user.is_active ? 'Deactivate user' : 'Reactivate user'}
                                                            style={{
                                                                borderColor: 'var(--border-default)',
                                                                backgroundColor: 'transparent',
                                                                color: 'var(--text-secondary)',
                                                            }}
                                                            onMouseEnter={e => {
                                                                const dangerColor = user.is_active ? 'var(--brand-danger)' : 'var(--brand-success)';
                                                                e.currentTarget.style.backgroundColor = user.is_active ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)';
                                                                e.currentTarget.style.color = dangerColor;
                                                                e.currentTarget.style.borderColor = dangerColor;
                                                            }}
                                                            onMouseLeave={e => {
                                                                e.currentTarget.style.backgroundColor = 'transparent';
                                                                e.currentTarget.style.color = 'var(--text-secondary)';
                                                                e.currentTarget.style.borderColor = 'var(--border-default)';
                                                            }}
                                                        >
                                                            {user.is_active
                                                                ? <ShieldOff size={14} />
                                                                : <Shield size={14} />}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer count */}
                        {processedUsers.length > 0 && (
                            <div
                                className="px-6 py-3 border-t text-right"
                                style={{ borderColor: 'var(--border-light)' }}
                            >
                                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                    Showing {processedUsers.length} of {users.length} users
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── Modals & overlays ──────────────────────────────────────────── */}
            <ConfirmDialog
                confirm={confirm}
                onCancel={() => setConfirm(null)}
                onConfirm={handleToggleStatus}
                loading={actionLoading}
            />

            <Toast toast={toast} onDismiss={() => setToast(null)} />
        </div>
    );
}
