// src/sections/Purchases/index.jsx
import { Routes, Route, Navigate } from 'react-router-dom';

import NavBar from '../../components/layout/NavBar';

import SuppliersList from './SuppliersList';
import Users from './Users';

import AllRFQ from './AllRFQ';
import NotAnsweredRFQ from './NotAnsweredRFQ';
import Drafts from './Drafts';

import RFQDetails from '../../components/layout/RFQDetails';
import UserDetails from '../../components/layout/UserDetails';

export default function PurchasesDashboard() {
    // Regular tabs (no dropdown)
    const tabs = [
        { label: 'Suppliers List', path: 'Suppliers' },
        { label: 'Users', path: 'Users' },
    ];

    // Dropdown sections
    const sections = [
        {
            label: 'RFQ Management',
            items: [
                { label: 'All RFQ', path: 'All-RFQ' },
                { label: 'Not Answered RFQs', path: 'Not-Answered-RFQs' },
                { label: 'Drafts', path: 'Drafts' },
            ]
        },
    ];

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--background-secondary)' }}>
            <NavBar
                module="Purchases"
                basePath="/Purchases"
                tabs={tabs}
                sections={sections}
                user={{ name: "Maria Garcia" }}
            />

            <div className="p-6">
                <Routes>
                    <Route index element={<Navigate to="Suppliers" replace />} />
                    <Route path="Suppliers" element={<SuppliersList />} />
                    <Route path="Users" element={<Users />} />
                    <Route path="Drafts" element={<Drafts />} />
                    <Route path="All-RFQ" element={<AllRFQ />} />
                    <Route path="Not-Answered-RFQs" element={<NotAnsweredRFQ />} />
                    {/* Dynamic routes for details */}
                    <Route path="rfq/:id" element={<RFQDetails />} />
                    <Route path="user/:id" element={<UserDetails />} />
                    <Route path="supplier/:id" element={<UserDetails />} />
                </Routes>
            </div>
        </div>
    );
}