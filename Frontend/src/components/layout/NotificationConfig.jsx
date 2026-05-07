// components/layout/NotificationConfig.jsx
import { useState, useEffect } from 'react';
import { X, Bell, BellOff, Save, RotateCcw, Settings } from 'lucide-react';
import { NOTIFICATION_CATEGORIES } from '../../contexts/NotificationContext';

export default function NotificationConfig({ isOpen, onClose, enabledCategories, onUpdateCategory, userRole }) {
    const [localSettings, setLocalSettings] = useState(enabledCategories);
    const [animation, setAnimation] = useState('');
    const [isVisible, setIsVisible] = useState(isOpen);

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

    useEffect(() => {
        setLocalSettings(enabledCategories);
    }, [enabledCategories]);

    if (!isVisible) return null;

    const handleToggle = (categoryId) => {
        setLocalSettings(prev => ({
            ...prev,
            [categoryId]: !prev[categoryId]
        }));
    };

    const handleSave = () => {
        Object.entries(localSettings).forEach(([categoryId, enabled]) => {
            onUpdateCategory(categoryId, enabled);
        });
        onClose();
    };

    const handleReset = () => {
        const defaults = Object.values(NOTIFICATION_CATEGORIES).reduce((acc, cat) => {
            acc[cat.id] = true;
            return acc;
        }, {});
        setLocalSettings(defaults);
    };

    const availableCategories = Object.values(NOTIFICATION_CATEGORIES).filter(
        category => category.roles.includes(userRole)
    );

    const enabledCount = Object.values(localSettings).filter(v => v === true).length;

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
                        <Settings size={18} style={{ color: 'var(--brand-accent)' }} />
                        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                            Notification Settings
                        </h2>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={handleReset}
                            className="p-1.5 transition-colors duration-fast hover:bg-surface-hover"
                            style={{ color: 'var(--text-tertiary)' }}
                            title="Reset to default"
                        >
                            <RotateCcw size={14} />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 transition-colors duration-fast hover:bg-surface-hover"
                            style={{ color: 'var(--text-tertiary)' }}
                        >
                            <X size={16} />
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

                {/* Categories List */}
                <div className="flex-1 overflow-y-auto">
                    {availableCategories.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Bell size={32} style={{ color: 'var(--text-tertiary)' }} />
                            <p className="mt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                No categories available
                            </p>
                        </div>
                    ) : (
                        <div>
                            {availableCategories.map((category) => (
                                <div
                                    key={category.id}
                                    className="flex items-center justify-between px-5 py-3 border-b border-border-light hover:bg-surface-hover transition-colors duration-fast"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                {category.label}
                                            </h3>
                                            <span className="text-[10px] px-1.5 py-0.5 uppercase" style={{ backgroundColor: 'var(--background-tertiary)', color: 'var(--text-tertiary)' }}>
                                                {category.roles[0]}
                                            </span>
                                        </div>
                                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                            {getCategoryDescription(category.id)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleToggle(category.id)}
                                        className="p-1.5 transition-colors duration-fast ml-3"
                                        style={{
                                            color: localSettings[category.id] ? 'var(--brand-accent)' : 'var(--text-tertiary)'
                                        }}
                                    >
                                        {localSettings[category.id] ? <Bell size={16} /> : <BellOff size={16} />}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-5 py-4 border-t border-border-default" style={{ backgroundColor: 'var(--background-tertiary)' }}>
                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {enabledCount} of {availableCategories.length} active
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleReset}
                            className="px-3 py-1.5 text-xs transition-colors duration-fast"
                            style={{ color: 'var(--text-secondary)' }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                        >
                            Reset
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-1.5 text-xs font-medium transition-colors duration-fast"
                            style={{ backgroundColor: 'var(--brand-accent)', color: 'var(--text-inverse)' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--brand-primary-dark)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--brand-accent)'}
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

// Helper function for category descriptions
function getCategoryDescription(categoryId) {
    const descriptions = {
        industrialization_draft: 'Draft RFQs in Industrialization',
        sent_to_purchases: 'RFQs forwarded to Purchases',
        purchases_draft: 'Draft RFQs in Purchases',
        sent_to_suppliers: 'RFQs sent to suppliers',
        suppliers_draft: 'Draft responses from suppliers',
        suppliers_response: 'Quote submissions from suppliers',
        waiting_for_suppliers: 'Pending supplier responses',
        supplier_selected: 'Supplier award notifications',
        rfq_closed: 'Closed RFQ notifications'
    };
    return descriptions[categoryId] || 'Manage notification preferences';
}