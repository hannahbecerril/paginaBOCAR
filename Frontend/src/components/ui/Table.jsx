import React, { useState, useMemo } from 'react';
import Button from './button';

const Table = ({
    columns,
    data,
    searchable = true,
    filterable = true,
    onRowClick,
    actions,
    emptyMessage = 'No hay datos disponibles',
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({});
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Handle sorting
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Handle filter change
    const handleFilterChange = (column, value) => {
        setFilters(prev => ({
            ...prev,
            [column]: value
        }));
        setCurrentPage(1);
    };

    // Get unique values for filter options
    const getFilterOptions = (column) => {
        if (!column.filterable) return [];
        const values = data.map(item => item[column.key]);
        return [...new Set(values)].filter(Boolean).sort();
    };

    // Filter and sort data
    const processedData = useMemo(() => {
        let filtered = [...data];

        // Apply search
        if (searchTerm) {
            filtered = filtered.filter(item =>
                Object.values(item).some(value =>
                    String(value).toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
        }

        // Apply filters
        Object.entries(filters).forEach(([key, value]) => {
            if (value) {
                filtered = filtered.filter(item =>
                    String(item[key]).toLowerCase() === value.toLowerCase()
                );
            }
        });

        // Apply sorting
        if (sortConfig.key) {
            filtered.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return filtered;
    }, [data, searchTerm, filters, sortConfig]);

    // Pagination
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return processedData.slice(start, start + itemsPerPage);
    }, [processedData, currentPage]);

    const totalPages = Math.ceil(processedData.length / itemsPerPage);

    // Sort indicator
    const getSortIndicator = (key) => {
        if (sortConfig.key !== key) return '↕️';
        return sortConfig.direction === 'asc' ? '↑' : '↓';
    };

    return (
        <div className="w-full">
            {/* Search and Filters Bar */}
            {(searchable || filterable) && (
                <div className="mb-4 space-y-3">
                    {searchable && (
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Buscar..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <svg
                                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        </div>
                    )}

                    {filterable && (
                        <div className="flex flex-wrap gap-2">
                            {columns.filter(col => col.filterable).map(column => (
                                <select
                                    key={column.key}
                                    value={filters[column.key] || ''}
                                    onChange={(e) => handleFilterChange(column.key, e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Todos {column.label}</option>
                                    {getFilterOptions(column).map(option => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            ))}
                            {(Object.keys(filters).length > 0 || searchTerm) && (
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                        setSearchTerm('');
                                        setFilters({});
                                        setCurrentPage(1);
                                    }}
                                >
                                    Limpiar filtros
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-[#f9fafb]">
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    onClick={() => column.sortable && handleSort(column.key)}
                                    className={`px-6 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider ${column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                                        }`}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>{column.label}</span>
                                        {column.sortable && (
                                            <span className="text-gray-400">
                                                {getSortIndicator(column.key)}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}
                            {actions && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acciones
                            </th>}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedData.length > 0 ? (
                            paginatedData.map((row, index) => (
                                <tr
                                    key={index}
                                    onClick={() => onRowClick && onRowClick(row)}
                                    className={onRowClick ? 'cursor-pointer hover:bg-[#f9fafb]' : 'hover:bg-[#f9fafb]'}
                                >
                                    {columns.map((column) => (
                                        <td
                                            key={column.key}
                                            className="px-5 py-3 whitespace-nowrap text-sm text-gray-900"
                                        >
                                            {column.render ? column.render(row[column.key], row) : row[column.key]}
                                        </td>
                                    ))}
                                    {actions && (
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {actions(row)}
                                        </td>
                                    )}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={columns.length + (actions ? 1 : 0)}
                                    className="px-6 py-8 text-center text-sm text-gray-500"
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-700">
                        Mostrando {((currentPage - 1) * itemsPerPage) + 1} a{' '}
                        {Math.min(currentPage * itemsPerPage, processedData.length)} de{' '}
                        {processedData.length} resultados
                    </div>
                    <div className="flex space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            Anterior
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            Siguiente
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Table;