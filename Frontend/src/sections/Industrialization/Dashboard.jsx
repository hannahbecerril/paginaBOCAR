// sections/Industrialization/Dashboard.jsx
import { useState, useEffect } from 'react';
import { Clock, FileText, CheckCircle, XCircle, TrendingUp, TrendingDown, Calendar, RefreshCw, BarChart3, Activity } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { getDashboardData } from '../api';

export default function IndustrializationDashboard() {
    const [timeRange, setTimeRange] = useState('week');
    const [chartData, setChartData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        getDashboardData(timeRange).then(data => {
            setChartData(data);
            setLoading(false);
        });
    }, [timeRange]);

    const getMaxValue = (data) => {
        if (!data) return 5;
        const allData = [...data.draftToSent, ...data.createdToDraft];
        return Math.max(...allData, 5);
    };

    const getMaxRfqValue = (data) => {
        if (!data) return 10;
        const allData = [...data.drafts, ...data.accepted, ...data.declined];
        return Math.max(...allData, 10);
    };

    const renderBarChart = (data, datasets, maxValue) => {
        if (loading || !data) {
            return (
                <div className="flex items-center justify-center h-48">
                    <div className="text-center">
                        <RefreshCw size={24} style={{ color: 'var(--text-tertiary)' }} className="animate-spin" />
                        <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>Loading...</p>
                    </div>
                </div>
            );
        }

        const barWidth = 100 / data.labels.length;

        return (
            <div>
                {/* Chart Canvas */}
                <div className="relative" style={{ height: '200px' }}>
                    {/* Y-axis labels */}
                    <div className="absolute left-0 top-0 bottom-6 w-8">
                        {[0, 25, 50, 75, 100].map((percent) => {
                            const value = (percent / 100) * maxValue;
                            return (
                                <div
                                    key={percent}
                                    className="absolute text-[10px]"
                                    style={{
                                        bottom: `${percent}%`,
                                        transform: 'translateY(50%)',
                                        color: 'var(--text-tertiary)'
                                    }}
                                >
                                    {value.toFixed(0)}
                                </div>
                            );
                        })}
                    </div>

                    {/* Grid lines */}
                    <div className="absolute left-8 right-0 top-0 bottom-6">
                        {[0, 25, 50, 75, 100].map((percent) => (
                            <div
                                key={percent}
                                className="absolute w-full border-t"
                                style={{
                                    bottom: `${percent}%`,
                                    borderColor: 'var(--border-light)'
                                }}
                            />
                        ))}
                    </div>

                    {/* Bars */}
                    <div className="absolute left-8 right-0 top-0 bottom-6 flex">
                        {data.labels.map((label, idx) => (
                            <div key={idx} className="flex-1 flex flex-col justify-end px-0.5" style={{ width: `${barWidth}%` }}>
                                {datasets.map((dataset, didx) => {
                                    const value = dataset.data[idx];
                                    const height = (value / maxValue) * 100;
                                    return (
                                        <div
                                            key={didx}
                                            className="w-full transition-all duration-300 mb-0.5"
                                            style={{
                                                height: `${height}%`,
                                                backgroundColor: dataset.color,
                                                minHeight: height > 0 ? '2px' : '0'
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        ))}
                    </div>

                    {/* X-axis labels */}
                    <div className="absolute left-8 right-0 bottom-0 flex">
                        {data.labels.map((label, idx) => (
                            <div
                                key={idx}
                                className="flex-1 text-center text-[10px] pt-1"
                                style={{ color: 'var(--text-tertiary)', width: `${barWidth}%` }}
                            >
                                {label}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const timeRangeButtons = (
        <div className="flex gap-1">
            <button
                onClick={() => setTimeRange('week')}
                className="px-2 py-1 text-xs transition-colors duration-fast"
                style={{
                    backgroundColor: timeRange === 'week' ? 'var(--brand-accent)' : 'transparent',
                    color: timeRange === 'week' ? 'var(--text-inverse)' : 'var(--text-secondary)',
                    border: timeRange === 'week' ? 'none' : '1px solid var(--border-default)'
                }}
            >
                Week
            </button>
            <button
                onClick={() => setTimeRange('month')}
                className="px-2 py-1 text-xs transition-colors duration-fast"
                style={{
                    backgroundColor: timeRange === 'month' ? 'var(--brand-accent)' : 'transparent',
                    color: timeRange === 'month' ? 'var(--text-inverse)' : 'var(--text-secondary)',
                    border: timeRange === 'month' ? 'none' : '1px solid var(--border-default)'
                }}
            >
                Month
            </button>
            <button
                onClick={() => setTimeRange('quarter')}
                className="px-2 py-1 text-xs transition-colors duration-fast"
                style={{
                    backgroundColor: timeRange === 'quarter' ? 'var(--brand-accent)' : 'transparent',
                    color: timeRange === 'quarter' ? 'var(--text-inverse)' : 'var(--text-secondary)',
                    border: timeRange === 'quarter' ? 'none' : '1px solid var(--border-default)'
                }}
            >
                Quarter
            </button>
        </div>
    );

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--background-secondary)' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                        Industrialization Dashboard
                    </h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                        Monitor RFQ performance and status distribution
                    </p>
                </div>

                {/* Graph 1: Time Between Status Changes */}
                <div className="mb-6">
                    <Card>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left side - Graph */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Clock size={16} style={{ color: 'var(--brand-accent)' }} />
                                        <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                                            Time Between Status Changes
                                        </h3>
                                    </div>
                                    {timeRangeButtons}
                                </div>

                                {renderBarChart(
                                    chartData?.statusChange,
                                    [
                                        { name: 'Draft to Sent to Purchases', data: chartData?.statusChange?.draftToSent || [], color: 'var(--brand-accent)' },
                                        { name: 'Created to Draft', data: chartData?.statusChange?.createdToDraft || [], color: 'var(--status-completed)' }
                                    ],
                                    getMaxValue(chartData?.statusChange)
                                )}

                                {/* Legend */}
                                <div className="flex justify-center gap-4 mt-4 pt-3 border-t" style={{ borderColor: 'var(--border-light)' }}>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5" style={{ backgroundColor: 'var(--brand-accent)' }} />
                                        <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Draft to Sent to Purchases</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5" style={{ backgroundColor: 'var(--status-completed)' }} />
                                        <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Created to Draft</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right side - Statistics */}
                            <div className="border-l border-border-default pl-6">
                                <h4 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-tertiary)' }}>
                                    Performance Statistics
                                </h4>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 border border-border-default">
                                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Avg. Draft to Sent</p>
                                            <p className="text-xl font-semibold mt-1" style={{ color: 'var(--brand-accent)' }}>
                                                {chartData?.statusChange?.stats.avgDraftToSent || '-'} days
                                            </p>
                                        </div>
                                        <div className="p-3 border border-border-default">
                                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Avg. Created to Draft</p>
                                            <p className="text-xl font-semibold mt-1" style={{ color: 'var(--status-completed)' }}>
                                                {chartData?.statusChange?.stats.avgCreatedToDraft || '-'} days
                                            </p>
                                        </div>
                                    </div>
                                    <div className="p-3 border border-border-default">
                                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Fastest Processing Time</p>
                                        <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-primary)' }}>
                                            {chartData?.statusChange?.stats.fastestDraftToSent || '-'} days (Draft to Sent)
                                        </p>
                                    </div>
                                    <div className="p-3 border border-border-default">
                                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Slowest Processing Time</p>
                                        <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-primary)' }}>
                                            {chartData?.statusChange?.stats.slowestDraftToSent || '-'} days (Draft to Sent)
                                        </p>
                                    </div>
                                    <div className="pt-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span style={{ color: 'var(--text-secondary)' }}>Efficiency Score</span>
                                            <span className="font-semibold" style={{ color: 'var(--brand-accent)' }}>
                                                {chartData?.statusChange?.stats.avgDraftToSent < 3.5 ? 'Good' : 'Average'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Graph 2: RFQ Status Distribution */}
                <div>
                    <Card>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left side - Graph */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <BarChart3 size={16} style={{ color: 'var(--brand-accent)' }} />
                                        <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                                            RFQ Status Distribution
                                        </h3>
                                    </div>
                                    {timeRangeButtons}
                                </div>

                                {renderBarChart(
                                    chartData?.rfqDistribution,
                                    [
                                        { name: 'Drafts', data: chartData?.rfqDistribution?.drafts || [], color: 'var(--status-pending)' },
                                        { name: 'Accepted', data: chartData?.rfqDistribution?.accepted || [], color: 'var(--status-active)' },
                                        { name: 'Declined', data: chartData?.rfqDistribution?.declined || [], color: 'var(--status-cancelled)' }
                                    ],
                                    getMaxRfqValue(chartData?.rfqDistribution)
                                )}

                                {/* Legend */}
                                <div className="flex justify-center gap-4 mt-4 pt-3 border-t" style={{ borderColor: 'var(--border-light)' }}>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5" style={{ backgroundColor: 'var(--status-pending)' }} />
                                        <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Drafts</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5" style={{ backgroundColor: 'var(--status-active)' }} />
                                        <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Accepted</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5" style={{ backgroundColor: 'var(--status-cancelled)' }} />
                                        <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Declined by Admin</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right side - Statistics */}
                            <div className="border-l border-border-default pl-6">
                                <h4 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-tertiary)' }}>
                                    RFQ Statistics
                                </h4>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 border border-border-default">
                                            <div className="flex items-center gap-2">
                                                <FileText size={12} style={{ color: 'var(--status-pending)' }} />
                                                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Total Drafts</p>
                                            </div>
                                            <p className="text-2xl font-semibold mt-1" style={{ color: 'var(--text-primary)' }}>
                                                {chartData?.rfqDistribution?.stats.totalDrafts || '-'}
                                            </p>
                                        </div>
                                        <div className="p-3 border border-border-default">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle size={12} style={{ color: 'var(--status-active)' }} />
                                                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Total Accepted</p>
                                            </div>
                                            <p className="text-2xl font-semibold mt-1" style={{ color: 'var(--text-primary)' }}>
                                                {chartData?.rfqDistribution?.stats.totalAccepted || '-'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="p-3 border border-border-default">
                                        <div className="flex items-center gap-2">
                                            <XCircle size={12} style={{ color: 'var(--status-cancelled)' }} />
                                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Total Declined by Admin</p>
                                        </div>
                                        <p className="text-2xl font-semibold mt-1" style={{ color: 'var(--text-primary)' }}>
                                            {chartData?.rfqDistribution?.stats.totalDeclined || '-'}
                                        </p>
                                    </div>
                                    <div className="pt-2 border-t border-border-default">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Acceptance Rate</p>
                                            <p className="text-xl font-bold" style={{ color: 'var(--status-active)' }}>
                                                {chartData?.rfqDistribution?.stats.acceptanceRate || '-'}%
                                            </p>
                                        </div>
                                        <div className="mt-2 w-full h-1.5 bg-border-default overflow-hidden">
                                            <div
                                                className="h-full transition-all duration-300"
                                                style={{
                                                    width: `${chartData?.rfqDistribution?.stats.acceptanceRate || 0}%`,
                                                    backgroundColor: 'var(--status-active)'
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
