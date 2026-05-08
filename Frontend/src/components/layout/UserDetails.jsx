// components/layout/UserDetails.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Calendar, Clock, Shield, Edit, Trash2, Activity, User as UserIcon } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';

export default function UserDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    // Mock data - in real app, fetch based on id
    const userData = {
        id: id,
        name: id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        email: `${id}@company.com`,
        role: 'User',
        department: 'Industrialization',
        status: 'active',
        lastLogin: 'Today, 10:30 AM',
        createdAt: '2024-01-15',
        createdBy: 'System Admin',
        avatar: null,
        recentActivity: [
            { action: 'Viewed RFQ SOL-001', date: 'Today, 10:30 AM' },
            { action: 'Edited draft SOL-002', date: 'Yesterday, 3:45 PM' },
            { action: 'Created new RFQ SOL-005', date: 'Mar 28, 2024' },
        ],
        permissions: [
            'View RFQs',
            'Create RFQs',
            'Edit Drafts',
            'Send to Purchases',
            'View Reports'
        ]
    };

    const getStatusStyle = (status) => {
        const styles = {
            active: { color: 'var(--status-active)', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'var(--status-active)' },
            inactive: { color: 'var(--text-tertiary)', backgroundColor: 'var(--surface-disabled)', borderColor: 'var(--border-default)' }
        };
        return styles[status] || styles.active;
    };

    const statusStyle = getStatusStyle(userData.status);

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--background-secondary)' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                                {userData.name}
                            </h1>
                            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                                User Profile
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline">
                            <Edit size={16} />
                            Edit User
                        </Button>
                        <Button variant="danger">
                            <Trash2 size={16} />
                            Delete User
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Info Card */}
                        <Card title="Basic Information">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Full Name</label>
                                    <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>{userData.name}</p>
                                </div>
                                <div>
                                    <label className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>User ID</label>
                                    <p className="text-sm font-mono mt-1" style={{ color: 'var(--text-primary)' }}>{userData.id}</p>
                                </div>
                                <div>
                                    <label className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Role</label>
                                    <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>{userData.role}</p>
                                </div>
                                <div>
                                    <label className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Department</label>
                                    <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>{userData.department}</p>
                                </div>
                                <div>
                                    <label className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Status</label>
                                    <div className="mt-1">
                                        <span className="inline-flex px-2.5 py-0.5 text-xs font-medium border" style={statusStyle}>
                                            {userData.status}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Last Login</label>
                                    <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>{userData.lastLogin}</p>
                                </div>
                            </div>
                        </Card>

                        {/* Contact Information Card */}
                        <Card title="Contact Information">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <Mail size={16} style={{ color: 'var(--text-tertiary)' }} />
                                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{userData.email}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Calendar size={16} style={{ color: 'var(--text-tertiary)' }} />
                                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Created: {userData.createdAt}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <UserIcon size={16} style={{ color: 'var(--text-tertiary)' }} />
                                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Created by: {userData.createdBy}</span>
                                </div>
                            </div>
                        </Card>

                        {/* Permissions Card */}
                        <Card title="Permissions">
                            <div className="flex flex-wrap gap-2">
                                {userData.permissions.map((permission, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex px-2.5 py-0.5 text-xs font-medium border"
                                        style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--surface-hover)', borderColor: 'var(--border-default)' }}
                                    >
                                        {permission}
                                    </span>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Avatar Card */}
                        <Card title="Avatar">
                            <div className="flex flex-col items-center">
                                <div className="w-24 h-24 bg-surface-hover flex items-center justify-center mb-3">
                                    <UserIcon size={48} style={{ color: 'var(--text-tertiary)' }} />
                                </div>
                                <Button variant="outline" size="sm">
                                    Change Avatar
                                </Button>
                            </div>
                        </Card>

                        {/* Recent Activity Card */}
                        <Card title="Recent Activity">
                            <div className="space-y-3">
                                {userData.recentActivity.map((activity, index) => (
                                    <div key={index} className="flex items-start gap-3">
                                        <Clock size={14} style={{ color: 'var(--text-tertiary)' }} className="mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{activity.action}</p>
                                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{activity.date}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* Quick Actions Card */}
                        <Card title="Quick Actions">
                            <div className="space-y-2">
                                <Button variant="outline" className="w-full justify-between">
                                    Reset Password
                                    <Shield size={14} />
                                </Button>
                                <Button variant="outline" className="w-full justify-between">
                                    View Activity Log
                                    <Activity size={14} />
                                </Button>
                                {userData.status === 'active' ? (
                                    <Button variant="danger" className="w-full justify-between">
                                        Deactivate User
                                        <Trash2 size={14} />
                                    </Button>
                                ) : (
                                    <Button variant="success" className="w-full justify-between">
                                        Activate User
                                        <CheckCircle size={14} />
                                    </Button>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}