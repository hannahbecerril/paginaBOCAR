// contexts/NotificationContext.jsx
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import Cookies from 'js-cookie';
import { getNotifications, markNotificationRead, clearNotifications, NOTIFICATION_CATEGORIES } from '../sections/api';

const NotificationContext = createContext();

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
};

export { NOTIFICATION_CATEGORIES };

export const getUserRoleFromPath = (pathname) => {
    const lowerPath = pathname.toLowerCase();
    if (lowerPath.includes('/industrialization')) return 'industrialization';
    if (lowerPath.includes('/purchases')) return 'purchases';
    if (lowerPath.includes('/suppliers')) return 'suppliers';
    return 'industrialization';
};

const attachCategoryToNotifications = (notifications) => {
    return notifications.map(notification => ({
        ...notification,
        date: new Date(notification.date),
        category: NOTIFICATION_CATEGORIES[
            Object.keys(NOTIFICATION_CATEGORIES).find(
                key => NOTIFICATION_CATEGORIES[key].id === notification.categoryId
            )
        ],
    }));
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [userRole, setUserRole] = useState('industrialization');
    const [enabledCategories, setEnabledCategories] = useState(() => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const key = user?.id ? `notif_prefs_${user.id}` : 'notif_prefs_global';
            const saved = localStorage.getItem(key);
            if (saved) return JSON.parse(saved);
        } catch { /* ignore */ }
        return Object.values(NOTIFICATION_CATEGORIES).reduce((acc, cat) => {
            acc[cat.id] = true;
            return acc;
        }, {});
    });

    const loadNotifications = useCallback(() => {
        // Skip if not logged in — avoids auth-loop when context mounts on the Login page
        if (!Cookies.get('access_token')) return;

        getNotifications()
            .then(raw => setNotifications(attachCategoryToNotifications(raw)))
            .catch(() => { /* Notification failures are non-critical — silently ignore */ });
    }, []);

    // Load once on mount (only after login — guarded by token check above).
    // Subsequent refreshes happen only on full page reload (user requirement).
    useEffect(() => {
        loadNotifications();
    }, []); // intentional empty deps — single load per page session

    // Update user role when route changes (no re-fetch needed — backend scopes to user)
    const updateUserRole = useCallback((pathname) => {
        const newRole = getUserRoleFromPath(pathname);
        setUserRole(newRole);
    }, []);

    useEffect(() => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const key = user?.id ? `notif_prefs_${user.id}` : 'notif_prefs_global';
            localStorage.setItem(key, JSON.stringify(enabledCategories));
        } catch { /* ignore */ }
    }, [enabledCategories]);

    const markAsRead = useCallback((notificationId) => {
        // Optimistic update
        if (notificationId === 'all') {
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } else {
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
            );
        }
        markNotificationRead(notificationId).catch(err =>
            console.warn('markAsRead failed:', err.message)
        );
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
        clearNotifications().catch(err =>
            console.warn('clearAll failed:', err.message)
        );
    }, []);

    const updateCategorySettings = useCallback((categoryId, enabled) => {
        setEnabledCategories(prev => ({ ...prev, [categoryId]: enabled }));
    }, []);

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
            NOTIFICATION_CATEGORIES,
            reloadNotifications: loadNotifications,
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
