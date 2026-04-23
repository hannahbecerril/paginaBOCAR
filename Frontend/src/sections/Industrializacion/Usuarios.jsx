// sections/Usuarios.jsx
import TableComponent from '../../components/layout/TableComponent';

export default function Usuarios() {
    const usuarios = [
        {
            id: 1,
            usuario: 'Maria Garcia',
            correo: 'maria@empresa.com',
            rol: 'Usuario',
            ultimoAcceso: 'Hoy, 10:30',
            estatus: 'active'
        },
        {
            id: 2,
            usuario: 'Carlos Lopez',
            correo: 'carlos@empresa.com',
            rol: 'Usuario',
            ultimoAcceso: 'Ayer, 15:45',
            estatus: 'active'
        },
        {
            id: 3,
            usuario: 'Ana Torres',
            correo: 'ana@empresa.com',
            rol: 'Usuario',
            ultimoAcceso: 'Mar 10, 2025',
            estatus: 'inactive' // Changed from 'inactivo'
        },
        {
            id: 4,
            usuario: 'Mario Garcia',
            correo: 'mario@empresa.com',
            rol: 'Usuario',
            ultimoAcceso: 'Hoy, 14:30',
            estatus: 'active'
        },
    ];

    const columns = [
        { key: 'usuario', label: 'Usuario', type: 'person_name', sortable: true, filterable: true },
        { key: 'correo', label: 'Correo', type: 'file_name', sortable: true, filterable: true },
        { key: 'rol', label: 'Rol', type: 'badge', sortable: true, filterable: true },
        { key: 'ultimoAcceso', label: 'Último acceso', type: 'time', sortable: true },
        { key: 'estatus', label: 'Estatus', type: 'status', sortable: true, filterable: true },
    ];

    return (
        <TableComponent
            title="Gestión de Usuarios"
            subtitle="Administra usuarios del sistema"
            data={usuarios}
            columns={columns}
            onAdd={() => alert('Agregar usuario')}
            onEdit={(row) => console.log('Edit', row)}
            onDelete={(row) => console.log('Delete', row)}
        />
    );
}