// sections/Compras/ListaProveedores.jsx
import TableComponent from '../../components/layout/TableComponent';

export default function ListaProveedores() {
    const proveedores = [
        {
            id: 1,
            nombre: 'Proveedor A',
            correo: 'proveedorA@empresa.com',
            categoria: 'Plasticos',
            compras: 120,
            estatus: 'active' // Changed from 'activo' to match statusColors
        },
        {
            id: 2,
            nombre: 'Proveedor B',
            correo: 'proveedorB@empresa.com',
            categoria: 'Electrónicos',
            compras: 85,
            estatus: 'active'
        },
        {
            id: 3,
            nombre: 'Proveedor C',
            correo: 'proveedorC@empresa.com',
            categoria: 'Plasticos',
            compras: 0,
            estatus: 'inactive' // Changed from 'inactivo' to match statusColors
        },
        {
            id: 4,
            nombre: 'Proveedor D',
            correo: 'proveedorD@empresa.com',
            categoria: 'Metalicos',
            compras: 150,
            estatus: 'active'
        },
    ];

    const columns = [
        { key: 'nombre', label: 'Nombre', type: 'person_name', sortable: true, filterable: true },
        { key: 'correo', label: 'Correo', type: 'file_name', sortable: true, filterable: true },
        { key: 'categoria', label: 'Categoría', type: 'badge', sortable: true, filterable: true },
        { key: 'compras', label: 'Compras', sortable: true, filterable: true },
        { key: 'estatus', label: 'Estatus', type: 'status', sortable: true, filterable: true },
    ];

    return (
        <TableComponent
            title="Gestión de Proveedores"
            subtitle="Administra proveedores del sistema"
            data={proveedores}
            columns={columns}
            onAdd={() => alert('Agregar proveedor')}
            onEdit={(row) => console.log('Edit', row)}
            onDelete={(row) => console.log('Delete', row)}
        />
    );
}