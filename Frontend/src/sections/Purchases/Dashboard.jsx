// sections/Purchases/Dashboard.jsx
import { useState, useEffect } from 'react';
import { Clock, TrendingUp, BarChart3, RefreshCw, Users, CheckCircle, XCircle } from 'lucide-react';
import Card from '../../components/ui/Card';
import { getPurchasesDashboardData } from '../api';

export default function PurchasesDashboard() {
    const [timeRange, setTimeRange] = useState('week');
    const [chartData, setChartData] = useState(null);
    const [kpis, setKpis] = useState(null);
    const [funnel, setFunnel] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        getPurchasesDashboardData(timeRange)
            .then(data => {
                setChartData(data);
                setKpis(data?.kpis);
                setFunnel(data?.funnelCotizaciones);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [timeRange]);

    const getMaxValue = (dataset) => {
        if (!dataset) return 10;
        const all = [
            ...(dataset.newToPublished ?? []),
            ...(dataset.publishedToClosed ?? []),
        ];
        return Math.max(...all, 10);
    };

    const getMaxRfqValue = (dataset) => {
        if (!dataset) return 10;
        const all = [...(dataset.drafts ?? []), ...(dataset.accepted ?? [])];
        return Math.max(...all, 10);
    };

    const renderBarChart = (data, datasets, maxValue) => {
        if (loading || !data?.labels) {
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
                <div className="relative" style={{ height: '200px' }}>
                    <div className="absolute left-0 top-0 bottom-6 w-8">
                        {[0, 25, 50, 75, 100].map(pct => (
                            <div key={pct} className="absolute text-[10px]" style={{ bottom: `${pct}%`, transform: 'translateY(50%)', color: 'var(--text-tertiary)' }}>
                                {((pct / 100) * maxValue).toFixed(0)}
                            </div>
                        ))}
                    </div>
                    <div className="absolute left-8 right-0 top-0 bottom-6">
                        {[0, 25, 50, 75, 100].map(pct => (
                            <div key={pct} className="absolute w-full border-t" style={{ bottom: `${pct}%`, borderColor: 'var(--border-light)' }} />
                        ))}
                    </div>
                    <div className="absolute left-8 right-0 top-0 bottom-6 flex">
                        {data.labels.map((_, idx) => (
                            <div key={idx} className="flex-1 flex flex-col justify-end px-0.5" style={{ width: `${barWidth}%` }}>
                                {datasets.map((ds, di) => {
                                    const value = ds.data[idx] ?? 0;
                                    const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
                                    return (
                                        <div key={di} className="w-full transition-all duration-300 mb-0.5"
                                            style={{ height: `${height}%`, backgroundColor: ds.color, minHeight: height > 0 ? '2px' : '0' }} />
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                    <div className="absolute left-8 right-0 bottom-0 flex">
                        {data.labels.map((label, idx) => (
                            <div key={idx} className="flex-1 text-center text-[10px] pt-1"
                                style={{ color: 'var(--text-tertiary)', width: `${barWidth}%` }}>
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
            {['week', 'month', 'quarter'].map(r => (
                <button key={r} onClick={() => setTimeRange(r)}
                    className="px-2 py-1 text-xs capitalize transition-colors duration-fast"
                    style={{
                        backgroundColor: timeRange === r ? 'var(--brand-accent)' : 'transparent',
                        color: timeRange === r ? 'var(--text-inverse)' : 'var(--text-secondary)',
                        border: timeRange === r ? 'none' : '1px solid var(--border-default)',
                    }}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
            ))}
        </div>
    );

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--background-secondary)' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>Purchases Dashboard</h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Monitor quoting pipeline and supplier response metrics</p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: 'New Requirements', value: funnel?.nuevos_requerimientos_lev4, color: 'var(--status-pending)' },
                        { label: 'Sent to Suppliers', value: funnel?.esperando_proveedores_lev6, color: 'var(--brand-accent)' },
                        { label: 'Cost Analysis', value: funnel?.analisis_costos_lev7, color: 'var(--status-completed)' },
                        { label: 'Pending Award', value: funnel?.pendientes_autorizacion_lev8, color: 'var(--status-active)' },
                    ].map(({ label, value, color }) => (
                        <Card key={label}>
                            <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
                            <p className="text-3xl font-bold mt-2" style={{ color }}>{loading ? '—' : (value ?? 0)}</p>
                        </Card>
                    ))}
                </div>

                {/* KPI stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <Card>
                        <div className="flex items-center gap-2 mb-2">
                            <Users size={16} style={{ color: 'var(--brand-accent)' }} />
                            <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>Supplier Response Rate</h3>
                        </div>
                        <p className="text-3xl font-bold" style={{ color: 'var(--status-active)' }}>
                            {loading ? '—' : `${kpis?.tasa_respuesta_proveedores ?? 0}%`}
                        </p>
                        <div className="mt-2 w-full h-1.5 bg-border-default overflow-hidden">
                            <div className="h-full" style={{ width: `${kpis?.tasa_respuesta_proveedores ?? 0}%`, backgroundColor: 'var(--status-active)' }} />
                        </div>
                    </Card>
                    <Card>
                        <div className="flex items-center gap-2 mb-2">
                            <Clock size={16} style={{ color: 'var(--brand-accent)' }} />
                            <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>Avg. Response Time</h3>
                        </div>
                        <p className="text-3xl font-bold" style={{ color: 'var(--brand-accent)' }}>
                            {loading ? '—' : `${kpis?.tiempo_promedio_respuesta_horas ?? 0}h`}
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>From published to first supplier response</p>
                    </Card>
                </div>

                {/* Charts */}
                <div className="mb-6">
                    <Card>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp size={16} style={{ color: 'var(--brand-accent)' }} />
                                        <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>Pipeline Activity</h3>
                                    </div>
                                    {timeRangeButtons}
                                </div>
                                {renderBarChart(
                                    chartData?.statusChange,
                                    [
                                        { name: 'New → Published', data: chartData?.statusChange?.newToPublished ?? [], color: 'var(--brand-accent)' },
                                        { name: 'Published → Closed', data: chartData?.statusChange?.publishedToClosed ?? [], color: 'var(--status-active)' },
                                    ],
                                    getMaxValue(chartData?.statusChange)
                                )}
                                <div className="flex justify-center gap-4 mt-4 pt-3 border-t" style={{ borderColor: 'var(--border-light)' }}>
                                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5" style={{ backgroundColor: 'var(--brand-accent)' }} /><span className="text-[10px]">New → Published</span></div>
                                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5" style={{ backgroundColor: 'var(--status-active)' }} /><span className="text-[10px]">Published → Closed</span></div>
                                </div>
                            </div>

                            <div className="border-l border-border-default pl-6">
                                <h4 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-tertiary)' }}>Pipeline Stats</h4>
                                <div className="space-y-3">
                                    <div className="p-3 border border-border-default">
                                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Avg. Response Time</p>
                                        <p className="text-xl font-semibold mt-1" style={{ color: 'var(--brand-accent)' }}>{kpis?.tiempo_promedio_respuesta_horas ?? 0}h</p>
                                    </div>
                                    <div className="p-3 border border-border-default">
                                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Response Rate</p>
                                        <p className="text-xl font-semibold mt-1" style={{ color: 'var(--status-active)' }}>{kpis?.tasa_respuesta_proveedores ?? 0}%</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                <div>
                    <Card>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <BarChart3 size={16} style={{ color: 'var(--brand-accent)' }} />
                                        <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>RFQ Distribution</h3>
                                    </div>
                                    {timeRangeButtons}
                                </div>
                                {renderBarChart(
                                    chartData?.rfqDistribution,
                                    [
                                        { name: 'New', data: chartData?.rfqDistribution?.drafts ?? [], color: 'var(--status-pending)' },
                                        { name: 'Closed', data: chartData?.rfqDistribution?.accepted ?? [], color: 'var(--status-active)' },
                                    ],
                                    getMaxRfqValue(chartData?.rfqDistribution)
                                )}
                            </div>
                            <div className="border-l border-border-default pl-6">
                                <h4 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-tertiary)' }}>Summary</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 border border-border-default">
                                        <div className="flex items-center gap-2"><CheckCircle size={12} style={{ color: 'var(--status-active)' }} /><p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Total Closed</p></div>
                                        <p className="text-2xl font-semibold mt-1">{chartData?.rfqDistribution?.stats?.totalAccepted ?? 0}</p>
                                    </div>
                                    <div className="p-3 border border-border-default">
                                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Acceptance Rate</p>
                                        <p className="text-2xl font-semibold mt-1" style={{ color: 'var(--status-active)' }}>{chartData?.rfqDistribution?.stats?.acceptanceRate ?? 0}%</p>
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
