// components/layout/NavBar.jsx
import { NavLink, useLocation } from 'react-router-dom';
import { LogOut, ChevronDown, Bell, ChevronRight } from 'lucide-react';
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

    // Scroll-aware nav
    const [hidden, setHidden] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const lastScrollY = useRef(0);

    const {
        notifications,
        markAsRead,
        clearAll,
        unreadCount,
        updateUserRole,
    } = useNotifications();

    useEffect(() => {
        updateUserRole(location.pathname);
    }, [location.pathname, updateUserRole]);

    useEffect(() => {
        const onScroll = () => {
            const y = window.scrollY;
            const goingDown = y > lastScrollY.current;
            setScrolled(y > 8);
            if (y < 10) setHidden(false);
            else setHidden(goingDown);
            lastScrollY.current = y;
        };
        const onMouseMove = (e) => {
            if (e.clientY < 8) setHidden(false);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('mousemove', onMouseMove);
        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('mousemove', onMouseMove);
        };
    }, []);

    const handleDropdownEnter = (index) => {
        if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
        setOpenDropdown(index);
    };

    const handleDropdownLeave = () => {
        dropdownTimeoutRef.current = setTimeout(() => setOpenDropdown(null), 200);
    };

    const isSectionActive = (section) =>
        section.items.some(item => location.pathname === `${basePath}/${item.path}`);

    const initials = (user?.name ?? 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

    return (
        <>
            <nav
                style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 50,
                    transform: hidden ? 'translateY(-100%)' : 'translateY(0)',
                    transition: 'transform 320ms cubic-bezier(0.4,0,0.2,1), box-shadow 200ms ease',
                    backgroundColor: scrolled ? 'rgba(255,255,255,0.88)' : '#ffffff',
                    backdropFilter: scrolled ? 'blur(16px)' : 'none',
                    WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
                    boxShadow: scrolled
                        ? '0 1px 0 rgba(0,0,0,0.06), 0 4px 20px rgba(0,0,0,0.06)'
                        : '0 1px 0 var(--border-default)',
                }}
            >
                <div className="w-full px-4 sm:px-6 lg:px-8">
                    <div className="grid h-16" style={{ gridTemplateColumns: 'auto 1fr auto' }}>

                        {/* Left – logo + module */}
                        <div className="flex items-center">
                            <div className="flex items-center gap-3 px-4">
                                <img src="/BOCAR_logoBlue.png" alt="BOCAR" className="h-7 w-auto" />
                                <div className="h-4 w-px" style={{ backgroundColor: 'var(--border-default)' }} />
                                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                    {module}
                                </span>
                            </div>
                        </div>

                        {/* Center – tabs + dropdowns */}
                        <div className="flex items-center">
                            <div className="hidden sm:flex sm:items-center sm:gap-0.5 sm:ml-4">

                                {!sectionsFirst && tabs.map((tab) => (
                                    <NavLink
                                        key={tab.path}
                                        to={`${basePath}/${tab.path}`}
                                        className={({ isActive }) =>
                                            `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150
                                            ${isActive
                                                ? 'text-brand-accent bg-blue-50'
                                                : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'}`
                                        }
                                    >
                                        {tab.label}
                                    </NavLink>
                                ))}

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
                                                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150
                                                    ${isActive || openDropdown === index
                                                        ? 'text-brand-accent bg-blue-50'
                                                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'}`}
                                            >
                                                {section.label}
                                                <ChevronDown
                                                    size={14}
                                                    className={`transition-transform duration-200 ${openDropdown === index ? 'rotate-180' : ''}`}
                                                />
                                            </button>

                                            {openDropdown === index && (
                                                <div
                                                    className="absolute left-0 mt-1 w-52 rounded-xl overflow-hidden"
                                                    style={{
                                                        zIndex: 'var(--z-popover)',
                                                        backgroundColor: 'var(--surface)',
                                                        border: '1px solid var(--border-light)',
                                                        boxShadow: '0 8px 24px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)',
                                                    }}
                                                >
                                                    <div className="p-1">
                                                        {section.items.map((item) => {
                                                            const isItemActive = location.pathname === `${basePath}/${item.path}`;
                                                            return (
                                                                <NavLink
                                                                    key={item.path}
                                                                    to={`${basePath}/${item.path}`}
                                                                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors duration-fast
                                                                        ${isItemActive
                                                                            ? 'text-brand-accent bg-blue-50 font-medium'
                                                                            : 'text-text-primary hover:bg-surface-hover'}`}
                                                                    onClick={() => setOpenDropdown(null)}
                                                                >
                                                                    {item.label}
                                                                    {isItemActive && <ChevronRight size={13} style={{ color: 'var(--brand-accent)' }} />}
                                                                </NavLink>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {sectionsFirst && tabs.map((tab) => (
                                    <NavLink
                                        key={tab.path}
                                        to={`${basePath}/${tab.path}`}
                                        className={({ isActive }) =>
                                            `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150
                                            ${isActive
                                                ? 'text-brand-accent bg-blue-50'
                                                : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'}`
                                        }
                                    >
                                        {tab.label}
                                    </NavLink>
                                ))}
                            </div>
                        </div>

                        {/* Right – notifications + user */}
                        <div className="flex items-center gap-2 px-2">
                            <button
                                onClick={() => setShowNotifications(true)}
                                className="relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-surface-hover"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                <Bell size={17} />
                                <span className="hidden sm:inline">Notifications</span>
                                {unreadCount > 0 && (
                                    <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                                        style={{ backgroundColor: 'var(--brand-danger)' }}>
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            <div className="h-4 w-px" style={{ backgroundColor: 'var(--border-default)' }} />

                            <div className="relative">
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors hover:bg-surface-hover"
                                    style={{ color: 'var(--text-secondary)' }}
                                >
                                    <div
                                        className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                                        style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-accent))' }}
                                    >
                                        {initials}
                                    </div>
                                    <span className="hidden sm:inline max-w-[120px] truncate">{user?.name || 'User'}</span>
                                    <ChevronDown size={13} />
                                </button>

                                {showUserMenu && (
                                    <>
                                        <div
                                            className="fixed inset-0"
                                            style={{ zIndex: 'var(--z-dropdown)' }}
                                            onClick={() => setShowUserMenu(false)}
                                        />
                                        <div
                                            className="absolute right-0 mt-1 w-44 rounded-xl overflow-hidden"
                                            style={{
                                                zIndex: 'var(--z-popover)',
                                                backgroundColor: 'var(--surface)',
                                                border: '1px solid var(--border-light)',
                                                boxShadow: '0 8px 24px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)',
                                            }}
                                        >
                                            <div className="p-1">
                                                <button
                                                    onClick={() => {
                                                        localStorage.removeItem('user');
                                                        Cookies.remove('access_token');
                                                        Cookies.remove('refresh_token');
                                                        window.location.href = '/Login';
                                                    }}
                                                    className="w-full px-3 py-2 rounded-lg text-left text-sm flex items-center gap-2 transition-colors hover:bg-surface-hover"
                                                    style={{ color: 'var(--brand-danger)' }}
                                                >
                                                    <LogOut size={14} />
                                                    Sign Out
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

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
