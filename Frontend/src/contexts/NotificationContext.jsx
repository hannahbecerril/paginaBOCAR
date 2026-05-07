// contexts/NotificationContext.jsx
import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
};

// Notification Categories - No emojis, clean labels
export const NOTIFICATION_CATEGORIES = {
    INDUSTRIALIZATION_DRAFT: {
        id: 'industrialization_draft',
        label: 'Industrialization Draft',
        roles: ['industrialization']
    },
    SENT_TO_PURCHASES: {
        id: 'sent_to_purchases',
        label: 'Sent to Purchases',
        roles: ['industrialization', 'purchases']
    },
    PURCHASES_DRAFT: {
        id: 'purchases_draft',
        label: 'Purchases Draft',
        roles: ['purchases']
    },
    SENT_TO_SUPPLIERS: {
        id: 'sent_to_suppliers',
        label: 'Sent to Suppliers',
        roles: ['purchases']
    },
    SUPPLIERS_DRAFT: {
        id: 'suppliers_draft',
        label: 'Suppliers Draft',
        roles: ['suppliers']
    },
    SUPPLIERS_RESPONSE: {
        id: 'suppliers_response',
        label: 'Suppliers Response',
        roles: ['purchases', 'suppliers']
    },
    WAITING_FOR_SUPPLIERS: {
        id: 'waiting_for_suppliers',
        label: 'Waiting for Suppliers',
        roles: ['purchases']
    },
    SUPPLIER_SELECTED: {
        id: 'supplier_selected',
        label: 'Supplier Selected',
        roles: ['industrialization', 'purchases', 'suppliers']
    },
    RFQ_CLOSED: {
        id: 'rfq_closed',
        label: 'RFQ Closed',
        roles: ['industrialization', 'purchases', 'suppliers']
    }
};

// Get user role based on route
export const getUserRoleFromPath = (pathname) => {
    const lowerPath = pathname.toLowerCase();
    if (lowerPath.includes('/industrialization')) return 'industrialization';
    if (lowerPath.includes('/purchases')) return 'purchases';
    if (lowerPath.includes('/suppliers')) return 'suppliers';
    return 'industrialization';
};

// Mock data by role
const MOCK_NOTIFICATIONS = {
    industrialization: [
        {
            id: 1,
            title: 'RFQ Draft Saved',
            message: 'RFQ #RFQ-2024-001 has been saved as draft',
            type: 'info',
            categoryId: 'industrialization_draft',
            date: new Date(),
            read: false
        },
        {
            id: 2,
            title: 'Sent to Purchases',
            message: 'RFQ #RFQ-2024-002 has been forwarded to Purchases',
            type: 'success',
            categoryId: 'sent_to_purchases',
            date: new Date(Date.now() - 3600000),
            read: false
        },
        {
            id: 3,
            title: 'Supplier Selected',
            message: 'Tech Supplies Co. selected for RFQ #RFQ-2024-003',
            type: 'success',
            categoryId: 'supplier_selected',
            date: new Date(Date.now() - 7200000),
            read: true
        },
        {
            id: 4,
            title: 'RFQ Closed',
            message: 'RFQ #RFQ-2024-004 closed. Supplier: Global Materials Inc.',
            type: 'info',
            categoryId: 'rfq_closed',
            date: new Date(Date.now() - 86400000),
            read: false
        }
    ],
    purchases: [
        {
            id: 101,
            title: 'New RFQ Received',
            message: 'RFQ #RFQ-2024-005 received from Industrialization',
            type: 'info',
            categoryId: 'sent_to_purchases',
            date: new Date(),
            read: false
        },
        {
            id: 102,
            title: 'Purchases Draft',
            message: 'RFQ #RFQ-2024-006 awaiting review',
            type: 'warning',
            categoryId: 'purchases_draft',
            date: new Date(Date.now() - 1800000),
            read: false
        },
        {
            id: 103,
            title: 'Sent to Suppliers',
            message: 'RFQ #RFQ-2024-007 sent to 5 suppliers',
            type: 'success',
            categoryId: 'sent_to_suppliers',
            date: new Date(Date.now() - 3600000),
            read: false
        },
        {
            id: 104,
            title: 'Supplier Response',
            message: 'MetalWorks Ltd. submitted quotation for RFQ #RFQ-2024-008',
            type: 'info',
            categoryId: 'suppliers_response',
            date: new Date(Date.now() - 7200000),
            read: false
        },
        {
            id: 105,
            title: 'Waiting for Suppliers',
            message: 'RFQ #RFQ-2024-009: 2 of 4 responses received',
            type: 'warning',
            categoryId: 'waiting_for_suppliers',
            date: new Date(Date.now() - 10800000),
            read: true
        },
        {
            id: 106,
            title: 'Supplier Selected',
            message: 'ElectroParts Co. selected for RFQ #RFQ-2024-010',
            type: 'success',
            categoryId: 'supplier_selected',
            date: new Date(Date.now() - 86400000),
            read: false
        }
    ],
    suppliers: [
        {
            id: 201,
            title: 'New RFQ Assignment',
            message: 'Invited to quote for RFQ #RFQ-2024-011',
            type: 'info',
            categoryId: 'sent_to_suppliers',
            date: new Date(),
            read: false
        },
        {
            id: 202,
            title: 'Draft Response Saved',
            message: 'Draft response for RFQ #RFQ-2024-012 saved',
            type: 'info',
            categoryId: 'suppliers_draft',
            date: new Date(Date.now() - 1800000),
            read: false
        },
        {
            id: 203,
            title: 'Quote Submitted',
            message: 'Quotation for RFQ #RFQ-2024-013 submitted',
            type: 'success',
            categoryId: 'suppliers_response',
            date: new Date(Date.now() - 3600000),
            read: false
        },
        {
            id: 204,
            title: 'Selection Notification',
            message: 'Your company selected for RFQ #RFQ-2024-014',
            type: 'success',
            categoryId: 'supplier_selected',
            date: new Date(Date.now() - 86400000),
            read: true
        }
    ]
};

// Helper to attach category objects to notifications
const attachCategoryToNotifications = (notifications) => {
    return notifications.map(notification => ({
        ...notification,
        category: NOTIFICATION_CATEGORIES[Object.keys(NOTIFICATION_CATEGORIES).find(
            key => NOTIFICATION_CATEGORIES[key].id === notification.categoryId
        )]
    }));
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [userRole, setUserRole] = useState('industrialization');
    const [enabledCategories, setEnabledCategories] = useState(() => {
        const saved = localStorage.getItem('notification_categories');
        if (saved) return JSON.parse(saved);
        // Enable all categories by default
        return Object.values(NOTIFICATION_CATEGORIES).reduce((acc, cat) => {
            acc[cat.id] = true;
            return acc;
        }, {});
    });

    // Load notifications based on role
    const loadNotificationsForRole = useCallback((role) => {
        const rawNotifications = MOCK_NOTIFICATIONS[role] || MOCK_NOTIFICATIONS.industrialization;
        const notificationsWithCategory = attachCategoryToNotifications(rawNotifications);
        setNotifications(notificationsWithCategory);
    }, []);

    // Update user role when route changes
    const updateUserRole = useCallback((pathname) => {
        const newRole = getUserRoleFromPath(pathname);
        if (newRole !== userRole) {
            setUserRole(newRole);
            loadNotificationsForRole(newRole);
        }
    }, [userRole, loadNotificationsForRole]);

    // Persist category settings
    useEffect(() => {
        localStorage.setItem('notification_categories', JSON.stringify(enabledCategories));
    }, [enabledCategories]);

    const markAsRead = useCallback((notificationId) => {
        if (notificationId === 'all') {
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } else {
            setNotifications(prev => prev.map(n =>
                n.id === notificationId ? { ...n, read: true } : n
            ));
        }
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    const updateCategorySettings = useCallback((categoryId, enabled) => {
        setEnabledCategories(prev => ({
            ...prev,
            [categoryId]: enabled
        }));
    }, []);

    // Filter notifications based on enabled categories and user role
    const filteredNotifications = notifications.filter(notification => {
        if (!notification?.category) return false;
        const { category } = notification;
        return enabledCategories[category.id] && category.roles.includes(userRole);
    });

    return (
        <NotificationContext.Provider value={{
            notifications: filteredNotifications,
            allNotifications: notifications,
            markAsRead,
            clearAll,
            unreadCount: filteredNotifications.filter(n => !n.read).length,
            userRole,
            updateUserRole,
            enabledCategories,
            updateCategorySettings,
            NOTIFICATION_CATEGORIES
        }}>
            {children}
        </NotificationContext.Provider>
    );
};