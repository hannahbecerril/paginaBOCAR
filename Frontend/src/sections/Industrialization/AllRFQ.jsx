// sections/Industrialization/AllRFQ.jsx
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import TableComponent from '../../components/layout/TableComponent';
import { getIndustrializationAllRFQs } from '../api';

export default function AllRFQ() {
    const navigate = useNavigate();
    const [rfqList, setRfqList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getIndustrializationAllRFQs().then(rfqs => {
            setRfqList(rfqs.map(rfq => ({
                id: rfq.id,
                title: rfq.title,
                category: rfq.category,
                priority: rfq.priority,
                status: rfq.status,
                offers: rfq.stage3?.data?.responses?.length || 0,
                last_modified: rfq.lastModified
            })));
            setLoading(false);
        });
    }, []);

    const columns = [
        { key: 'id', label: 'ID', type: 'id', sortable: true, filterable: true },
        { key: 'title', label: 'RFQ', type: 'file_name', sortable: true, filterable: true },
        { key: 'category', label: 'Category', type: 'badge', sortable: true, filterable: true },
        { key: 'priority', label: 'Priority', type: 'priority', sortable: true, filterable: true },
        { key: 'status', label: 'Status', type: 'rfq-status', sortable: true, filterable: true },
        { key: 'offers', label: 'Offers', type: 'number', sortable: true, filterable: true },
        { key: 'last_modified', label: 'Last Modified', type: 'time', sortable: true, filterable: true },
    ];

    const handleRowClick = (row) => {
        navigate(`/Industrialization/rfq/${row.id}`);
    };

    if (loading) {
        return <div className="flex justify-center p-8"><div className="animate-spin w-8 h-8 border-2 border-brand-accent border-t-transparent" /></div>;
    }

    return (
        <TableComponent
            title="RFQ Management"
            subtitle="Manage all RFQs"
            data={rfqList}
            columns={columns}
            onClickRow={handleRowClick}
            onAdd={() => navigate('/Industrialization/Create-RFQ')}
            onEdit={(row) => console.log('Edit', row)}
            onDelete={(row) => console.log('Delete', row)}
        />
    );
}
