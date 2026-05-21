// src/sections/Industrialization/index.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import NavBar from '../../components/layout/NavBar';
import CreateRFQ from './CreateRFQ';
import AllRFQ from './AllRFQ';
import Drafts from './Drafts';
import Dashboard from './Dashboard';
import Users from './Users';
import RFQDetails from '../../components/layout/RFQDetails';
import UserDetails from '../../components/layout/UserDetails';

export default function IndustrializationDashboard() {
    // Regular tabs (no dropdown)
    const tabs = [
        { label: 'Create RFQ', path: 'Create-RFQ' },
        { label: 'Dashboard', path: 'Dashboard' },
        { label: 'Users', path: 'Users' },
    ];

    // Dropdown sections
    const sections = [
        {
            label: 'RFQ Management',
            items: [
                { label: 'All RFQs', path: 'All-RFQ' },
                { label: 'Drafts', path: 'Drafts' },
            ]
        },
    ];

    return (
        <div style={{ backgroundColor: 'var(--background-secondary)' }}>
            <NavBar
                module="Industrialization"
                basePath="/Industrialization"
                tabs={tabs}
                sections={sections}
                user={{ name: "Maria Garcia" }}
            />

            <div className="p-6">
                <Routes>
                    <Route index element={<Navigate to="Create-RFQ" replace />} />
                    <Route path="Create-RFQ" element={<CreateRFQ />} />
                    <Route path="All-RFQ" element={<AllRFQ />} />
                    <Route path="Drafts" element={<Drafts />} />
                    <Route path="Dashboard" element={<Dashboard />} />
                    <Route path="Users" element={<Users />} />

                    {/* Placeholder routes for additional dropdown items */}
                    <Route path="Sent-to-Purchases" element={<AllRFQ />} />
                    <Route path="Closed-RFQs" element={<AllRFQ />} />
                    <Route path="Monthly-Report" element={<Dashboard />} />
                    <Route path="Quarterly-Report" element={<Dashboard />} />
                    <Route path="Supplier-Performance" element={<Dashboard />} />

                    {/* Dynamic routes for details */}
                    <Route path="rfq/:id" element={<RFQDetails />} />
                    <Route path="user/:id" element={<UserDetails />} />
                </Routes>
            </div>
        </div>
    );
}