// components/layout/NavBar.jsx
import { NavLink, useLocation } from 'react-router-dom';
import { LogOut, User, ChevronDown, Bell, ChevronRight } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Cookies from 'js-cookie';
import Button from '../ui/Button';
import NotisSidebar from './NotisSidebar';
import { useNotifications } from '../../contexts/NotificationContext';

function NavBar({ module, basePath, tabs = [], sections = [], user = { name: 'User' }, sectionsFirst = false }) {
    const location = useLocation();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [openDropdown, setOpenDropdown] = useState(null);
    const dropdownTimeoutRef = useRef(null);

    const {
        notifications,
        markAsRead,
        clearAll,
        unreadCount,
        updateUserRole,
    } = useNotifications();

    // Update user role when route changes
    useEffect(() => {
        updateUserRole(location.pathname);
    }, [location.pathname, updateUserRole]);

    // Handle dropdown hover
    const handleDropdownEnter = (index) => {
        if (dropdownTimeoutRef.current) {
            clearTimeout(dropdownTimeoutRef.current);
        }
        setOpenDropdown(index);
    };

    const handleDropdownLeave = () => {
        dropdownTimeoutRef.current = setTimeout(() => {
            setOpenDropdown(null);
        }, 200);
    };

    // Check if a dropdown item is active
    const isDropdownItemActive = (section) => {
        return section.items.some(item => location.pathname === `${basePath}/${item.path}`);
    };

    // Check if any item in section is active
    const isSectionActive = (section) => {
        return section.items.some(item => location.pathname === `${basePath}/${item.path}`);
    };

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

                        {/* Tabs & Dropdown Sections */}
                        <div className="flex items-center justify-start">
                            <div className="hidden sm:ml-6 sm:flex sm:space-x-1">
                                {/* Regular Tabs */}
                                {!sectionsFirst && tabs.map((tab) => (
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

                                {/* Dropdown Sections */}
                                {sections.map((section, index) => {
                                    const isActive = isSectionActive(section);
                                    return (
                                        <div
                                            key={section.label}
                                            className="relative"
                                            onMouseEnter={() => handleDropdownEnter(index)}
                                            onMouseLeave={handleDropdownLeave}
                                        >
                                            <button
                                                className={`
                                                    px-3 py-2 text-sm font-medium transition-colors duration-fast
                                                    flex items-center gap-1
                                                    ${isActive || openDropdown === index
                                                        ? 'text-brand-accent border-b-2 border-brand-accent'
                                                        : 'text-text-secondary hover:text-text-primary hover:border-b-2 hover:border-border-dark'
                                                    }
                                                `}
                                            >
                                                {section.label}
                                                <ChevronDown size={14} className={`transition-transform duration-200 ${openDropdown === index ? 'rotate-180' : ''}`} />
                                            </button>

                                            {/* Dropdown Menu */}
                                            {openDropdown === index && (
                                                <div
                                                    className="absolute left-0 mt-0 w-56 bg-surface border border-border-default shadow-lg"
                                                    style={{ zIndex: 'var(--z-popover)' }}
                                                >
                                                    {section.items.map((item) => {
                                                        const isItemActive = location.pathname === `${basePath}/${item.path}`;
                                                        return (
                                                            <NavLink
                                                                key={item.path}
                                                                to={`${basePath}/${item.path}`}
                                                                className={`
                                                                    flex items-center justify-between px-4 py-2 text-sm transition-colors duration-fast
                                                                    ${isItemActive
                                                                        ? 'text-brand-accent bg-brand-accent/5'
                                                                        : 'text-text-primary hover:bg-surface-hover'
                                                                    }
                                                                `}
                                                                onClick={() => setOpenDropdown(null)}
                                                            >
                                                                {item.label}
                                                                {isItemActive && <ChevronRight size={14} style={{ color: 'var(--brand-accent)' }} />}
                                                            </NavLink>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Tabs rendered after sections when sectionsFirst=true */}
                                {sectionsFirst && tabs.map((tab) => (
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
                                                    Cookies.remove('access_token');
                                                    Cookies.remove('refresh_token');
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
            />
        </>
    );
}

export default NavBar;