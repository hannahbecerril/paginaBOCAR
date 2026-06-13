// sections/Purchases/Drafts.jsx
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import TableComponent from '../../components/layout/TableComponent';
import { getPurchasesDrafts, approveSupplierList } from '../api';

function getStoredUser() {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
}

export default function Drafts() {
    const navigate = useNavigate();
    const [drafts, setDrafts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    const storedUser = getStoredUser();
    const userGroups = storedUser.grupos ?? [];
    const isAdmin = userGroups.some(g => g.includes('_Admin') || g === 'SuperAdmin');

    const reload = () => {
        setLoading(true);
        getPurchasesDrafts().then(rfqs => {
            setDrafts(rfqs.map(rfq => ({
                id: rfq.id,
                title: rfq.title,
                category: rfq.type,
                progress: rfq.stage1?.data?.completionPercentage || 0,
                ready: rfq.submitted_for_review || false,
                last_modified: rfq.lastModified,
            })));
            setLoading(false);
        });
    };

    useEffect(() => { reload(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSendToSuppliers = async (rfqId) => {
        setActionLoading(rfqId);
        try {
            await approveSupplierList(rfqId, 'aprobar');
            reload();
        } catch (err) {
            alert(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDiscardApproval = async (rfqId) => {
        setActionLoading(rfqId);
        try {
            await approveSupplierList(rfqId, 'rechazar');
            reload();
        } catch (err) {
            alert(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const columns = [
        { key: 'id',       label: 'ID',       type: 'id',        sortable: true, filterable: true },
        { key: 'title',    label: 'RFQ',       type: 'file_name', sortable: true, filterable: true },
        { key: 'category', label: 'Category',  type: 'badge',     sortable: true, filterable: true },
        { key: 'progress', label: 'Progress',  type: 'progress',  sortable: true },
        {
            key: 'ready',
            label: 'Submitted for Approval',
            sortable: true,
            filterable: true,
            render: (val) => (
                <span
                    className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium border"
                    style={val
                        ? { color: 'var(--status-active)',  backgroundColor: 'rgba(16,185,129,0.1)', borderColor: 'var(--status-active)' }
                        : { color: 'var(--text-tertiary)', backgroundColor: 'var(--surface-disabled)', borderColor: 'var(--border-default)' }
                    }
                >
                    {val ? 'Yes' : 'No'}
                </span>
            ),
        },
        { key: 'last_modified', label: 'Last Modified', type: 'time', sortable: true, filterable: true },
        ...(isAdmin ? [{
            key: '_admin_actions',
            label: 'Admin Actions',
            render: (_, row) => {
                if (!row.ready) return <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>—</span>;
                const busy = actionLoading === row.id;
                return (
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                        <button
                            disabled={busy}
                            onClick={() => handleSendToSuppliers(row.id)}
                            className="px-2 py-1 text-xs font-medium border transition-opacity"
                            style={{ color: 'var(--status-active)', borderColor: 'var(--status-active)', backgroundColor: 'rgba(16,185,129,0.08)', opacity: busy ? 0.5 : 1 }}
                        >
                            {busy ? '…' : 'Send to Suppliers'}
                        </button>
                        <button
                            disabled={busy}
                            onClick={() => handleDiscardApproval(row.id)}
                            className="px-2 py-1 text-xs font-medium border transition-opacity"
                            style={{ color: 'var(--text-tertiary)', borderColor: 'var(--border-default)', opacity: busy ? 0.5 : 1 }}
                        >
                            Discard
                        </button>
                    </div>
                );
            },
        }] : []),
    ];

    const handleRowClick = (row) => {
        navigate(`/Purchases/rfq/${row.id}`);
    };

    if (loading) {
        return <div className="flex justify-center p-8"><div className="animate-spin w-8 h-8 border-2 border-brand-accent border-t-transparent" /></div>;
    }

    return (
        <TableComponent
            title="Draft Management"
            subtitle="Manage RFQ drafts"
            data={drafts}
            columns={columns}
            onClickRow={handleRowClick}
            onEdit={(row) => console.log('Edit', row)}
            onDelete={(row) => console.log('Delete', row)}
        />
    );
}
