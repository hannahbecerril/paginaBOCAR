// src/sections/Compras/index.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import NavBar from '../../components/layout/NavBar';
import ListaProveedores from './ListaProveedores';
import Usuarios from './Usuarios';

export default function ComprasDashboard() {
    const tabs = [
        { label: 'Suppliers List', path: 'proveedores' },
        { label: 'Users', path: 'usuarios' },
    ];

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--background-secondary)' }}>
            <NavBar
                module="Procurement"
                basePath="/compras"
                tabs={tabs}
                user={{ name: "Maria Garcia" }}
            />

            <div className="p-6">
                <Routes>
                    <Route index element={<Navigate to="proveedores" replace />} />
                    <Route path="proveedores" element={<ListaProveedores />} />
                    <Route path="usuarios" element={<Usuarios />} />
                </Routes>
            </div>
        </div>
    );
}