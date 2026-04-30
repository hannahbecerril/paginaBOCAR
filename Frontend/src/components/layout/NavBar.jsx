// components/layout/NavBar.jsx
import { NavLink, useLocation } from 'react-router-dom';
import { LogOut, User, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function NavBar({ module, basePath, tabs, user }) {
    const location = useLocation();
    const [showUserMenu, setShowUserMenu] = useState(false);

    const isActive = (path) => {
        const currentPath = location.pathname;
        const fullPath = `${basePath}/${path}`;
        return currentPath === fullPath || (path === '' && currentPath === basePath);
    };

    return (
        <nav className="bg-surface border-b border-border-default">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Left section */}
                    <div className="flex items-center">
                        <div className="flex-shrink-0 flex items-center">
                            <div className="w-8 h-8 bg-brand-primary flex items-center justify-center">
                                <div className="grid grid-cols-2 gap-[2px]">
                                    <div className="w-2 h-2 bg-white" />
                                    <div className="w-2 h-2 bg-white" />
                                    <div className="w-2 h-2 bg-white" />
                                    <div className="w-2 h-2 bg-white" />
                                </div>
                            </div>
                            <span className="ml-3 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                {module}
                            </span>
                        </div>

                        {/* Tabs */}
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

                    {/* Right section - User menu */}
                    <div className="flex items-center">
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
                                        className="fixed inset-0 z-dropdown"
                                        onClick={() => setShowUserMenu(false)}
                                    />
                                    <div className="absolute right-0 mt-2 w-48 bg-surface border border-border-default z-popover">
                                        <button
                                            onClick={() => {
                                                localStorage.removeItem('user');
                                                window.location.href = '/';
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
    );
}