// src/sections/Suppliers/index.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import NavBar from '../../components/layout/NavBar';
import AllRFQ from './AllRFQ';
import NotAnsweredRFQ from './NotAnsweredRFQ';
import Drafts from './Drafts';
import RFQDetails from '../../components/layout/RFQDetails';
import Calendar from '../../components/layout/Calendar';
import Chatbot from '../../components/layout/Chatbot';

function getStoredUser() {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
}

export default function SuppliersDashboard() {
    const storedUser = getStoredUser();
    const displayName = storedUser.first_name
        ? `${storedUser.first_name} ${storedUser.last_name ?? ''}`.trim()
        : storedUser.username ?? 'Supplier';

    const tabs = [
        { label: 'All RFQs',          path: 'All-RFQ' },
        { label: 'Not Answered RFQs', path: 'Not-Answered-RFQ' },
        { label: 'Drafts',            path: 'Drafts' },
        { label: 'Calendar',          path: 'Calendar' },
        { label: 'Assistant',         path: 'Chatbot' },
    ];

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--background-secondary)' }}>
            <NavBar
                module="Suppliers"
                basePath="/Suppliers"
                tabs={tabs}
                user={{ name: displayName }}
            />

            <div className="p-6">
                <Routes>
                    <Route index element={<Navigate to="Drafts" replace />} />
                    <Route path="All-RFQ"           element={<AllRFQ />} />
                    <Route path="Not-Answered-RFQ"  element={<NotAnsweredRFQ />} />
                    <Route path="Drafts"            element={<Drafts />} />
                    <Route path="Calendar"          element={<Calendar userRole="suppliers" />} />
                    <Route path="Chatbot"           element={<Chatbot  userRole="suppliers" />} />
                    <Route path="rfq/:id"           element={<RFQDetails />} />
                </Routes>
            </div>
        </div>
    );
}
