// components/layout/NotisSidebar.jsx
import { useState, useEffect } from 'react';
import { X, Bell, CheckCircle, AlertCircle, Info, Clock, Settings } from 'lucide-react';
import NotificationConfig from './NotificationConfig';

export default function NotisSidebar({
    isOpen,
    onClose,
    notifications = [],
    onMarkAsRead,
    onClearAll,
    onUpdateCategory,
    enabledCategories,
    userRole,
    title = "Notifications"
}) {
    const [isVisible, setIsVisible] = useState(isOpen);
    const [animation, setAnimation] = useState('');
    const [showConfig, setShowConfig] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            setAnimation('animate-slide-in-right');
            document.body.style.overflow = 'hidden';
        } else {
            setAnimation('animate-slide-out-right');
            setTimeout(() => {
                setIsVisible(false);
                document.body.style.overflow = 'unset';
            }, 300);
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isVisible) return null;

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'success':
                return <CheckCircle size={14} style={{ color: 'var(--brand-success)' }} />;
            case 'error':
                return <AlertCircle size={14} style={{ color: 'var(--brand-danger)' }} />;
            case 'warning':
                return <AlertCircle size={14} style={{ color: 'var(--brand-warning)' }} />;
            case 'info':
                return <Info size={14} style={{ color: 'var(--brand-info)' }} />;
            default:
                return <Bell size={14} style={{ color: 'var(--brand-accent)' }} />;
        }
    };

    const formatTime = (date) => {
        const now = new Date();
        const diff = now - new Date(date);
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m`;
        if (hours < 24) return `${hours}h`;
        return `${days}d`;
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 transition-opacity duration-300"
                style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    zIndex: 'var(--z-modal-backdrop)',
                    opacity: isOpen ? 1 : 0,
                    pointerEvents: isOpen ? 'auto' : 'none'
                }}
                onClick={onClose}
            />

            {/* Sidebar */}
            <div
                className={`fixed right-0 top-0 h-full bg-surface border-l border-border-default shadow-lg ${animation}`}
                style={{
                    width: '380px',
                    maxWidth: '90vw',
                    zIndex: 'var(--z-notification-sidebar)',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border-default">
                    <div className="flex items-center gap-2.5">
                        <Bell size={16} style={{ color: 'var(--brand-accent)' }} />
                        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                            {title}
                        </h2>
                        {unreadCount > 0 && (
                            <span className="px-1.5 py-0.5 text-[10px] font-medium" style={{ color: 'var(--text-inverse)', backgroundColor: 'var(--brand-danger)' }}>
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setShowConfig(true)}
                            className="p-1.5 transition-colors duration-fast hover:bg-surface-hover"
                            style={{ color: 'var(--text-tertiary)' }}
                            title="Notification Settings"
                        >
                            <Settings size={14} />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 transition-colors duration-fast hover:bg-surface-hover"
                            style={{ color: 'var(--text-tertiary)' }}
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>

                {/* Role Indicator */}
                <div className="px-5 py-2 border-b border-border-default" style={{ backgroundColor: 'var(--background-tertiary)' }}>
                    <div className="flex items-center justify-between">
                        <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                            Role
                        </span>
                        <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                            {userRole}
                        </span>
                    </div>
                </div>

                {/* Actions Bar */}
                {(unreadCount > 0 || notifications.length > 0) && (
                    <div className="flex items-center justify-end gap-3 px-5 py-2 border-b border-border-default">
                        {unreadCount > 0 && onMarkAsRead && (
                            <button
                                onClick={() => onMarkAsRead('all')}
                                className="text-xs transition-colors duration-fast hover:text-text-primary"
                                style={{ color: 'var(--text-tertiary)' }}
                            >
                                Mark all read
                            </button>
                        )}
                        {notifications.length > 0 && onClearAll && (
                            <button
                                onClick={onClearAll}
                                className="text-xs transition-colors duration-fast hover:text-brand-danger"
                                style={{ color: 'var(--text-tertiary)' }}
                            >
                                Clear all
                            </button>
                        )}
                    </div>
                )}

                {/* Notifications List */}
                <div className="flex-1 overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Bell size={32} style={{ color: 'var(--text-tertiary)' }} />
                            <p className="mt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                No notifications
                            </p>
                            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                                Check your notification settings
                            </p>
                        </div>
                    ) : (
                        <div>
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`px-5 py-3 border-b border-border-light transition-colors duration-fast cursor-pointer hover:bg-surface-hover ${!notification.read ? 'bg-brand-accent/5' : ''
                                        }`}
                                    onClick={() => onMarkAsRead && onMarkAsRead(notification.id)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 mt-0.5">
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                    {notification.title}
                                                </h3>
                                                <span className="text-xs ml-2 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>
                                                    {formatTime(notification.date)}
                                                </span>
                                            </div>
                                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                                {notification.message}
                                            </p>
                                            {notification.category && (
                                                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                                                    {notification.category.label}
                                                </p>
                                            )}
                                            {!notification.read && (
                                                <div className="mt-1.5">
                                                    <span className="inline-block w-1.5 h-1.5" style={{ backgroundColor: 'var(--brand-accent)' }} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Configuration Modal */}
            <NotificationConfig
                isOpen={showConfig}
                onClose={() => setShowConfig(false)}
                enabledCategories={enabledCategories}
                onUpdateCategory={onUpdateCategory}
                userRole={userRole}
            />
        </>
    );
}