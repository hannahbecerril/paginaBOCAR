// sections/Industrialization/PendingReview.jsx
// Bandeja de "Pendientes de Revisión" exclusiva del Industrialization_Admin.
// Muestra los RFQs en IND_DRAFT con submitted_for_review=True que el ingeniero
// ya envió al admin para firma/aprobación, y el admin aún no ha procesado.
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import TableComponent from '../../components/layout/TableComponent';
import { getIndustrializationPendingReview, approveRFQInd } from '../api';

function getStoredUser() {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
}

export default function PendingReview() {
    const navigate = useNavigate();
    const [rfqs, setRfqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    const storedUser = getStoredUser();
    const userGroups = storedUser.grupos ?? [];
    const isAdmin = userGroups.some(g => g.includes('_Admin') || g === 'SuperAdmin');

    const reload = () => {
        setLoading(true);
        getIndustrializationPendingReview()
            .then(data => {
                setRfqs(data.map(rfq => ({
                    id: rfq.id,
                    title: rfq.title,
                    category: rfq.type,
                    progress: rfq.stage1?.data?.completionPercentage || 0,
                    created_by: rfq.createdBy || '—',
                    last_modified: rfq.lastModified,
                })));
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => { reload(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSendToPurchases = async (rfqId) => {
        setActionLoading(rfqId);
        try {
            await approveRFQInd(rfqId, true);   // true = approve → SENT_TO_PURCHASES
            reload();
        } catch (err) {
            alert(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleReturnToDraft = async (rfqId) => {
        setActionLoading(rfqId);
        try {
            await approveRFQInd(rfqId, false);  // false = reject → regresa a IND_DRAFT editable
            reload();
        } catch (err) {
            alert(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const columns = [
        { key: 'id',           label: 'ID',           type: 'id',        sortable: true,  filterable: true },
        { key: 'title',        label: 'RFQ',          type: 'file_name', sortable: true,  filterable: true },
        { key: 'category',     label: 'Category',     type: 'badge',     sortable: true,  filterable: true },
        { key: 'progress',     label: 'Completeness', type: 'progress',  sortable: true },
        { key: 'created_by',   label: 'Engineer',     type: 'text',      sortable: true,  filterable: true },
        { key: 'last_modified',label: 'Submitted',    type: 'time',      sortable: true,  filterable: true },
        ...(isAdmin ? [{
            key: '_admin_actions',
            label: 'Admin Decision',
            render: (_, row) => {
                const busy = actionLoading === row.id;
                return (
                    <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                        {/* Approve: envía a Compras */}
                        <button
                            disabled={busy}
                            onClick={() => handleSendToPurchases(row.id)}
                            className="px-3 py-1 text-xs font-semibold border transition-all duration-150"
                            style={{
                                color: 'var(--status-active)',
                                borderColor: 'var(--status-active)',
                                backgroundColor: 'rgba(16,185,129,0.08)',
                                opacity: busy ? 0.5 : 1,
                                cursor: busy ? 'not-allowed' : 'pointer',
                            }}
                        >
                            {busy ? '…' : 'Approve'}
                        </button>
                        {/* Return: regresa al ingeniero */}
                        <button
                            disabled={busy}
                            onClick={() => handleReturnToDraft(row.id)}
                            className="px-3 py-1 text-xs font-semibold border transition-all duration-150"
                            style={{
                                color: 'var(--status-warning, #f59e0b)',
                                borderColor: 'var(--status-warning, #f59e0b)',
                                backgroundColor: 'rgba(245,158,11,0.08)',
                                opacity: busy ? 0.5 : 1,
                                cursor: busy ? 'not-allowed' : 'pointer',
                            }}
                        >
                            {busy ? '…' : 'Return'}
                        </button>
                    </div>
                );
            },
        }] : []),
    ];

    const handleRowClick = (row) => {
        navigate(`/Industrialization/rfq/${row.id}`);
    };

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <div className="animate-spin w-8 h-8 border-2 border-brand-accent border-t-transparent" />
            </div>
        );
    }

    return (
        <TableComponent
            title="Pending Review"
            subtitle="RFQs submitted by engineers awaiting your approval"
            data={rfqs}
            columns={columns}
            onClickRow={handleRowClick}
            emptyMessage="No RFQs pending review at this time."
        />
    );
}
