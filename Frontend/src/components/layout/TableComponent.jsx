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
import { STATUS_LABEL } from '../../constants/rfqStatus';

export default function TableComponent({
    title,
    subtitle,
    data = [],
    columns = [],
    onAdd,
    onEdit,
    onDelete,
    onClickRow
}) {
    const [search, setSearch] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({});
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    // SEARCH
    const filteredData = useMemo(() => {
        let result = data;

        if (search) {
            result = result.filter(row =>
                Object.values(row).some(val =>
                    String(val).toLowerCase().includes(search.toLowerCase())
                )
            );
        }

        Object.keys(filters).forEach(key => {
            if (filters[key]) {
                result = result.filter(row =>
                    String(row[key]).toLowerCase() === filters[key].toLowerCase()
                );
            }
        });

        return result;
    }, [data, search, filters]);

    // SORT
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

    // SORT ICON
    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) {
            return <ChevronsUpDown size={12} style={{ color: 'var(--text-tertiary)' }} />;
        }
        return sortConfig.direction === 'asc'
            ? <ArrowUp size={12} style={{ color: 'var(--text-secondary)' }} />
            : <ArrowDown size={12} style={{ color: 'var(--text-secondary)' }} />;
    };

    // Helper function to get consistent badge styling
    const getBadgeStyles = (value, colorMap) => {
        const lowerValue = String(value).toLowerCase();
        const colorClass = colorMap[lowerValue];

        if (colorClass) {
            return colorClass;
        }

        // Default fallback
        return 'bg-surface-hover text-text-secondary border-border-default';
    };

    // DEFAULT RENDERERS
    const renderCell = (value, type, row) => {
        switch (type) {
            case 'person_name':
                return (
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-surface-hover flex items-center justify-center text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {value?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{value}</span>
                    </div>
                );

            case 'file_name':
                return (
                    <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                        <FileText size={16} style={{ color: 'var(--text-tertiary)' }} />
                        <span className="text-sm">{value}</span>
                    </div>
                );

            case 'id':
                return (
                    <span className="font-mono text-xs px-2 py-1" style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--surface-hover)' }}>
                        {value}
                    </span>
                );

            case 'progress':
                return (
                    <div className="flex items-center gap-3">
                        <div className="flex-1 max-w-[100px]">
                            <div className="h-1.5 bg-border-default overflow-hidden">
                                <div
                                    className="h-full transition-all duration-300"
                                    style={{ width: `${value}%`, backgroundColor: 'var(--brand-accent)' }}
                                />
                            </div>
                        </div>
                        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{value}%</span>
                    </div>
                );

            case 'time':
                return (
                    <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                        <Clock size={14} />
                        <span className="text-sm">{value}</span>
                    </div>
                );

            case 'badge':
                return (
                    <span className="inline-flex w-20 justify-center px-2.5 py-0.5 text-xs font-medium border" style={{
                        color: 'var(--text-secondary)',
                        backgroundColor: 'var(--surface-hover)',
                        borderColor: 'var(--border-default)'
                    }}>
                        {value}
                    </span>
                );

            case 'status':
                const statusStyles = {
                    active: { color: 'var(--status-active)', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'var(--status-active)' },
                    pending: { color: 'var(--status-pending)', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'var(--status-pending)' },
                    completed: { color: 'var(--status-completed)', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'var(--status-completed)' },
                    cancelled: { color: 'var(--status-cancelled)', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--status-cancelled)' },
                    inactive: { color: 'var(--text-tertiary)', backgroundColor: 'var(--surface-disabled)', borderColor: 'var(--border-default)' }
                };
                const statusStyle = statusStyles[value?.toLowerCase()] || { color: 'var(--text-secondary)', backgroundColor: 'var(--surface-hover)', borderColor: 'var(--border-default)' };
                return (
                    <span className="inline-flex justify-center px-2.5 py-0.5 text-xs font-medium border" style={statusStyle}>
                        {value}
                    </span>
                );

            case 'rfq-status': {
                // Keys are snake_case matching backend STATUS constants
                const rfqStatusStyles = {
                    'industrialization_draft': { color: 'var(--text-tertiary)',       backgroundColor: 'var(--surface-disabled)',         borderColor: 'var(--border-default)' },
                    'sent_to_purchases':       { color: 'var(--status-active)',       backgroundColor: 'rgba(16, 185, 129, 0.1)',         borderColor: 'var(--status-active)' },
                    'purchases_draft':         { color: 'var(--text-tertiary)',       backgroundColor: 'var(--surface-disabled)',         borderColor: 'var(--border-default)' },
                    'sent_to_suppliers':       { color: 'var(--status-active)',       backgroundColor: 'rgba(16, 185, 129, 0.1)',         borderColor: 'var(--status-active)' },
                    'waiting_for_suppliers':   { color: 'var(--status-pending)',      backgroundColor: 'rgba(245, 158, 11, 0.1)',         borderColor: 'var(--status-pending)' },
                    'supplier_selected':       { color: 'var(--status-completed)',    backgroundColor: 'rgba(59, 130, 246, 0.1)',         borderColor: 'var(--status-completed)' },
                    'rfq_closed':              { color: 'var(--status-cancelled)',    backgroundColor: 'rgba(239, 68, 68, 0.1)',          borderColor: 'var(--status-cancelled)' },
                    
                    // Custom Supplier Statuses
                    'This RFQ has been selected': { color: 'var(--status-completed)', backgroundColor: 'rgba(59, 130, 246, 0.1)',         borderColor: 'var(--status-completed)' },
                    'Waiting for response':       { color: 'var(--status-pending)',   backgroundColor: 'rgba(245, 158, 11, 0.1)',         borderColor: 'var(--status-pending)' },
                    'Pending':                    { color: 'var(--text-tertiary)',    backgroundColor: 'var(--surface-disabled)',         borderColor: 'var(--border-default)' },
                    'Not Selected':               { color: 'var(--status-cancelled)', backgroundColor: 'rgba(239, 68, 68, 0.1)',          borderColor: 'var(--status-cancelled)' },
                };
                const rfqStatusStyle = rfqStatusStyles[value] || { color: 'var(--text-secondary)', backgroundColor: 'var(--surface-hover)', borderColor: 'var(--border-default)' };
                // Display human-readable label; fall back to raw value if unknown
                const rfqStatusLabel = STATUS_LABEL[value] ?? value;
                return (
                    <span className="inline-flex justify-center px-2.5 py-0.5 text-xs font-medium border" style={rfqStatusStyle}>
                        {rfqStatusLabel}
                    </span>
                );
            }

            case 'priority':
                const priorityStyles = {
                    high: { color: 'var(--priority-high)', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--priority-high)' },
                    medium: { color: 'var(--priority-medium)', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'var(--priority-medium)' },
                    low: { color: 'var(--priority-low)', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'var(--priority-low)' }
                };
                const priorityStyle = priorityStyles[value?.toLowerCase()] || { color: 'var(--text-secondary)', backgroundColor: 'var(--surface-hover)', borderColor: 'var(--border-default)' };
                return (
                    <span className="w-20 inline-flex justify-center px-2.5 py-0.5 text-xs font-medium border" style={priorityStyle}>
                        {value}
                    </span>
                );

            default:
                return <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{value}</span>;
        }
    };

    const getFilterOptions = (columnKey) => {
        const uniqueValues = [...new Set(data.map(item => item[columnKey]))];
        return uniqueValues.filter(v => v != null);
    };

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--background-secondary)' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>{title}</h1>
                        {subtitle && (
                            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                            <Filter size={16} />
                            Filter
                            {Object.keys(filters).length > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 text-white text-xs" style={{ backgroundColor: 'var(--brand-accent)' }}>
                                    {Object.keys(filters).length}
                                </span>
                            )}
                        </Button>

                        {onAdd && (
                            <Button onClick={onAdd}>
                                <Plus size={16} />
                                Add
                            </Button>
                        )}
                    </div>
                </div>

                {/* SEARCH BAR */}
                <div className="mb-6">
                    <Input
                        variant="search"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* FILTERS PANEL */}
                {showFilters && (
                    <div className="mb-6 p-4 bg-surface border border-border-default">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Filters</h3>
                            <button
                                onClick={clearAllFilters}
                                className="text-xs transition-colors duration-fast"
                                style={{ color: 'var(--text-tertiary)' }}
                                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
                            >
                                Clear all
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {columns.map(col => {
                                if (!col.filterable) return null;
                                const options = getFilterOptions(col.key);
                                return (
                                    <div key={col.key}>
                                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                                            {col.label}
                                        </label>
                                        <select
                                            value={filters[col.key] || ''}
                                            onChange={(e) => handleFilter(col.key, e.target.value)}
                                            className="w-full px-3 py-1.5 text-sm border border-border-default focus:outline-none focus:ring-2 focus:ring-ring bg-surface"
                                            style={{ color: 'var(--text-primary)' }}
                                        >
                                            <option value="">All</option>
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
                <div className="bg-surface border border-border-default overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y" style={{ divideColor: 'var(--border-default)' }}>
                            {/* HEAD */}
                            <thead style={{ backgroundColor: 'var(--background-tertiary)' }}>
                                <tr>
                                    {columns.map(col => (
                                        <th
                                            key={col.key}
                                            onClick={() => col.sortable && handleSort(col.key)}
                                            className={`
                                                px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider
                                                ${col.sortable ? 'cursor-pointer transition-colors hover:text-text-primary' : ''}
                                            `}
                                            style={{ color: 'var(--text-tertiary)' }}
                                        >
                                            <div className="flex items-center gap-1.5">
                                                {col.label}
                                                {col.sortable && <SortIcon columnKey={col.key} />}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            {/* BODY */}
                            <tbody className="divide-y" style={{ divideColor: 'var(--border-light)' }}>
                                {sortedData.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={columns.length + 1}
                                            className="px-6 py-12 text-center text-sm"
                                            style={{ color: 'var(--text-tertiary)' }}
                                        >
                                            No results found
                                        </td>
                                    </tr>
                                ) : (
                                    sortedData.map((row, i) => (
                                        <tr
                                            key={i}
                                            className={`transition-colors duration-150 hover:bg-surface-hover ${onClickRow ? 'cursor-pointer' : ''}`}
                                            onClick={() => onClickRow && onClickRow(row)}
                                        >
                                            {columns.map(col => (
                                                <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {col.render
                                                        ? col.render(row[col.key], row)
                                                        : renderCell(row[col.key], col.type, row)
                                                    }
                                                </td>
                                            ))}
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
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            Showing {sortedData.length} of {data.length} records
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}