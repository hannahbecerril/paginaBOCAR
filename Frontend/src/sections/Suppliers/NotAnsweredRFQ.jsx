// sections/Suppliers/NotAnsweredRFQ.jsx
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import TableComponent from '../../components/layout/TableComponent';
import { getSuppliersInbox } from '../api';

export default function NotAnsweredRFQ() {
    const navigate = useNavigate();
    const [rfqList, setRfqList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getSuppliersInbox().then(rfqs => {
            setRfqList(rfqs.map(rfq => ({
                id: rfq.id,
                title: rfq.title,
                category: rfq.type,
                last_modified: rfq.lastModified
            })));
            setLoading(false);
        });
    }, []);

    const columns = [
        { key: 'id', label: 'ID', type: 'id', sortable: true, filterable: true },
        { key: 'title', label: 'RFQ', type: 'file_name', sortable: true, filterable: true },
        { key: 'category', label: 'Category', type: 'badge', sortable: true, filterable: true },
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
            title="Not Answered RFQ Management"
            subtitle="Manage all RFQs that have been sent to suppliers but not yet answered"
            data={rfqList}
            columns={columns}
            onClickRow={handleRowClick}
            onEdit={(row) => console.log('Edit', row)}
            onDelete={(row) => console.log('Delete', row)}
        />
    );
}
