// sections/Compras/ListaProveedores.jsx
import TableComponent from '../../components/layout/TableComponent';

export default function SuppliersList() {
    const suppliers = [
        {
            id: 1,
            name: 'Supplier A',
            email: 'supplierA@company.com',
            category: 'Plastics',
            purchases: 120,
            status: 'active'
        },
        {
            id: 2,
            name: 'Supplier B',
            email: 'supplierB@company.com',
            category: 'Electronics',
            purchases: 85,
            status: 'active'
        },
        {
            id: 3,
            name: 'Supplier C',
            email: 'supplierC@company.com',
            category: 'Plastics',
            purchases: 0,
            status: 'inactive'
        },
        {
            id: 4,
            name: 'Supplier D',
            email: 'supplierD@company.com',
            category: 'Metals',
            purchases: 150,
            status: 'active'
        },
    ];

    const columns = [
        { key: 'name', label: 'Name', type: 'person_name', sortable: true, filterable: true },
        { key: 'email', label: 'Email', type: 'file_name', sortable: true, filterable: true },
        { key: 'category', label: 'Category', type: 'badge', sortable: true, filterable: true },
        { key: 'purchases', label: 'Purchases', sortable: true, filterable: true },
        { key: 'status', label: 'Status', type: 'status', sortable: true, filterable: true },
    ];

    return (
        <TableComponent
            title="Supplier Management"
            subtitle="Manage system suppliers"
            data={suppliers}
            columns={columns}
            onAdd={() => alert('Add supplier')}
            onEdit={(row) => console.log('Edit', row)}
            onDelete={(row) => console.log('Delete', row)}
        />
    );
}