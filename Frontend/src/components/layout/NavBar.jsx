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
        <nav className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Left section */}
                    <div className="flex items-center">
                        <div className="flex-shrink-0 flex items-center">
                            <div className="w-8 h-8 bg-gray-900 flex items-center justify-center">
                                <div className="grid grid-cols-2 gap-[2px]">
                                    <div className="w-2 h-2 bg-white" />
                                    <div className="w-2 h-2 bg-white" />
                                    <div className="w-2 h-2 bg-white" />
                                    <div className="w-2 h-2 bg-white" />
                                </div>
                            </div>
                            <span className="ml-3 text-sm font-semibold text-gray-900">
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
                                        px-3 py-2 text-sm font-medium
                                        ${isActive
                                            ? 'text-blue-600 border-b-2 border-blue-600'
                                            : 'text-gray-600 hover:text-gray-900 hover:border-b-2 hover:border-gray-300'
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
                                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                                <div className="w-6 h-6 bg-gray-200 flex items-center justify-center">
                                    <User size={14} className="text-gray-600" />
                                </div>
                                <span>{user?.name || 'Usuario'}</span>
                                <ChevronDown size={14} />
                            </button>

                            {showUserMenu && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setShowUserMenu(false)}
                                    />
                                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 z-20">
                                        <button
                                            onClick={() => {
                                                // Handle logout
                                                localStorage.removeItem('usuario');
                                                window.location.href = '/';
                                            }}
                                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                        >
                                            <LogOut size={14} />
                                            Cerrar Sesión
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