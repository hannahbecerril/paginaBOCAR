// sections/RFQList.jsx
import { useNavigate } from 'react-router-dom';
import TableComponent from '../../components/layout/TableComponent';

export default function RFQList() {
    const navigate = useNavigate();

    const RFQList_data = [
        {
            id: "SOL-001",
            title: 'Cotizacion SOL-001',
            category: 'Metal',
            priority: 'High',
            status: 'Sent to Purchases',
            offers: 3,
            last_modified: 'April 4',
        },
        {
            id: "SOL-002",
            title: 'Cotizacion SOL-002',
            category: 'Plastic',
            priority: 'Medium',
            status: 'Supplier Selected',
            offers: 5,
            last_modified: 'Today',
        },
        {
            id: "SOL-003",
            title: 'Cotizacion SOL-003',
            category: 'Plastic',
            priority: 'Medium',
            status: 'Sent to Suppliers',
            offers: 1,
            last_modified: 'Yesterday',
        },
        {
            id: "SOL-004",
            title: 'Cotizacion SOL-004',
            category: 'Metal',
            priority: 'Low',
            status: 'Waiting for Suppliers',
            offers: 0,
            last_modified: 'March 30',
        },
        {
            id: "SOL-005",
            title: 'Cotizacion SOL-005',
            category: 'Plastic',
            priority: 'Medium',
            status: 'Supplier Selected',
            offers: 4,
            last_modified: 'March 28',
        },
        {
            id: "SOL-006",
            title: 'Cotizacion SOL-006',
            category: 'Plastic',
            priority: 'Medium',
            status: 'RFQ Closed',
            offers: 2,
            last_modified: 'Today',
        },
    ];

    const columns = [
        { key: 'id', label: 'ID', type: 'id', sortable: true, filterable: true },
        { key: 'title', label: 'RFQ', type: 'file_name', sortable: true, filterable: true },
        { key: 'category', label: 'Category', type: 'badge', sortable: true, filterable: true },
        { key: 'priority', label: 'Priority', type: 'priority', sortable: true, filterable: true },
        { key: 'status', label: 'Status', type: 'rfq-status', sortable: true, filterable: true },
        { key: 'offers', label: 'Offers', type: 'number', sortable: true, filterable: true },
        { key: 'last_modified', label: 'Last Time Modified', type: 'time', sortable: true, filterable: true },
    ];

    const handleRowClick = (row) => {
        navigate(`/Purchases/rfq/${row.id}`);
    };

    return (
        <TableComponent
            title="RFQ Management"
            subtitle="Manage RFQs"
            data={RFQList_data}
            columns={columns}
            onClickRow={handleRowClick}
            onAdd={() => alert('Add RFQ')}
            onEdit={(row) => console.log('Edit', row)}
            onDelete={(row) => console.log('Delete', row)}
        />
    );
}