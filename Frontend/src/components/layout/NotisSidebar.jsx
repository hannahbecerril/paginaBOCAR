// components/layout/NotisSidebar.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Bell, CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function NotisSidebar({
    isOpen,
    onClose,
    notifications = [],
    onMarkAsRead,
    onClearAll,
    title = "Notifications"
}) {
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(isOpen);
    const [animation, setAnimation] = useState('');

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
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    const handleNotificationClick = (notification) => {
        if (onMarkAsRead && !notification.read) onMarkAsRead(notification.id);
        if (notification.rfqId) {
            const storedUser = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
            const rol = (storedUser.grupos?.[0] ?? '').replace('_Admin', '');
            const section = rol === 'Purchases' ? 'Purchases' : rol === 'Supplier' ? 'Suppliers' : 'Industrialization';
            navigate(`/${section}/rfq/${notification.rfqId}`);
            onClose();
        }
    };

    if (!isVisible) return null;

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle size={14} style={{ color: 'var(--brand-success)' }} />;
            case 'error':   return <AlertCircle size={14} style={{ color: 'var(--brand-danger)' }} />;
            case 'warning': return <AlertCircle size={14} style={{ color: 'var(--brand-warning)' }} />;
            case 'info':    return <Info size={14} style={{ color: 'var(--brand-info)' }} />;
            default:        return <Bell size={14} style={{ color: 'var(--brand-accent)' }} />;
        }
    };

    const formatTime = (date) => {
        const diff = Date.now() - new Date(date);
        const m = Math.floor(diff / 60000);
        const h = Math.floor(m / 60);
        const d = Math.floor(h / 24);
        if (m < 1) return 'Just now';
        if (m < 60) return `${m}m`;
        if (h < 24) return `${h}h`;
        return `${d}d`;
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <>
            <div
                className="fixed inset-0 transition-opacity duration-300"
                style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 'var(--z-modal-backdrop)', opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? 'auto' : 'none' }}
                onClick={onClose}
            />
            <div
                className={`fixed right-0 top-0 h-full bg-surface border-l border-border-default shadow-lg ${animation}`}
                style={{ width: '380px', maxWidth: '90vw', zIndex: 'var(--z-notification-sidebar)', display: 'flex', flexDirection: 'column' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border-default">
                    <div className="flex items-center gap-2.5">
                        <Bell size={16} style={{ color: 'var(--brand-accent)' }} />
                        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>{title}</h2>
                        {unreadCount > 0 && (
                            <span className="px-1.5 py-0.5 text-[10px] font-medium" style={{ color: 'var(--text-inverse)', backgroundColor: 'var(--brand-danger)' }}>
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <button onClick={onClose} className="p-1.5 transition-colors hover:bg-surface-hover" style={{ color: 'var(--text-tertiary)' }}>
                        <X size={14} />
                    </button>
                </div>

                {/* Actions bar */}
                {(unreadCount > 0 || notifications.length > 0) && (
                    <div className="flex items-center justify-end gap-3 px-5 py-2 border-b border-border-default">
                        {unreadCount > 0 && onMarkAsRead && (
                            <button onClick={() => onMarkAsRead('all')} className="text-xs hover:text-text-primary" style={{ color: 'var(--text-tertiary)' }}>
                                Mark all read
                            </button>
                        )}
                        {notifications.length > 0 && onClearAll && (
                            <button onClick={onClearAll} className="text-xs hover:text-brand-danger" style={{ color: 'var(--text-tertiary)' }}>
                                Clear all
                            </button>
                        )}
                    </div>
                )}

                {/* List */}
                <div className="flex-1 overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Bell size={32} style={{ color: 'var(--text-tertiary)' }} />
                            <p className="mt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>No notifications</p>
                            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>You're all caught up</p>
                        </div>
                    ) : (
                        <div>
                            {notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className={`px-5 py-3 border-b border-border-light cursor-pointer hover:bg-surface-hover transition-colors ${!n.read ? 'bg-brand-accent/5' : ''}`}
                                    onClick={() => handleNotificationClick(n)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 mt-0.5">{getIcon(n.type)}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{n.title}</h3>
                                                <span className="text-xs ml-2 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>{formatTime(n.date)}</span>
                                            </div>
                                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{n.message}</p>
                                            {n.rfqId && <p className="text-xs mt-1" style={{ color: 'var(--brand-accent)' }}>RFQ: {n.rfqId}</p>}
                                            {!n.read && <div className="mt-1.5"><span className="inline-block w-1.5 h-1.5" style={{ backgroundColor: 'var(--brand-accent)' }} /></div>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
