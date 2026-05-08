// src/sections/Industrialization/index.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import NavBar from '../../components/layout/NavBar';
import RFQForm from './RFQForm';
import Users from './Users';
import Drafts from './Drafts';
import RFQList from './RFQList';

import RFQDetails from '../../components/layout/RFQDetails';
import UserDetails from '../../components/layout/UserDetails';

export default function IndustrializationDashboard() {
    const tabs = [
        { label: 'RFQ Form', path: 'RFQ-Form' },
        { label: 'Users', path: 'Users' },
        { label: 'Drafts', path: 'Drafts' },
        { label: 'RFQ List', path: 'RFQ-List' },
    ];

    return (
        <div style={{ backgroundColor: 'var(--background-secondary)' }}>
            <NavBar
                module="Industrialization"
                basePath="/Industrialization"
                tabs={tabs}
                user={{ name: "Maria Garcia" }}
            />

            <div className="p-6">
                <Routes>
                    <Route index element={<Navigate to="RFQ-Form" replace />} />
                    <Route path="RFQ-Form" element={<RFQForm />} />
                    <Route path="Users" element={<Users />} />
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