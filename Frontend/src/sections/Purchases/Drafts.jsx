// sections/Drafts.jsx
import { useNavigate } from 'react-router-dom';
import TableComponent from '../../components/layout/TableComponent';

export default function Drafts() {
    const navigate = useNavigate();

    const Drafts = [
        {
            id: 'SOL-001',
            title: 'Cotizacion SOL-001',
            category: 'Metal',
            progress: 90,
            last_modified: 'Today, 2:30 PM',
        },
        {
            id: 'SOL-002',
            title: 'Cotizacion SOL-002',
            category: 'Plastic',
            progress: 48,
            last_modified: 'Today, 2:30 PM',
        },
        {
            id: 'SOL-003',
            title: 'Cotizacion SOL-003',
            category: 'Metal',
            progress: 75,
            last_modified: 'Today, 2:30 PM',
        },
        {
            id: 'SOL-004',
            title: 'Cotizacion SOL-004',
            category: 'Plastic',
            progress: 29,
            last_modified: 'Today, 2:30 PM',
        },
    ];

    const columns = [
        { key: 'id', label: 'ID', type: 'id', sortable: true, filterable: true },
        { key: 'title', label: 'RFQ', type: 'file_name', sortable: true, filterable: true },
        { key: 'category', label: 'Category', type: 'badge', sortable: true, filterable: true },
        { key: 'progress', label: 'Progress', type: 'progress', sortable: true },
        { key: 'last_modified', label: 'Last Time Modified', type: 'time', sortable: true, filterable: true },
    ];

    const handleRowClick = (row) => {
        navigate(`/Purchases/rfq/${row.id}`);
    };

    return (
        <TableComponent
            title="Draft Management"
            subtitle="Manage system Drafts"
            data={Drafts}
            columns={columns}
            onClickRow={handleRowClick}
            onAdd={() => alert('Create RFQ')}
            onEdit={(row) => console.log('Edit', row)}
            onDelete={(row) => console.log('Delete', row)}
        />
    );
}