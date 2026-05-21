// components/layout/UserDetails.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, Mail, Calendar, Clock, Shield, Edit, Trash2, Activity, User as UserIcon, CheckCircle, Briefcase, LogIn, Key, Save, X } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';

import usersData from '../../sections/users-data.json';
import suppliersData from '../../sections/suppliers-data.json';

export default function UserDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isNewUser, setIsNewUser] = useState(false);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        // Check if this is a new user
        if (id === 'new-user') {
            setIsNewUser(true);
            setIsEditing(true);
            // Initialize empty form for new user
            setFormData({
                name: '',
                email: '',
                role: 'User',
                department: 'Industrialization',
                status: 'active',
                permissions: ['View RFQs', 'Create RFQs']
            });
            setUserData({
                id: 'new-user',
                name: 'New User',
                email: '',
                role: 'User',
                department: 'Industrialization',
                status: 'pending',
                lastLogin: 'Never',
                createdAt: new Date().toISOString().split('T')[0],
                createdBy: 'Current User',
                avatar: null,
                recentActivity: [],
                permissions: ['View RFQs', 'Create RFQs']
            });
            setLoading(false);
            return;
        }

        // Fetch existing user or supplier
        setTimeout(() => {
            const user = usersData.users.find(u => u.id === id);
            const supplier = suppliersData.suppliers.find(s => s.id === id);
            if (user) {
                setUserData(user);
                setFormData(user);
            } else if (supplier) {
                setUserData(supplier);
                setFormData(supplier);
            } else {
                setUserData(null);
            }
            setLoading(false);
        }, 300);
    }, [id]);

    const handleEdit = () => {
        setIsEditing(true);
        setFormData(userData);
    };

    const handleCancel = () => {
        if (isNewUser) {
            navigate('/Industrialization/Users');
        } else {
            setIsEditing(false);
            setFormData(userData);
        }
    };

    const handleSave = () => {
        // In a real app, you would send this to an API
        console.log('Saving user data:', formData);

        if (isNewUser) {
            // Create new user with generated ID
            const newId = formData.name.toLowerCase().replace(/\s+/g, '-');
            const newUser = {
                ...formData,
                id: newId,
                createdAt: new Date().toISOString().split('T')[0],
                createdBy: 'Current User',
                lastLogin: 'Never',
                recentActivity: []
            };
            console.log('New user created:', newUser);
            alert('User created successfully!');
            navigate(`/Industrialization/user/${newId}`);
        } else {
            // Update existing user
            const updatedUser = { ...userData, ...formData };
            console.log('User updated:', updatedUser);
            alert('User updated successfully!');
            setUserData(updatedUser);
            setIsEditing(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handlePermissionToggle = (permission) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.includes(permission)
                ? prev.permissions.filter(p => p !== permission)
                : [...prev.permissions, permission]
        }));
    };

    const getStatusStyle = (status) => {
        const styles = {
            active: { color: 'var(--status-active)', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'var(--status-active)' },
            inactive: { color: 'var(--text-tertiary)', backgroundColor: 'var(--surface-disabled)', borderColor: 'var(--border-default)' },
            pending: { color: 'var(--status-pending)', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'var(--status-pending)' }
        };
        return styles[status] || styles.active;
    };

    const availablePermissions = [
        'View RFQs',
        'Create RFQs',
        'Edit Drafts',
        'Send to Purchases',
        'View Reports',
        'Approve RFQs',
        'Manage Users',
        'Delete RFQs',
        'Manage Suppliers',
        'Approve Budget'
    ];

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

    if (!userData && !isNewUser) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background-secondary)' }}>
                <div className="text-center">
                    <UserIcon size={48} style={{ color: 'var(--text-tertiary)' }} />
                    <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>User not found</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="mt-4 text-sm"
                        style={{ color: 'var(--brand-accent)' }}
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const displayData = isEditing ? formData : userData;
    const statusStyle = getStatusStyle(displayData?.status);

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--background-secondary)' }}>
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 transition-colors duration-fast hover:bg-surface-hover"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                                {isNewUser ? 'Create New User' : displayData?.name}
                            </h1>
                            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                                {isNewUser ? 'Add a new user to the system' : 'User Profile'}
                            </p>
                        </div>
                    </div>
                    {!isEditing && !isNewUser && (
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={handleEdit}>
                                <Edit size={16} />
                                Edit User
                            </Button>
                        </div>
                    )}
                    {(isEditing || isNewUser) && (
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={handleCancel}>
                                <X size={16} />
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={handleSave}>
                                <Save size={16} />
                                {isNewUser ? 'Create User' : 'Save Changes'}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Main Content */}
                <div className="space-y-6">
                    {/* Section 1: Essential Info */}
                    <Card>
                        <div className="flex items-start gap-6">
                            <div className="flex flex-col justify-center items-start rounded-md p-2">
                                <div className="w-20 h-20 bg-surface-hover flex items-center justify-center border border-border-default">
                                    <UserIcon size={40} style={{ color: 'var(--text-tertiary)' }} />
                                </div>
                                {isEditing && (
                                    <button className="cursor-pointer text-xs w-full text-center mt-2" style={{ color: 'var(--brand-accent)' }}>
                                        Change
                                    </button>
                                )}
                            </div>

                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs uppercase tracking-wider block" style={{ color: 'var(--text-tertiary)' }}>
                                        Full Name
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={formData.name || ''}
                                            onChange={(e) => handleInputChange('name', e.target.value)}
                                            className="w-full mt-1 px-3 py-1.5 text-sm border border-border-default focus:outline-none focus:ring-2 focus:ring-ring bg-surface"
                                            style={{ color: 'var(--text-primary)' }}
                                        />
                                    ) : (
                                        <p className="text-base font-medium mt-1" style={{ color: 'var(--text-primary)' }}>{displayData?.name}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-xs uppercase tracking-wider block" style={{ color: 'var(--text-tertiary)' }}>
                                        User ID
                                    </label>
                                    <p className="text-sm font-mono mt-1" style={{ color: 'var(--text-primary)' }}>
                                        {isNewUser ? '(Will be auto-generated)' : displayData?.id}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs uppercase tracking-wider block" style={{ color: 'var(--text-tertiary)' }}>
                                        Email Address
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="email"
                                            value={formData.email || ''}
                                            onChange={(e) => handleInputChange('email', e.target.value)}
                                            className="w-full mt-1 px-3 py-1.5 text-sm border border-border-default focus:outline-none focus:ring-2 focus:ring-ring bg-surface"
                                            style={{ color: 'var(--text-primary)' }}
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2 mt-1">
                                            <Mail size={14} style={{ color: 'var(--text-tertiary)' }} />
                                            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{displayData?.email}</p>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="text-xs uppercase tracking-wider block" style={{ color: 'var(--text-tertiary)' }}>
                                        Role
                                    </label>
                                    {isEditing ? (
                                        <select
                                            value={formData.role || ''}
                                            onChange={(e) => handleInputChange('role', e.target.value)}
                                            className="w-full mt-1 px-3 py-1.5 text-sm border border-border-default focus:outline-none focus:ring-2 focus:ring-ring bg-surface"
                                            style={{ color: 'var(--text-primary)' }}
                                        >
                                            <option value="User">User</option>
                                            <option value="Industrialization Engineer">Industrialization Engineer</option>
                                            <option value="Industrialization Manager">Industrialization Manager</option>
                                            <option value="Industrialization Specialist">Industrialization Specialist</option>
                                            <option value="Purchases Manager">Purchases Manager</option>
                                            <option value="Finance Director">Finance Director</option>
                                            <option value="Supplier Representative">Supplier Representative</option>
                                        </select>
                                    ) : (
                                        <div className="flex items-center gap-2 mt-1">
                                            <Briefcase size={14} style={{ color: 'var(--text-tertiary)' }} />
                                            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{displayData?.role}</p>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="text-xs uppercase tracking-wider block" style={{ color: 'var(--text-tertiary)' }}>
                                        Department
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={formData.department || ''}
                                            onChange={(e) => handleInputChange('department', e.target.value)}
                                            className="w-full mt-1 px-3 py-1.5 text-sm border border-border-default focus:outline-none focus:ring-2 focus:ring-ring bg-surface"
                                            style={{ color: 'var(--text-primary)' }}
                                        />
                                    ) : (
                                        <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>{displayData?.department}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-xs uppercase tracking-wider block" style={{ color: 'var(--text-tertiary)' }}>
                                        Status
                                    </label>
                                    {isEditing ? (
                                        <select
                                            value={formData.status || ''}
                                            onChange={(e) => handleInputChange('status', e.target.value)}
                                            className="w-full mt-1 px-3 py-1.5 text-sm border border-border-default focus:outline-none focus:ring-2 focus:ring-ring bg-surface"
                                            style={{ color: 'var(--text-primary)' }}
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                            <option value="pending">Pending</option>
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

                    {/* Section 2: Permissions */}
                    <Card title="Permissions">
                        {isEditing ? (
                            <div className="flex flex-wrap gap-2">
                                {availablePermissions.map((permission, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handlePermissionToggle(permission)}
                                        className={`inline-flex px-2.5 py-1 text-xs font-medium border transition-colors duration-fast ${formData.permissions?.includes(permission)
                                            ? 'border-brand-accent text-brand-accent'
                                            : 'border-border-default text-text-secondary hover:bg-surface-hover'
                                            }`}
                                    >
                                        {permission}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {displayData?.permissions?.map((permission, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex px-2.5 py-1 text-xs font-medium border"
                                        style={{ color: 'var(--text-primary)', backgroundColor: 'var(--surface-hover)', borderColor: 'var(--border-default)' }}
                                    >
                                        {permission}
                                    </span>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* Section 3: Recent Activity (only show for existing users, not for new/edit mode) */}
                    {!isEditing && !isNewUser && displayData?.recentActivity && displayData.recentActivity.length > 0 && (
                        <Card title="Recent Activity">
                            <div className="space-y-3">
                                {displayData.recentActivity.map((activity, index) => (
                                    <div key={index} className="flex items-center justify-between py-2 border-b border-border-light last:border-0">
                                        <div className="flex items-center gap-3">
                                            <Clock size={14} style={{ color: 'var(--text-tertiary)' }} />
                                            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{activity.action}</span>
                                        </div>
                                        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{activity.date}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Section 4: Account Info (only show for existing users) */}
                    {!isNewUser && displayData && (
                        <Card title="Account Information">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center gap-3 p-3 border border-border-default">
                                    <Calendar size={16} style={{ color: 'var(--text-tertiary)' }} />
                                    <div>
                                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Account Created</p>
                                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{displayData.createdAt}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 border border-border-default">
                                    <UserIcon size={16} style={{ color: 'var(--text-tertiary)' }} />
                                    <div>
                                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Created By</p>
                                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{displayData.createdBy}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 border border-border-default">
                                    <LogIn size={16} style={{ color: 'var(--text-tertiary)' }} />
                                    <div>
                                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Last Login</p>
                                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{displayData.lastLogin}</p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Section 5: Quick Actions (only for existing users, not in edit mode) */}
                    {!isEditing && !isNewUser && (
                        <Card title="Quick Actions">
                            <div className="flex flex-wrap gap-3">
                                <Button variant="outline" size="sm">
                                    <Key size={14} />
                                    Reset Password
                                </Button>
                                <Button variant="outline" size="sm">
                                    <Activity size={14} />
                                    Activity Log
                                </Button>
                                <Button variant="danger" size="sm">
                                    <Trash2 size={14} />
                                    Delete User
                                </Button>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}