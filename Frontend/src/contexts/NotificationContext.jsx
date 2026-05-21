// contexts/NotificationContext.jsx
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import notificationsData from '../sections/notis-data.json';

const NotificationContext = createContext();

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
};

// Notification Categories
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

// Helper to attach category objects to notifications
const attachCategoryToNotifications = (notifications) => {
    return notifications.map(notification => ({
        ...notification,
        date: new Date(notification.date),
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
        return Object.values(NOTIFICATION_CATEGORIES).reduce((acc, cat) => {
            acc[cat.id] = true;
            return acc;
        }, {});
    });

    // Load notifications based on role
    const loadNotificationsForRole = useCallback((role) => {
        const rawNotifications = notificationsData.notifications[role] || notificationsData.notifications.industrialization;
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