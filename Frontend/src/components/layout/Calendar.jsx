// components/layout/Calendar.jsx
import { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalIcon, Clock, Tag, CheckCircle, AlertCircle, Wifi } from 'lucide-react';
import { getIndustrializationAllRFQs, getPurchasesAllRFQs, getSuppliersAllRFQs } from '../../sections/api';

// ── Event generation ──────────────────────────────────────────────────

const TODAY = new Date();
const y = TODAY.getFullYear();
const m = TODAY.getMonth();

function d(dayOffset, hour = 9) {
    const dt = new Date(y, m, TODAY.getDate() + dayOffset, hour, 0);
    return dt;
}

const EVENT_COLORS = {
    deadline:  { bg: 'rgba(239,68,68,0.12)',  border: 'var(--brand-danger)',    text: '#dc2626' },
    approval:  { bg: 'rgba(245,158,11,0.12)', border: 'var(--status-pending)',  text: '#d97706' },
    meeting:   { bg: 'rgba(59,130,246,0.12)', border: 'var(--status-completed)', text: '#2563eb' },
    award:     { bg: 'rgba(16,185,129,0.12)', border: 'var(--status-active)',   text: '#059669' },
    reminder:  { bg: 'rgba(139,92,246,0.12)', border: '#8b5cf6',               text: '#7c3aed' },
};

function genIndEvents() {
    return [
        { id: 1,  date: d(0),  title: 'Draft Due — Molde Fascia',        type: 'deadline',  desc: 'RFQ #47 — submit specs before EOD' },
        { id: 2,  date: d(1),  title: 'Approval Pending — RFQ #49',      type: 'approval',  desc: 'Awaiting Ind. Admin review' },
        { id: 3,  date: d(2,14), title: 'Design Review Meeting',          type: 'meeting',   desc: 'Die Trim Spec walkthrough — Team call' },
        { id: 4,  date: d(3),  title: 'Draft Due — Troquel CVT',         type: 'deadline',  desc: 'RFQ #51 — complete all technical fields' },
        { id: 5,  date: d(5),  title: 'Approved — RFQ #44',              type: 'award',     desc: 'Sent to Purchases successfully' },
        { id: 6,  date: d(7),  title: 'Revision Requested — RFQ #46',   type: 'reminder',  desc: 'Ind. Admin returned draft for corrections' },
        { id: 7,  date: d(9,11), title: 'Engineering Stand-up',           type: 'meeting',   desc: 'Weekly RFQ pipeline review' },
        { id: 8,  date: d(10), title: 'Draft Due — Molde Oil Pan',       type: 'deadline',  desc: 'RFQ #52 — customer deadline: this date' },
        { id: 9,  date: d(12), title: 'Approval Pending — RFQ #53',     type: 'approval',  desc: '3 RFQs queued for admin review' },
        { id: 10, date: d(14,15), title: 'Quarterly Review',             type: 'meeting',   desc: 'Industrialization KPI presentation' },
        { id: 11, date: d(-2), title: 'RFQ #42 Closed',                 type: 'award',     desc: 'Final award confirmed — archived' },
        { id: 12, date: d(-1), title: 'Missed Deadline — RFQ #40',      type: 'deadline',  desc: 'Quote window closed without submission' },
    ];
}

function genPurchasesEvents() {
    return [
        { id: 1,  date: d(0),  title: 'Supplier List Due — RFQ #49',    type: 'deadline',  desc: 'Assign suppliers before quote window opens' },
        { id: 2,  date: d(1,10), title: 'Supplier Review Meeting',       type: 'meeting',   desc: 'Evaluate bids for RFQ #44 and #46' },
        { id: 3,  date: d(2),  title: 'Quote Deadline — RFQ #47',       type: 'deadline',  desc: 'Supplier responses due at EOD' },
        { id: 4,  date: d(3),  title: 'Admin Approval Needed',          type: 'approval',  desc: '2 RFQs waiting Purchases Admin sign-off' },
        { id: 5,  date: d(4),  title: 'Winner Selection — RFQ #41',     type: 'award',     desc: 'Choose winning supplier from 3 bids' },
        { id: 6,  date: d(6,14), title: 'Cost Analysis Workshop',        type: 'meeting',   desc: 'Compare mold pricing benchmarks' },
        { id: 7,  date: d(7),  title: 'Quote Deadline — RFQ #50',       type: 'deadline',  desc: 'Supplier response window closes' },
        { id: 8,  date: d(9),  title: 'Final Award — RFQ #43',          type: 'award',     desc: 'Manager decision required to close RFQ' },
        { id: 9,  date: d(11), title: 'New RFQs from Ind.',             type: 'reminder',  desc: '4 RFQs arrived from Industrialization' },
        { id: 10, date: d(13,9), title: 'Supplier Performance Review',   type: 'meeting',   desc: 'Monthly on-time delivery analysis' },
        { id: 11, date: d(-3), title: 'RFQ #38 Closed',                 type: 'award',     desc: 'Final award confirmed — SUPPLIER_A won' },
        { id: 12, date: d(-1), title: 'Supplier Follow-up',             type: 'reminder',  desc: 'RFQ #45 — 1 supplier has not responded' },
    ];
}

function genSupplierEvents() {
    return [
        { id: 1,  date: d(0),  title: 'Quote Due — RFQ #47 (Die)',      type: 'deadline',  desc: 'Mold Fascia — submit before EOD' },
        { id: 2,  date: d(2),  title: 'Quote Due — RFQ #50 (Mold)',     type: 'deadline',  desc: 'Oil Pan Mold — last day to respond' },
        { id: 3,  date: d(3,11), title: 'Invited to Quote — RFQ #53',   type: 'reminder',  desc: 'New invitation received — review specs' },
        { id: 4,  date: d(5),  title: 'Selected — RFQ #41',              type: 'award',     desc: 'You won this bid — confirm acceptance' },
        { id: 5,  date: d(7),  title: 'Quote Due — RFQ #55 (Die)',      type: 'deadline',  desc: 'Troquel CVT — respond by this date' },
        { id: 6,  date: d(8,14), title: 'Toolmaker Briefing',            type: 'meeting',   desc: 'Technical alignment with BOCAR engineering' },
        { id: 7,  date: d(10), title: 'Quote Due — RFQ #56 (Mold)',     type: 'deadline',  desc: 'New mold spec — review and price' },
        { id: 8,  date: d(12), title: 'Award Result — RFQ #48',        type: 'award',     desc: 'Final decision pending from Purchases Admin' },
        { id: 9,  date: d(14), title: 'Quote Window Opens — RFQ #58',  type: 'reminder',  desc: 'New invitation — quote window starts today' },
        { id: 10, date: d(-1), title: 'Not Selected — RFQ #39',        type: 'reminder',  desc: 'Award went to another supplier' },
        { id: 11, date: d(-2), title: 'Quote Submitted — RFQ #46',     type: 'award',     desc: 'Your quote is under review' },
    ];
}

function getEvents(role) {
    if (role === 'purchases') return genPurchasesEvents();
    if (role === 'suppliers') return genSupplierEvents();
    return genIndEvents();
}

// ── View helpers ───────────────────────────────────────────────────────────────

function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();
}

function startOfWeek(date) {
    const d = new Date(date);
    d.setDate(d.getDate() - d.getDay());
    return d;
}

function formatTime(date) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDate(date) {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function EventPill({ event, small = false }) {
    const style = EVENT_COLORS[event.type] ?? EVENT_COLORS.reminder;
    return (
        <div
            className="px-1.5 py-0.5 text-xs truncate border-l-2 cursor-default"
            style={{ backgroundColor: style.bg, borderLeftColor: style.border, color: style.text }}
            title={`${event.title} — ${event.desc}`}
        >
            {small ? event.title.slice(0, 22) + (event.title.length > 22 ? '…' : '') : event.title}
        </div>
    );
}

function MonthView({ current, events, onDayClick, selected }) {
    const firstDay = new Date(current.getFullYear(), current.getMonth(), 1);
    const lastDay  = new Date(current.getFullYear(), current.getMonth() + 1, 0);
    const startDow = firstDay.getDay();

    const cells = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) cells.push(new Date(current.getFullYear(), current.getMonth(), d));

    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div>
            <div className="grid grid-cols-7 border-b" style={{ borderColor: 'var(--border-default)' }}>
                {days.map(d => (
                    <div key={d} className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{d}</div>
                ))}
            </div>
            {weeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 border-b" style={{ borderColor: 'var(--border-light)', minHeight: '90px' }}>
                    {week.map((date, di) => {
                        if (!date) return <div key={di} style={{ backgroundColor: 'var(--background-tertiary)' }} />;
                        const dayEvents = events.filter(e => isSameDay(e.date, date));
                        const isToday = isSameDay(date, TODAY);
                        const isSel = selected && isSameDay(date, selected);
                        return (
                            <div
                                key={di}
                                onClick={() => onDayClick(date)}
                                className="p-1.5 cursor-pointer border-r hover:bg-surface-hover transition-colors"
                                style={{ borderColor: 'var(--border-light)', backgroundColor: isSel ? 'var(--surface-active)' : 'transparent' }}
                            >
                                <span
                                    className={`inline-flex items-center justify-center w-6 h-6 text-xs font-medium mb-1 ${isToday ? 'rounded-full text-white' : ''}`}
                                    style={{ backgroundColor: isToday ? 'var(--brand-accent)' : 'transparent', color: isToday ? 'white' : 'var(--text-primary)' }}
                                >
                                    {date.getDate()}
                                </span>
                                <div className="space-y-0.5">
                                    {dayEvents.slice(0, 2).map(ev => <EventPill key={ev.id} event={ev} small />)}
                                    {dayEvents.length > 2 && (
                                        <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>+{dayEvents.length - 2} more</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}

function WeekView({ current, events }) {
    const start = startOfWeek(current);
    const weekDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return d;
    });
    return (
        <div className="overflow-x-auto">
            <div className="grid min-w-[600px]" style={{ gridTemplateColumns: '60px repeat(7, 1fr)' }}>
                <div className="border-b border-r" style={{ borderColor: 'var(--border-default)' }} />
                {weekDays.map((d, i) => {
                    const isToday = isSameDay(d, TODAY);
                    return (
                        <div key={i} className="px-2 py-2 text-center border-b border-r text-xs font-medium" style={{ borderColor: 'var(--border-default)', backgroundColor: isToday ? 'rgba(var(--brand-accent-rgb, 59,130,246),0.05)' : 'transparent' }}>
                            <p style={{ color: 'var(--text-tertiary)' }}>{d.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                            <p className={`text-base font-bold ${isToday ? 'rounded-full w-7 h-7 flex items-center justify-center mx-auto text-white' : ''}`}
                                style={{ backgroundColor: isToday ? 'var(--brand-accent)' : 'transparent', color: isToday ? 'white' : 'var(--text-primary)' }}>
                                {d.getDate()}
                            </p>
                        </div>
                    );
                })}
                {[8,9,10,11,12,13,14,15,16,17,18].map(hour => (
                    <>
                        <div key={`h${hour}`} className="px-2 py-1 text-right text-xs border-r border-b" style={{ borderColor: 'var(--border-light)', color: 'var(--text-tertiary)' }}>
                            {hour}:00
                        </div>
                        {weekDays.map((d, di) => {
                            const slotEvents = events.filter(e => isSameDay(e.date, d) && e.date.getHours() === hour);
                            return (
                                <div key={`${hour}-${di}`} className="border-r border-b p-0.5 min-h-[40px]" style={{ borderColor: 'var(--border-light)' }}>
                                    {slotEvents.map(ev => <EventPill key={ev.id} event={ev} small />)}
                                </div>
                            );
                        })}
                    </>
                ))}
            </div>
        </div>
    );
}

function DayView({ current, events }) {
    const dayEvents = events.filter(e => isSameDay(e.date, current));
    return (
        <div>
            <div className="px-4 py-3 border-b flex items-center gap-3" style={{ borderColor: 'var(--border-default)' }}>
                <span className="text-2xl font-bold" style={{ color: isSameDay(current, TODAY) ? 'var(--brand-accent)' : 'var(--text-primary)' }}>
                    {current.getDate()}
                </span>
                <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {current.toLocaleDateString('en-US', { weekday: 'long', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{dayEvents.length} events</p>
                </div>
            </div>
            <div className="divide-y" style={{ divideColor: 'var(--border-light)' }}>
                {[8,9,10,11,12,13,14,15,16,17,18].map(hour => {
                    const slotEvents = dayEvents.filter(e => e.date.getHours() === hour);
                    return (
                        <div key={hour} className="flex gap-3 px-4 py-2 min-h-[48px]">
                            <span className="w-12 text-xs pt-1 text-right flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>{hour}:00</span>
                            <div className="flex-1 space-y-1">
                                {slotEvents.map(ev => {
                                    const style = EVENT_COLORS[ev.type] ?? EVENT_COLORS.reminder;
                                    return (
                                        <div key={ev.id} className="px-3 py-2 border-l-4 text-sm" style={{ backgroundColor: style.bg, borderLeftColor: style.border }}>
                                            <p className="font-medium" style={{ color: style.text }}>{ev.title}</p>
                                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{ev.desc}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function AgendaView({ events }) {
    const upcoming = [...events]
        .sort((a, b) => a.date - b.date)
        .filter(e => e.date >= new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate()));

    if (upcoming.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <CheckCircle size={40} style={{ color: 'var(--text-tertiary)' }} />
                <p className="mt-3 text-sm" style={{ color: 'var(--text-tertiary)' }}>No upcoming events</p>
            </div>
        );
    }

    let lastDateStr = '';
    return (
        <div className="divide-y" style={{ divideColor: 'var(--border-light)' }}>
            {upcoming.map(ev => {
                const dateStr = formatDate(ev.date);
                const showHeader = dateStr !== lastDateStr;
                lastDateStr = dateStr;
                const style = EVENT_COLORS[ev.type] ?? EVENT_COLORS.reminder;
                const isToday = isSameDay(ev.date, TODAY);
                return (
                    <div key={ev.id}>
                        {showHeader && (
                            <div className="px-4 py-2 sticky top-0" style={{ backgroundColor: 'var(--background-tertiary)' }}>
                                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: isToday ? 'var(--brand-accent)' : 'var(--text-tertiary)' }}>
                                    {isToday ? '⬤ Today — ' : ''}{dateStr}
                                </p>
                            </div>
                        )}
                        <div className="flex gap-3 px-4 py-3 hover:bg-surface-hover transition-colors">
                            <div className="w-1 rounded-full flex-shrink-0 self-stretch" style={{ backgroundColor: style.border }} />
                            <div className="w-16 flex-shrink-0 pt-0.5">
                                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{formatTime(ev.date)}</p>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium" style={{ color: style.text }}>{ev.title}</p>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{ev.desc}</p>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 self-start border capitalize" style={{ color: style.text, borderColor: style.border, backgroundColor: style.bg }}>
                                {ev.type}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function Calendar({ userRole = 'industrialization' }) {
    const [view, setView]       = useState('month');
    const [current, setCurrent] = useState(new Date(TODAY));
    const [selected, setSelected] = useState(TODAY);

    const events = useMemo(() => getEvents(userRole), [userRole]);

    const navigate = (dir) => {
        const next = new Date(current);
        if (view === 'month')  next.setMonth(next.getMonth() + dir);
        if (view === 'week')   next.setDate(next.getDate() + 7 * dir);
        if (view === 'day')    next.setDate(next.getDate() + dir);
        if (view === 'agenda') next.setMonth(next.getMonth() + dir);
        setCurrent(next);
    };

    const headerTitle = () => {
        if (view === 'month' || view === 'agenda')
            return current.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        if (view === 'week') {
            const start = startOfWeek(current);
            const end = new Date(start); end.setDate(end.getDate() + 6);
            return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        }
        return current.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    };

    const VIEWS = ['month', 'week', 'day', 'agenda'];

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--background-secondary)' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                            Calendar
                        </h1>
                        <p className="text-sm mt-1 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                            <Wifi size={13} style={{ color: '#0078d4' }} />
                            <span style={{ color: '#0078d4' }}>Connected to Microsoft Outlook</span>
                            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: 'var(--status-active)' }} />
                            <span style={{ color: 'var(--text-tertiary)' }}>Synced</span>
                        </p>
                    </div>

                    {/* View switcher */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex border border-border-default overflow-hidden">
                            {VIEWS.map(v => (
                                <button
                                    key={v}
                                    onClick={() => setView(v)}
                                    className="px-3 py-1.5 text-xs font-medium capitalize transition-colors"
                                    style={{
                                        backgroundColor: view === v ? 'var(--brand-accent)' : 'var(--surface)',
                                        color:           view === v ? 'white' : 'var(--text-secondary)',
                                        borderRight:     v !== 'agenda' ? '1px solid var(--border-default)' : 'none',
                                    }}
                                >
                                    {v}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => { setCurrent(new Date(TODAY)); setSelected(TODAY); }}
                            className="px-3 py-1.5 text-xs font-medium border"
                            style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
                        >
                            Today
                        </button>
                    </div>
                </div>

                {/* Calendar card */}
                <div className="bg-surface border border-border-default overflow-hidden">
                    {/* Navigation bar */}
                    <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--background-tertiary)' }}>
                        <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-surface-hover transition-colors" style={{ color: 'var(--text-secondary)' }}>
                            <ChevronLeft size={18} />
                        </button>
                        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{headerTitle()}</h2>
                        <button onClick={() => navigate(1)} className="p-1.5 hover:bg-surface-hover transition-colors" style={{ color: 'var(--text-secondary)' }}>
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    {/* View */}
                    <div className="overflow-auto" style={{ maxHeight: '70vh' }}>
                        {view === 'month'  && <MonthView  current={current} events={events} onDayClick={d => { setSelected(d); setCurrent(d); }} selected={selected} />}
                        {view === 'week'   && <WeekView   current={current} events={events} />}
                        {view === 'day'    && <DayView    current={current} events={events} />}
                        {view === 'agenda' && <AgendaView events={events} />}
                    </div>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-4 mt-4">
                    {Object.entries(EVENT_COLORS).map(([type, style]) => (
                        <div key={type} className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: style.border }} />
                            <span className="text-xs capitalize" style={{ color: 'var(--text-tertiary)' }}>{type}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
