// src/sections/Purchases/index.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import NavBar from '../../components/layout/NavBar';
import SuppliersList from './SuppliersList';
import Users from './Users';
import AllRFQ from './AllRFQ';
import NotAnsweredRFQ from './NotAnsweredRFQ';
import Drafts from './Drafts';
import Dashboard from './Dashboard';
import RFQDetails from '../../components/layout/RFQDetails';
import UserDetails from '../../components/layout/UserDetails';
import Calendar from '../../components/layout/Calendar';
import Chatbot from '../../components/layout/Chatbot';

function getStoredUser() {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
}

export default function PurchasesDashboard() {
    const storedUser = getStoredUser();
    const displayName = storedUser.first_name
        ? `${storedUser.first_name} ${storedUser.last_name ?? ''}`.trim()
        : storedUser.username ?? 'User';

    const userGroups = storedUser.grupos ?? [];
    const isAdmin = userGroups.some(g => g.includes('_Admin') || g === 'SuperAdmin');

    const tabs = [
        { label: 'Dashboard',  path: 'Dashboard' },
        ...(isAdmin ? [{ label: 'Suppliers List', path: 'Suppliers' }] : []),
        ...(isAdmin ? [{ label: 'Users',          path: 'Users' }]     : []),
        { label: 'Calendar',   path: 'Calendar' },
        { label: 'Assistant',  path: 'Chatbot' },
    ];

    const sections = [
        {
            label: 'RFQ Management',
            items: [
                { label: 'All RFQ',            path: 'All-RFQ' },
                { label: 'Not Answered RFQs',  path: 'Not-Answered-RFQs' },
                { label: 'Drafts',             path: 'Drafts' },
            ],
        },
    ];

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--background-secondary)' }}>
            <NavBar
                module="Purchases"
                basePath="/Purchases"
                tabs={tabs}
                sections={sections}
                user={{ name: displayName }}
                sectionsFirst={true}
            />

            <div className="p-6">
                <Routes>
                    <Route index element={<Navigate to="Dashboard" replace />} />
                    <Route path="Dashboard"         element={<Dashboard />} />
                    <Route path="Calendar"          element={<Calendar userRole="purchases" />} />
                    <Route path="Chatbot"           element={<Chatbot  userRole="purchases" />} />
                    <Route path="Suppliers"         element={isAdmin ? <SuppliersList /> : <Navigate to="Dashboard" replace />} />
                    <Route path="Users"             element={isAdmin ? <Users />         : <Navigate to="Dashboard" replace />} />
                    <Route path="Drafts"            element={<Drafts />} />
                    <Route path="All-RFQ"           element={<AllRFQ />} />
                    <Route path="Not-Answered-RFQs" element={<NotAnsweredRFQ />} />
                    <Route path="rfq/:id"           element={<RFQDetails />} />
                    <Route path="user/:id"          element={<UserDetails />} />
                    <Route path="supplier/:id"      element={<UserDetails />} />
                </Routes>
            </div>
        </div>
    );
}
