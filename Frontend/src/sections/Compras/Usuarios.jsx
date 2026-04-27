// sections/Usuarios.jsx
import TableComponent from '../../components/layout/TableComponent';

export default function Users() {
    const users = [
        {
            id: 1,
            name: 'Maria Garcia',
            email: 'maria@company.com',
            role: 'User',
            lastAccess: 'Today, 10:30 AM',
            status: 'active'
        },
        {
            id: 2,
            name: 'Carlos Lopez',
            email: 'carlos@company.com',
            role: 'User',
            lastAccess: 'Yesterday, 3:45 PM',
            status: 'active'
        },
        {
            id: 3,
            name: 'Ana Torres',
            email: 'ana@company.com',
            role: 'User',
            lastAccess: 'Mar 10, 2025',
            status: 'inactive'
        },
        {
            id: 4,
            name: 'Mario Garcia',
            email: 'mario@company.com',
            role: 'User',
            lastAccess: 'Today, 2:30 PM',
            status: 'active'
        },
    ];

    const columns = [
        { key: 'name', label: 'User', type: 'person_name', sortable: true, filterable: true },
        { key: 'email', label: 'Email', type: 'file_name', sortable: true, filterable: true },
        { key: 'role', label: 'Role', type: 'badge', sortable: true, filterable: true },
        { key: 'lastAccess', label: 'Last Access', type: 'time', sortable: true },
        { key: 'status', label: 'Status', type: 'status', sortable: true, filterable: true },
    ];

    return (
        <TableComponent
            title="User Management"
            subtitle="Manage system users"
            data={users}
            columns={columns}
            onAdd={() => alert('Add user')}
            onEdit={(row) => console.log('Edit', row)}
            onDelete={(row) => console.log('Delete', row)}
        />
    );
}