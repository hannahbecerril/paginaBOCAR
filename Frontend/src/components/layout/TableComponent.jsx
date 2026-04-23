// components/layout/TableComponent.jsx
import { useState, useMemo } from 'react';
import {
    Search,
    Plus,
    Filter,
    ArrowUp,
    ArrowDown,
    ChevronsUpDown,
    Pencil,
    Trash2,
    FileText,
    Clock,
    X
} from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';

export default function TableComponent({
    title,
    subtitle,
    data = [],
    columns = [],
    onAdd,
    onEdit,
    onDelete,
}) {
    const [search, setSearch] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({});
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    // 🔍 SEARCH
    const filteredData = useMemo(() => {
        let result = data;

        // Apply search
        if (search) {
            result = result.filter(row =>
                Object.values(row).some(val =>
                    String(val).toLowerCase().includes(search.toLowerCase())
                )
            );
        }

        // Apply filters
        Object.keys(filters).forEach(key => {
            if (filters[key]) {
                result = result.filter(row =>
                    String(row[key]).toLowerCase() === filters[key].toLowerCase()
                );
            }
        });

        return result;
    }, [data, search, filters]);

    // 🔃 SORT
    const sortedData = useMemo(() => {
        if (!sortConfig.key) return filteredData;

        const col = columns.find(c => c.key === sortConfig.key);

        return [...filteredData].sort((a, b) => {
            let aVal = a[sortConfig.key];
            let bVal = b[sortConfig.key];

            if (col?.sortValue) {
                aVal = col.sortValue(a);
                bVal = col.sortValue(b);
            }

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredData, sortConfig, columns]);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleFilter = (key, value) => {
        if (value) {
            setFilters(prev => ({ ...prev, [key]: value }));
        } else {
            const newFilters = { ...filters };
            delete newFilters[key];
            setFilters(newFilters);
        }
    };

    const clearAllFilters = () => {
        setFilters({});
        setSearch('');
    };

    // 🔽 SORT ICON
    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) {
            return <ChevronsUpDown size={12} className="text-gray-300" />;
        }
        return sortConfig.direction === 'asc'
            ? <ArrowUp size={12} className="text-gray-500" />
            : <ArrowDown size={12} className="text-gray-500" />;
    };

    // 🎨 DEFAULT RENDERERS
    const renderCell = (value, type, row) => {
        switch (type) {
            case 'person_name':
                return (
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-900">
                            {value?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{value}</span>
                    </div>
                );

            case 'file_name':
                return (
                    <div className="flex items-center gap-2 text-gray-700">
                        <FileText size={16} className="text-gray-400" />
                        <span className="text-sm">{value}</span>
                    </div>
                );

            case 'id':
                return (
                    <span className="font-mono text-xs text-gray-500 bg-gray-50 px-2 py-1">
                        {value}
                    </span>
                );

            case 'progress':
                return (
                    <div className="flex items-center gap-3">
                        <div className="flex-1 max-w-[100px]">
                            <div className="h-1.5 bg-gray-100 overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 transition-all duration-300"
                                    style={{ width: `${value}%` }}
                                />
                            </div>
                        </div>
                        <span className="text-xs font-medium text-gray-600">{value}%</span>
                    </div>
                );

            case 'time':
                return (
                    <div className="flex items-center gap-2 text-gray-500">
                        <Clock size={14} />
                        <span className="text-sm">{value}</span>
                    </div>
                );

            case 'status':
                const statusColors = {
                    active: 'bg-green-50 text-green-700 border-green-200',
                    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
                    completed: 'bg-blue-50 text-blue-700 border-blue-200',
                    cancelled: 'bg-red-50 text-red-700 border-red-200',
                    inactivo: 'bg-gray-50 text-gray-700 border-gray-200',
                };
                const statusColor = statusColors[value?.toLowerCase()] || 'bg-gray-50 text-gray-700 border-gray-200';
                return (
                    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium border ${statusColor}`}>
                        {value}
                    </span>
                );

            case 'priority':
                const priorityColors = {
                    high: 'bg-red-50 text-red-700 border-red-200',
                    medium: 'bg-orange-50 text-orange-700 border-orange-200',
                    low: 'bg-green-50 text-green-700 border-green-200',
                };
                const priorityColor = priorityColors[value?.toLowerCase()] || 'bg-gray-50 text-gray-700 border-gray-200';
                return (
                    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium border ${priorityColor}`}>
                        {value}
                    </span>
                );

            default:
                return <span className="text-sm text-gray-700">{value}</span>;
        }
    };

    // Get unique filter options for each column
    const getFilterOptions = (columnKey) => {
        const uniqueValues = [...new Set(data.map(item => item[columnKey]))];
        return uniqueValues.filter(v => v != null);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">{title}</h1>
                        {subtitle && (
                            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <Filter size={16} />
                            Filtrar
                            {Object.keys(filters).length > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 bg-blue-500 text-white text-xs">
                                    {Object.keys(filters).length}
                                </span>
                            )}
                        </Button>

                        {onAdd && (
                            <Button onClick={onAdd}>
                                <Plus size={16} />
                                Agregar
                            </Button>
                        )}
                    </div>
                </div>

                {/* SEARCH BAR - Using Input component */}
                <div className="mb-6">
                    <Input
                        variant="search"
                        placeholder="Buscar..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* FILTERS PANEL */}
                {showFilters && (
                    <div className="mb-6 p-4 bg-white border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-medium text-gray-700">Filtros</h3>
                            <button
                                onClick={clearAllFilters}
                                className="text-xs text-gray-500 hover:text-gray-700"
                            >
                                Limpiar todos
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {columns.map(col => {
                                if (!col.filterable) return null;
                                const options = getFilterOptions(col.key);
                                return (
                                    <div key={col.key}>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            {col.label}
                                        </label>
                                        <select
                                            value={filters[col.key] || ''}
                                            onChange={(e) => handleFilter(col.key, e.target.value)}
                                            className="w-full px-3 py-1.5 text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        >
                                            <option value="">Todos</option>
                                            {options.map(opt => (
                                                <option key={opt} value={opt}>
                                                    {opt}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* TABLE */}
                <div className="bg-white border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            {/* HEAD */}
                            <thead className="bg-gray-50">
                                <tr>
                                    {columns.map(col => (
                                        <th
                                            key={col.key}
                                            onClick={() => col.sortable && handleSort(col.key)}
                                            className={`
                                                px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider
                                                text-gray-500
                                                ${col.sortable ? 'cursor-pointer hover:text-gray-700 transition-colors' : ''}
                                            `}
                                        >
                                            <div className="flex items-center gap-1.5">
                                                {col.label}
                                                {col.sortable && <SortIcon columnKey={col.key} />}
                                            </div>
                                        </th>
                                    ))}
                                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>

                            {/* BODY */}
                            <tbody className="divide-y divide-gray-100">
                                {sortedData.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={columns.length + 1}
                                            className="px-6 py-12 text-center text-sm text-gray-400"
                                        >
                                            No hay resultados
                                        </td>
                                    </tr>
                                ) : (
                                    sortedData.map((row, i) => (
                                        <tr key={i} className="hover:bg-gray-50 transition-colors duration-150">
                                            {columns.map(col => (
                                                <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {col.render
                                                        ? col.render(row[col.key], row)
                                                        : renderCell(row[col.key], col.type, row)
                                                    }
                                                </td>
                                            ))}
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {onEdit && (
                                                        <button
                                                            onClick={() => onEdit(row)}
                                                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors hover:bg-blue-50"
                                                            title="Editar"
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                    )}
                                                    {onDelete && (
                                                        <button
                                                            onClick={() => onDelete(row)}
                                                            className="p-2 text-gray-400 hover:text-red-600 transition-colors hover:bg-red-50"
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* FOOTER */}
                {sortedData.length > 0 && (
                    <div className="mt-4 text-center">
                        <p className="text-xs text-gray-400">
                            Mostrando {sortedData.length} de {data.length} registros
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}