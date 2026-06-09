// src/sections/Industrialization/index.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import NavBar from '../../components/layout/NavBar';
import CreateRFQ from './CreateRFQ';
import AllRFQ from './AllRFQ';
import Drafts from './Drafts';
import PendingReview from './PendingReview';
import Dashboard from './Dashboard';
import Users from './Users';
import RFQDetails from '../../components/layout/RFQDetails';
import UserDetails from '../../components/layout/UserDetails';
import Calendar from '../../components/layout/Calendar';
import Chatbot from '../../components/layout/Chatbot';

function getStoredUser() {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
}

export default function IndustrializationDashboard() {
    const storedUser = getStoredUser();
    const displayName = storedUser.first_name
        ? `${storedUser.first_name} ${storedUser.last_name ?? ''}`.trim()
        : storedUser.username ?? 'User';

    const userGroups = storedUser.grupos ?? [];
    const isAdmin = userGroups.some(g => g.includes('_Admin') || g === 'SuperAdmin');

    const tabs = [
        { label: 'Create RFQ', path: 'Create-RFQ' },
        { label: 'Dashboard',  path: 'Dashboard' },
        ...(isAdmin ? [{ label: 'Users', path: 'Users' }] : []),
        { label: 'Calendar',   path: 'Calendar' },
        { label: 'Assistant',  path: 'Chatbot' },
    ];

    const sections = [
        {
            label: 'RFQ Management',
            items: [
                { label: 'All RFQs', path: 'All-RFQ' },
                { label: 'Drafts',   path: 'Drafts' },
                ...(isAdmin ? [{ label: 'Pending Review', path: 'Pending-Review' }] : []),
            ],
        },
    ];

    return (
        <div style={{ backgroundColor: 'var(--background-secondary)' }}>
            <NavBar
                module="Industrialization"
                basePath="/Industrialization"
                tabs={tabs}
                sections={sections}
                user={{ name: displayName }}
            />

            <div className="p-6">
                <Routes>
                    <Route index element={<Navigate to="Create-RFQ" replace />} />
                    <Route path="Create-RFQ"       element={<CreateRFQ />} />
                    <Route path="All-RFQ"          element={<AllRFQ />} />
                    <Route path="Drafts"           element={<Drafts />} />
                    <Route path="Pending-Review"   element={isAdmin ? <PendingReview /> : <Navigate to="Drafts" replace />} />
                    <Route path="Dashboard"        element={<Dashboard />} />
                    <Route path="Calendar"         element={<Calendar userRole="industrialization" />} />
                    <Route path="Chatbot"          element={<Chatbot  userRole="industrialization" />} />
                    <Route path="Users"            element={isAdmin ? <Users /> : <Navigate to="Dashboard" replace />} />
                    <Route path="Sent-to-Purchases" element={<AllRFQ />} />
                    <Route path="Closed-RFQs"      element={<AllRFQ />} />
                    <Route path="Monthly-Report"   element={<Dashboard />} />
                    <Route path="Quarterly-Report" element={<Dashboard />} />
                    <Route path="Supplier-Performance" element={<Dashboard />} />
                    <Route path="rfq/:id"  element={<RFQDetails />} />
                    <Route path="user/:id" element={<UserDetails />} />
                </Routes>
            </div>
        </div>
    );
}
