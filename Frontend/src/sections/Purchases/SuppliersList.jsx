// sections/SuppliersList.jsx
import { useNavigate } from 'react-router-dom';
import TableComponent from '../../components/layout/TableComponent';

export default function Users() {
    const navigate = useNavigate();

    const suppliers = [
        {
            id: 'plastic-solutions',
            name: 'Plastic Solutions S.A.',
            email: 'maria@company.com',
            role: 'Supplier',
            lastAccess: 'Today, 10:30 AM',
            status: 'active'
        },
        {
            id: 'metalworks',
            name: 'MetalWorks Ltd.',
            email: 'carlos@company.com',
            role: 'Supplier',
            lastAccess: 'Yesterday, 3:45 PM',
            status: 'active'
        },
        {
            id: 'eco-packaging',
            name: 'Eco Packaging Inc.',
            email: 'ana@company.com',
            role: 'Supplier',
            lastAccess: 'Mar 10, 2025',
            status: 'inactive'
        },
        {
            id: 'industrial-components',
            name: 'Industrial Components Co.',
            email: 'mario@company.com',
            role: 'Supplier',
            lastAccess: 'Today, 2:30 PM',
            status: 'active'
        },
    ];

    const columns = [
        { key: 'name', label: 'Supplier', type: 'person_name', sortable: true, filterable: true },
        { key: 'email', label: 'Email', type: 'file_name', sortable: true, filterable: true },
        { key: 'role', label: 'Role', type: 'badge', sortable: true, filterable: true },
        { key: 'lastAccess', label: 'Last Access', type: 'time', sortable: true },
        { key: 'status', label: 'Status', type: 'status', sortable: true, filterable: true },
    ];

    const handleRowClick = (row) => {
        navigate(`/Purchases/supplier/${row.id}`);
    };

    return (
        <TableComponent
            title="Supplier Management"
            subtitle="Manage supplier information"
            data={suppliers}
            columns={columns}
            onClickRow={handleRowClick}
            onAdd={() => alert('Add supplier')}
            onEdit={(row) => console.log('Edit', row)}
            onDelete={(row) => console.log('Delete', row)}
        />
    );
}