// src/sections/Compras/index.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import NavBar from '../../components/layout/NavBar';
import ListaProveedores from './ListaProveedores';
import Usuarios from './Usuarios';

export default function ComprasDashboard() {
    const tabs = [
        { label: 'Lista Proveedores', path: 'proveedores' },
        { label: 'Usuarios', path: 'usuarios' },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <NavBar
                module="Compras"
                basePath="/compras"
                tabs={tabs}
                user={{ name: "Maria Garcia" }}
            />

            <div className="p-6">
                <Routes>
                    {/* Default redirect - using relative path */}
                    <Route index element={<Navigate to="proveedores" replace />} />

                    <Route path="proveedores" element={<ListaProveedores />} />
                    <Route path="usuarios" element={<Usuarios />} />
                </Routes>
            </div>
        </div>
    );
}