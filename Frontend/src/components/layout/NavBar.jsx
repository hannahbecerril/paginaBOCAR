// components/layout/NavBar.jsx
import { NavLink, useLocation } from 'react-router-dom';
import { LogOut, User, ChevronDown, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import Button from '../ui/Button';
import NotisSidebar from './NotisSidebar';
import { useNotifications } from '../../contexts/NotificationContext';

function NavBar({ module, basePath, tabs, user }) {
    const location = useLocation();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    const {
        notifications,
        markAsRead,
        clearAll,
        unreadCount,
        updateUserRole,
        enabledCategories,
        updateCategorySettings,
        userRole
    } = useNotifications();

    // Update user role when route changes
    useEffect(() => {
        updateUserRole(location.pathname);
    }, [location.pathname, updateUserRole]);

    return (
        <>
            <nav className="bg-surface border-b border-border-default relative" style={{ zIndex: 10 }}>
                <div className="w-full px-4 sm:px-6 lg:px-8">
                    <div className="grid h-16" style={{ gridTemplateColumns: 'auto 1fr auto' }}>
                        {/* Left section */}
                        <div className="flex justify-center">
                            <div className="h-full flex-shrink-0 flex items-center px-10">
                                <div className="w-30 flex items-center justify-center">
                                    <img src="/BOCAR_logoBlue.png" alt="BOCAR logo" />
                                </div>

                                {/* Vertical Divider */}
                                <div className="h-6 w-px bg-border-default mx-3" />

                                <span className="ml-3 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                    {module}
                                </span>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex items-center justify-start">
                            <div className="hidden sm:ml-6 sm:flex sm:space-x-1">
                                {tabs.map((tab) => (
                                    <NavLink
                                        key={tab.path}
                                        to={`${basePath}/${tab.path}`}
                                        className={({ isActive }) => `
                                            px-3 py-2 text-sm font-medium transition-colors duration-fast
                                            ${isActive
                                                ? 'text-brand-accent border-b-2 border-brand-accent'
                                                : 'text-text-secondary hover:text-text-primary hover:border-b-2 hover:border-border-dark'
                                            }
                                        `}
                                    >
                                        {tab.label}
                                    </NavLink>
                                ))}
                            </div>
                        </div>

                        {/* Right section */}
                        <div className="flex items-center justify-center">
                            <Button
                                variant="outline"
                                onClick={() => setShowNotifications(true)}
                                className="border-none"
                            >
                                <div className='flex justify-around gap-8'>
                                    <div className="relative">
                                        <Bell className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                                        {unreadCount > 0 && (
                                            <span className="absolute -top-1.5 -right-4 inline-flex items-center justify-center px-2 py-1 text-[10px] font-bold leading-none"
                                                style={{ color: 'var(--text-inverse)', backgroundColor: 'var(--brand-danger)' }}
                                            >
                                                {unreadCount}
                                            </span>
                                        )}
                                    </div>
                                    Notifications
                                </div>
                            </Button>

                            {/* Vertical Divider */}
                            <div className="h-6 w-px bg-border-default mx-3" />

                            <div className="relative">
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="flex items-center gap-2 px-3 py-2 text-sm transition-colors duration-fast"
                                    style={{ color: 'var(--text-secondary)' }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-hover)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <div className="w-6 h-6 bg-surface-hover flex items-center justify-center">
                                        <User size={14} style={{ color: 'var(--text-secondary)' }} />
                                    </div>
                                    <span>{user?.name || 'User'}</span>
                                    <ChevronDown size={14} />
                                </button>

                                {showUserMenu && (
                                    <>
                                        <div
                                            className="fixed inset-0"
                                            style={{ zIndex: 'var(--z-dropdown)' }}
                                            onClick={() => setShowUserMenu(false)}
                                        />
                                        <div className="absolute right-0 mt-2 w-48 bg-surface border border-border-default" style={{ zIndex: 'var(--z-popover)' }}>
                                            <button
                                                onClick={() => {
                                                    localStorage.removeItem('user');
                                                    localStorage.removeItem('access_token');
                                                    localStorage.removeItem('refresh_token');
                                                    window.location.href = '/Login';
                                                }}
                                                className="w-full px-4 py-2 text-left text-sm transition-colors duration-fast flex items-center gap-2"
                                                style={{ color: 'var(--text-primary)' }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-hover)'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                <LogOut size={14} />
                                                Sign Out
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Notifications Sidebar */}
            <NotisSidebar
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                notifications={notifications}
                onMarkAsRead={markAsRead}
                onClearAll={clearAll}
                onUpdateCategory={updateCategorySettings}
                enabledCategories={enabledCategories}
                userRole={userRole}
            />
        </>
    );
}

export default NavBar; // Make sure this line exists!