// src/sections/Suppliers/index.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import NavBar from '../../components/layout/NavBar';
import AllRFQ from './AllRFQ';
import NotAnsweredRFQ from './NotAnsweredRFQ';
import Drafts from './Drafts';

import RFQDetails from '../../components/layout/RFQDetails';
import UserDetails from '../../components/layout/UserDetails';

export default function SuppliersDashboard() {
    const tabs = [
        { label: 'All RFQs', path: 'All-RFQ' },
        { label: 'Not Answered RFQs', path: 'Not-Answered-RFQ' },
        { label: 'Drafts', path: 'Drafts' },
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
                    <Route path="All-RFQ" element={<AllRFQ />} />
                    <Route path="Not-Answered-RFQ" element={<NotAnsweredRFQ />} />
                    <Route path="Drafts" element={<Drafts />} />

                    {/* Dynamic routes for details */}
                    <Route path="rfq/:id" element={<RFQDetails />} />
                    <Route path="user/:id" element={<UserDetails />} />
                </Routes>
            </div>
        </div>
    );
}