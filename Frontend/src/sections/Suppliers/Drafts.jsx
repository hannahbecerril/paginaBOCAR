// sections/Suppliers/Drafts.jsx
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import TableComponent from '../../components/layout/TableComponent';
import { getSuppliersDrafts } from '../api';

export default function Drafts() {
    const navigate = useNavigate();
    const [drafts, setDrafts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getSuppliersDrafts().then(rfqs => {
            setDrafts(rfqs.map(rfq => ({
                id: rfq.id,
                title: rfq.title,
                category: rfq.type,
                progress: rfq.stage1?.data?.completionPercentage || 0,
                last_modified: rfq.lastModified
            })));
            setLoading(false);
        });
    }, []);

    const columns = [
        { key: 'id', label: 'ID', type: 'id', sortable: true, filterable: true },
        { key: 'title', label: 'RFQ', type: 'file_name', sortable: true, filterable: true },
        { key: 'category', label: 'Category', type: 'badge', sortable: true, filterable: true },
        { key: 'progress', label: 'Progress', type: 'progress', sortable: true },
        { key: 'last_modified', label: 'Last Modified', type: 'time', sortable: true, filterable: true },
    ];

    const handleRowClick = (row) => {
        navigate(`/Suppliers/rfq/${row.id}`);
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
