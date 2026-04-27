// src/sections/Industrializacion/index.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import NavBar from '../../components/layout/NavBar';
import RFQForm from './RFQForm';
import Usuarios from './Usuarios';

export default function IndustrializacionDashboard() {
    const tabs = [
        { label: 'RFQ Form', path: 'rfqform' },
        { label: 'Users', path: 'usuarios' },
    ];

    return (
        <div style={{ backgroundColor: 'var(--background-secondary)' }}>
            <NavBar
                module="Industrialization"
                basePath="/industrializacion"
                tabs={tabs}
                user={{ name: "Maria Garcia" }}
            />

            <div className="p-6">
                <Routes>
                    <Route index element={<Navigate to="rfqform" replace />} />
                    <Route path="rfqform" element={<RFQForm />} />
                    <Route path="usuarios" element={<Usuarios />} />
                </Routes>
            </div>
        </div>
    );
}