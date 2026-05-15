// src/sections/Suppliers/index.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import NavBar from '../../components/layout/NavBar';
import Drafts from './Drafts';
import RFQList from './RFQList';

import RFQDetails from '../../components/layout/RFQDetails';
import UserDetails from '../../components/layout/UserDetails';

export default function SuppliersDashboard() {
    const tabs = [
        { label: 'Drafts', path: 'Drafts' },
        { label: 'RFQ List', path: 'RFQ-List' },
    ];

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--background-secondary)' }}>
            <NavBar
                module="Suppliers"
                basePath="/Suppliers"
                tabs={tabs}
                user={{ name: "Maria Garcia" }}
            />

            <div className="p-6">
                <Routes>
                    <Route index element={<Navigate to="Drafts" replace />} />
                    <Route path="Drafts" element={<Drafts />} />
                    <Route path="RFQ-List" element={<RFQList />} />

                    {/* Dynamic routes for details */}
                    <Route path="rfq/:id" element={<RFQDetails />} />
                    <Route path="user/:id" element={<UserDetails />} />
                </Routes>
            </div>
        </div>
    );
}