// src/sections/SuperAdmin/index.jsx
// SuperAdmin dashboard shell — wraps all SuperAdmin-only sub-routes.

import { Routes, Route, Navigate } from 'react-router-dom';
import NavBar from '../../components/layout/NavBar';
import UserManagement from './UserManagement';
import UserDetails from '../../components/layout/UserDetails';

function getStoredUser() {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
}

export default function SuperAdminDashboard() {
    const storedUser = getStoredUser();
    const displayName = storedUser.first_name
        ? `${storedUser.first_name} ${storedUser.last_name ?? ''}`.trim()
        : storedUser.username ?? 'SuperAdmin';

    const tabs = [
        { label: 'Users', path: 'Users' },
    ];

    return (
        <div style={{ backgroundColor: 'var(--background-secondary)' }}>
            <NavBar
                module="Super Admin"
                basePath="/SuperAdmin"
                tabs={tabs}
                sections={[]}
                user={{ name: displayName }}
            />

<div className="p-4 md:p-8 max-w-7xl mx-auto">
                <Routes>
                    <Route index element={<Navigate to="Users" replace />} />
                    <Route path="Users" element={<UserManagement />} />
                    <Route path="user/:id" element={<UserDetails />} />
                </Routes>
            </div>
        </div>
    );
}
