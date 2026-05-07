// src/sections/Purchases/index.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import NavBar from '../../components/layout/NavBar';
import SuppliersList from './SuppliersList';
import Users from './Users';
import Drafts from './Drafts';
import RFQList from './RFQList';

export default function PurchasesDashboard() {
    const tabs = [
        { label: 'Suppliers List', path: 'Suppliers' },
        { label: 'Users', path: 'Users' },
        { label: 'Drafts', path: 'Drafts' },
        { label: 'RFQ List', path: 'RFQ-List' },
    ];

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--background-secondary)' }}>
            <NavBar
                module="Purchases"
                basePath="/Purchases"
                tabs={tabs}
                user={{ name: "Maria Garcia" }}
            />

            <div className="p-6">
                <Routes>
                    <Route index element={<Navigate to="Suppliers" replace />} />
                    <Route path="Suppliers" element={<SuppliersList />} />
                    <Route path="Users" element={<Users />} />
                    <Route path="Drafts" element={<Drafts />} />
                    <Route path="RFQ-List" element={<RFQList />} />
                </Routes>
            </div>
        </div>
    );
}