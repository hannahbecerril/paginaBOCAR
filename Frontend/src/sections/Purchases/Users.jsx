// sections/Purchases/Users.jsx
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import TableComponent from '../../components/layout/TableComponent';
import { getUsers } from '../api';

const PURCHASES_ROLES = ['Purchases', 'Purchases_Admin'];

export default function Users() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getUsers().then(data => {
            const filtered = data.filter(u => PURCHASES_ROLES.includes(u.role));
            setUsers(filtered.map(user => ({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                lastAccess: user.lastLogin,
                status: user.status
            })));
            setLoading(false);
        });
    }, []);

    const handleRowClick = (row) => {
        navigate(`/Purchases/user/${row.id}`);
    };

    const columns = [
        { key: 'name',       label: 'User',        type: 'person_name', sortable: true, filterable: true },
        { key: 'email',      label: 'Email',        type: 'file_name',   sortable: true, filterable: true },
        { key: 'role',       label: 'Role',         type: 'badge',       sortable: true, filterable: true },
        { key: 'lastAccess', label: 'Last Access',  type: 'time',        sortable: true },
        { key: 'status',     label: 'Status',       type: 'status',      sortable: true, filterable: true },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64" style={{ backgroundColor: 'var(--background-secondary)' }}>
                <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-brand-accent border-t-transparent" />
                    <p className="text-sm mt-2" style={{ color: 'var(--text-tertiary)' }}>Loading users...</p>
                </div>
            </div>
        );
    }

    return (
        <TableComponent
            title="User Management"
            subtitle="Purchases team members"
            data={users}
            columns={columns}
            onClickRow={handleRowClick}
            onAdd={() => navigate('/Purchases/user/new-user')}
            onEdit={(row) => console.log('Edit', row)}
            onDelete={(row) => console.log('Delete', row)}
        />
    );
}
