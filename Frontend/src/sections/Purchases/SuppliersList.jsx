// sections/SuppliersList.jsx
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import TableComponent from '../../components/layout/TableComponent';
import suppliersData from '../suppliers-data.json';

export default function Suppliers() {
    const navigate = useNavigate();
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate API fetch
        setTimeout(() => {
            // Transform JSON data to table format
            const formattedSuppliers = suppliersData.suppliers.map(supplier => ({
                id: supplier.id,
                name: supplier.name,
                email: supplier.email,
                role: supplier.role,
                lastLogin: supplier.lastLogin,
                status: supplier.status
            }));
            setSuppliers(formattedSuppliers);
            setLoading(false);
        }, 300);
    }, []);

    const handleRowClick = (row) => {
        navigate(`/Purchases/supplier/${row.id}`);
    };

    const handleAddUser = () => {
        navigate('/Purchases/supplier/new-supplier');
    };

    const columns = [
        { key: 'name', label: 'Supplier', type: 'person_name', sortable: true, filterable: true },
        { key: 'email', label: 'Email', type: 'file_name', sortable: true, filterable: true },
        { key: 'role', label: 'Role', type: 'badge', sortable: true, filterable: true },
        { key: 'lastLogin', label: 'Last Login', type: 'time', sortable: true },
        { key: 'status', label: 'Status', type: 'status', sortable: true, filterable: true },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64" style={{ backgroundColor: 'var(--background-secondary)' }}>
                <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-brand-accent border-t-transparent" />
                    <p className="text-sm mt-2" style={{ color: 'var(--text-tertiary)' }}>Loading suppliers...</p>
                </div>
            </div>
        );
    }

    return (
        <TableComponent
            title="Supplier Management"
            subtitle="Manage supplier information"
            data={suppliers}
            columns={columns}
            onClickRow={handleRowClick}
            onAdd={handleAddUser}
            onEdit={(row) => console.log('Edit', row)}
            onDelete={(row) => console.log('Delete', row)}
        />
    );
}