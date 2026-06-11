// components/layout/UserDetails.jsx
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, Mail, Calendar, Clock, Shield, Edit, Trash2, Activity, User as UserIcon, CheckCircle, Briefcase, LogIn, Key, Save, X, Bell, BellOff } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import {
    getUserById, updateUser, createUser, deleteUser, resetUserPassword,
    getSupplierById, updateSupplier, createSupplier, deleteSupplier,
} from '../../sections/api';
import { NOTIFICATION_CATEGORIES } from '../../contexts/NotificationContext';

const NOTIF_CATEGORY_DESCRIPTIONS = {
    industrialization_draft: 'Draft RFQs in Industrialization',
    sent_to_purchases:       'RFQs forwarded to Purchases',
    purchases_draft:         'Draft RFQs in Purchases',
    sent_to_suppliers:       'RFQs sent to suppliers',
    suppliers_draft:         'Draft responses from suppliers',
    suppliers_response:      'Quote submissions from suppliers',
    waiting_for_suppliers:   'Pending supplier responses',
    supplier_selected:       'Supplier award notifications',
    rfq_closed:              'Closed RFQ notifications',
};

function NotificationPreferencesCard({ userId, userRole }) {
    const storageKey = userId ? `notif_prefs_${userId}` : null;

    const [prefs, setPrefs] = useState(() => {
        if (!storageKey) return {};
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) return JSON.parse(saved);
        } catch { /* ignore */ }
        return Object.values(NOTIFICATION_CATEGORIES).reduce((acc, cat) => {
            acc[cat.id] = true;
            return acc;
        }, {});
    });
    const [saved, setSaved] = useState(false);

    const roleKey = (userRole ?? '').toLowerCase().replace('_admin', '');
    const availableCategories = Object.values(NOTIFICATION_CATEGORIES).filter(
        cat => cat.roles.includes(roleKey)
    );

    const toggle = (id) => setPrefs(p => ({ ...p, [id]: !p[id] }));

    const handleSave = () => {
        if (storageKey) {
            localStorage.setItem(storageKey, JSON.stringify(prefs));
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    if (!userId || availableCategories.length === 0) return null;

    return (
        <Card title="Notification Preferences">
            <div className="space-y-0 divide-y" style={{ divideColor: 'var(--border-light)' }}>
                {availableCategories.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between py-3">
                        <div>
                            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{cat.label}</p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                                {NOTIF_CATEGORY_DESCRIPTIONS[cat.id] ?? ''}
                            </p>
                        </div>
                        <button
                            onClick={() => toggle(cat.id)}
                            className="p-2 transition-colors"
                            style={{ color: prefs[cat.id] ? 'var(--brand-accent)' : 'var(--text-tertiary)' }}
                            title={prefs[cat.id] ? 'Enabled — click to disable' : 'Disabled — click to enable'}
                        >
                            {prefs[cat.id] ? <Bell size={16} /> : <BellOff size={16} />}
                        </button>
                    </div>
                ))}
            </div>
            <div className="flex justify-end mt-4 pt-3 border-t" style={{ borderColor: 'var(--border-default)' }}>
                <button
                    onClick={handleSave}
                    className="px-4 py-1.5 text-xs font-medium transition-colors"
                    style={{ backgroundColor: saved ? 'var(--status-active)' : 'var(--brand-accent)', color: 'white' }}
                >
                    {saved ? 'Saved' : 'Save Preferences'}
                </button>
            </div>
        </Card>
    );
}

// Maps UI display strings to exact Django Group names expected by the backend
const ROLE_TO_GROUP = {
    'Industrialization Engineer':  'Industrialization',
    'Industrialization Admin':     'Industrialization_Admin',
    'Purchases Analyst':           'Purchases',
    'Purchases Admin':             'Purchases_Admin',
    'Supplier Representative':     'Supplier',
    'System Administrator':        'SuperAdmin',
};

// Reverse map for display in read mode
const GROUP_TO_ROLE = Object.fromEntries(
    Object.entries(ROLE_TO_GROUP).map(([display, group]) => [group, display])
);

export default function UserDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // Detect supplier context from the URL path
    const isSupplierContext = location.pathname.includes('/supplier/');
    const isNewUser    = id === 'new-user';
    const isNewSupplier = id === 'new-supplier';
    const isCreating = isNewUser || isNewSupplier;

    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(isCreating);
    const [formData, setFormData] = useState({});
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isCreating) {
            const defaults = isNewSupplier
                ? { username: '', email: '', password: '', is_active: true }
                : { username: '', email: '', password: '', rol: 'Industrialization', is_active: true };
            setFormData(defaults);
            setUserData({ id: null, name: isNewSupplier ? 'New Supplier' : 'New User', ...defaults });
            setLoading(false);
            return;
        }

        const fetch = isSupplierContext ? getSupplierById : getUserById;
        fetch(id)
            .then(u => { setUserData(u); setFormData(u); })
            .catch(err => { setError(err.message); setUserData(null); })
            .finally(() => setLoading(false));
    }, [id, isSupplierContext, isCreating, isNewSupplier]);

    const handleEdit = () => { setIsEditing(true); setFormData(userData); };

    const handleCancel = () => {
        if (isCreating) { navigate(-1); return; }
        setIsEditing(false);
        setFormData(userData);
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            if (isCreating) {
                let created;
                if (isNewSupplier) {
                    created = await createSupplier({
                        username: formData.username,
                        email:    formData.email,
                        password: formData.password,
                        rol:      'Supplier',
                    });
                    navigate(`/Purchases/supplier/${created.id}`);
                } else {
                    created = await createUser({
                        username: formData.username,
                        email:    formData.email,
                        password: formData.password,
                        rol:      formData.rol ?? 'Industrialization',
                    });
                    navigate(`/Industrialization/user/${created.id}`);
                }
            } else {
                const payload = {};
                if (formData.email    !== userData.email)    payload.email    = formData.email;
                if (formData.username !== userData.username) payload.username = formData.username;

                // Status → is_active
                if (formData.status !== userData.status) {
                    payload.is_active = formData.status === 'active';
                }

                // Role → Group name (users only; suppliers don't have a role field to change here)
                if (!isSupplierContext && formData.rol && formData.rol !== userData.role) {
                    payload.rol = formData.rol;
                }

                // Include new password only if filled in
                if (formData.password && formData.password.trim()) {
                    payload.password = formData.password;
                }

                const updated = isSupplierContext
                    ? await updateSupplier(id, payload)
                    : await updateUser(id, payload);
                setUserData(updated);
                setFormData(updated);
                setIsEditing(false);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this user? This cannot be undone.')) return;
        try {
            if (isSupplierContext) { await deleteSupplier(id); navigate('/Purchases/Suppliers'); }
            else                   { await deleteUser(id);     navigate('/Industrialization/Users'); }
        } catch (err) {
            setError(err.message);
        }
    };

    const handleResetPassword = async () => {
        try {
            await resetUserPassword(id);
            alert('Password reset email would be sent in production.');
        } catch (err) {
            setError(err.message);
        }
    };

    const handleInputChange = (field, value) =>
        setFormData(prev => ({ ...prev, [field]: value }));

    const getStatusStyle = (status) => {
        const styles = {
            active:   { color: 'var(--status-active)',    backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'var(--status-active)' },
            inactive: { color: 'var(--text-tertiary)',    backgroundColor: 'var(--surface-disabled)',  borderColor: 'var(--border-default)' },
            pending:  { color: 'var(--status-pending)',   backgroundColor: 'rgba(245, 158, 11, 0.1)',  borderColor: 'var(--status-pending)' },
        };
        return styles[status] || styles.active;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background-secondary)' }}>
                <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-brand-accent border-t-transparent" />
                    <p className="text-sm mt-2" style={{ color: 'var(--text-tertiary)' }}>Loading user data...</p>
                </div>
            </div>
        );
    }

    if (!userData && !isCreating) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background-secondary)' }}>
                <div className="text-center">
                    <UserIcon size={48} style={{ color: 'var(--text-tertiary)' }} />
                    <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>{error ?? 'User not found'}</p>
                    <button onClick={() => navigate(-1)} className="mt-4 text-sm" style={{ color: 'var(--brand-accent)' }}>Go Back</button>
                </div>
            </div>
        );
    }

    const displayData = isEditing ? formData : userData;
    const statusStyle  = getStatusStyle(displayData?.status);

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--background-secondary)' }}>
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2 transition-colors duration-fast hover:bg-surface-hover" style={{ color: 'var(--text-secondary)' }}>
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                                {isCreating ? (isNewSupplier ? 'Add New Supplier' : 'Create New User') : (displayData?.name ?? displayData?.username)}
                            </h1>
                            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                                {isCreating ? 'Fill in the details below' : (isSupplierContext ? 'Supplier Profile' : 'User Profile')}
                            </p>
                        </div>
                    </div>
                    {!isEditing && !isCreating && (
                        <Button variant="outline" onClick={handleEdit}><Edit size={16} /> Edit</Button>
                    )}
                    {(isEditing || isCreating) && (
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={handleCancel} disabled={saving}><X size={16} /> Cancel</Button>
                            <Button variant="primary" onClick={handleSave} disabled={saving}>
                                <Save size={16} /> {saving ? 'Saving...' : (isCreating ? 'Create' : 'Save Changes')}
                            </Button>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="mb-4 px-4 py-3 border text-sm" style={{ color: 'var(--brand-danger)', borderColor: 'var(--brand-danger)', backgroundColor: 'rgba(239,68,68,0.1)' }}>
                        {error}
                    </div>
                )}

                <div className="space-y-6">
                    {/* Essential Info */}
                    <Card>
                        <div className="flex items-start gap-6">
                            <div className="w-20 h-20 bg-surface-hover flex items-center justify-center border border-border-default flex-shrink-0">
                                <UserIcon size={40} style={{ color: 'var(--text-tertiary)' }} />
                            </div>

                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Username (login handle) */}
                                <div>
                                    <label className="text-xs uppercase tracking-wider block" style={{ color: 'var(--text-tertiary)' }}>Username</label>
                                    {isEditing ? (
                                        <input type="text" value={formData.username || ''} onChange={(e) => handleInputChange('username', e.target.value)}
                                            className="w-full mt-1 px-3 py-1.5 text-sm border border-border-default focus:outline-none focus:ring-2 focus:ring-ring bg-surface"
                                            style={{ color: 'var(--text-primary)' }} />
                                    ) : (
                                        <p className="text-base font-medium mt-1" style={{ color: 'var(--text-primary)' }}>{displayData?.username}</p>
                                    )}
                                </div>

                                {/* Display name (read-only computed field) */}
                                <div>
                                    <label className="text-xs uppercase tracking-wider block" style={{ color: 'var(--text-tertiary)' }}>Full Name</label>
                                    <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-primary)' }}>{displayData?.name || '—'}</p>
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="text-xs uppercase tracking-wider block" style={{ color: 'var(--text-tertiary)' }}>Email Address</label>
                                    {isEditing ? (
                                        <input type="email" value={formData.email || ''} onChange={(e) => handleInputChange('email', e.target.value)}
                                            className="w-full mt-1 px-3 py-1.5 text-sm border border-border-default focus:outline-none focus:ring-2 focus:ring-ring bg-surface"
                                            style={{ color: 'var(--text-primary)' }} />
                                    ) : (
                                        <div className="flex items-center gap-2 mt-1">
                                            <Mail size={14} style={{ color: 'var(--text-tertiary)' }} />
                                            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{displayData?.email}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Password — required when creating, optional when editing */}
                                {isEditing && (
                                    <div>
                                        <label className="text-xs uppercase tracking-wider block" style={{ color: 'var(--text-tertiary)' }}>
                                            {isCreating ? <>Password <span style={{ color: 'var(--brand-danger)' }}>*</span></> : 'New Password (leave blank to keep current)'}
                                        </label>
                                        <input type="password" value={formData.password || ''} onChange={(e) => handleInputChange('password', e.target.value)}
                                            placeholder={isCreating ? 'Set initial password' : 'Enter new password to change it'}
                                            className="w-full mt-1 px-3 py-1.5 text-sm border border-border-default focus:outline-none focus:ring-2 focus:ring-ring bg-surface"
                                            style={{ color: 'var(--text-primary)' }} />
                                    </div>
                                )}

                                {/* Role — only for internal users */}
                                {!isSupplierContext && (
                                    <div>
                                        <label className="text-xs uppercase tracking-wider block" style={{ color: 'var(--text-tertiary)' }}>Role</label>
                                        {isEditing ? (
                                            <select value={formData.rol ?? formData.role ?? ''}
                                                onChange={(e) => handleInputChange('rol', e.target.value)}
                                                className="w-full mt-1 px-3 py-1.5 text-sm border border-border-default focus:outline-none focus:ring-2 focus:ring-ring bg-surface"
                                                style={{ color: 'var(--text-primary)' }}>
                                                {Object.entries(ROLE_TO_GROUP).filter(([, g]) => g !== 'Supplier').map(([display, group]) => (
                                                    <option key={group} value={group}>{display}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <div className="flex items-center gap-2 mt-1">
                                                <Briefcase size={14} style={{ color: 'var(--text-tertiary)' }} />
                                                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                    {GROUP_TO_ROLE[displayData?.role] ?? displayData?.role ?? '—'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Status */}
                                <div>
                                    <label className="text-xs uppercase tracking-wider block" style={{ color: 'var(--text-tertiary)' }}>Status</label>
                                    {isEditing ? (
                                        <select value={formData.status || 'active'} onChange={(e) => handleInputChange('status', e.target.value)}
                                            className="w-full mt-1 px-3 py-1.5 text-sm border border-border-default focus:outline-none focus:ring-2 focus:ring-ring bg-surface"
                                            style={{ color: 'var(--text-primary)' }}>
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                    ) : (
                                        <div className="mt-1">
                                            <span className="inline-flex px-2.5 py-0.5 text-xs font-medium border" style={statusStyle}>
                                                {displayData?.status}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Permissions / groups — read-only display */}
                    {!isCreating && displayData?.permissions && displayData.permissions.length > 0 && (
                        <Card title="Groups / Permissions">
                            <div className="flex flex-wrap gap-2">
                                {displayData.permissions.map((p, i) => (
                                    <span key={i} className="inline-flex px-2.5 py-1 text-xs font-medium border"
                                        style={{ color: 'var(--text-primary)', backgroundColor: 'var(--surface-hover)', borderColor: 'var(--border-default)' }}>
                                        {p}
                                    </span>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Account Info */}
                    {!isCreating && displayData && (
                        <Card title="Account Information">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center gap-3 p-3 border border-border-default">
                                    <LogIn size={16} style={{ color: 'var(--text-tertiary)' }} />
                                    <div>
                                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Last Login</p>
                                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{displayData.lastLogin ?? 'Never'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 border border-border-default">
                                    <Briefcase size={16} style={{ color: 'var(--text-tertiary)' }} />
                                    <div>
                                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Department</p>
                                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{displayData.department ?? '—'}</p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Notification Preferences */}
                    {!isCreating && userData?.id && (
                        <NotificationPreferencesCard
                            userId={userData.id}
                            userRole={userData.role ?? (isSupplierContext ? 'Supplier' : undefined)}
                        />
                    )}

                    {/* Quick Actions — only for existing users */}
                    {!isEditing && !isCreating && (
                        <Card title="Quick Actions">
                            <div className="flex flex-wrap gap-3">
                                <Button variant="outline" size="sm" onClick={handleEdit}>
                                    <Key size={14} /> Change Password
                                </Button>
                                <Button variant="danger" size="sm" onClick={handleDelete}>
                                    <Trash2 size={14} /> Delete {isSupplierContext ? 'Supplier' : 'User'}
                                </Button>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
