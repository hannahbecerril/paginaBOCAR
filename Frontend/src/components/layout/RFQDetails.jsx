// components/layout/RFQDetails.jsx
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
    ArrowLeft, FileText, Package, Download, CheckCircle, Clock,
    AlertCircle, ChevronDown, ChevronUp,
    Settings, Info, Factory, ShoppingCart, Building2, Calendar, Layers,
    Users, Edit, X,
} from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import IARecommendations from '../ui/IARecommendations';
import {
    getRFQById, saveSpecifications, savePurchasesMetadata,
    submitRFQForReview, approveRFQInd,
    assignSuppliers, approveSupplierList, selectWinner, finalManagerDecision,
    downloadDocument, getSuppliers,
} from '../../sections/api';
import QuoteForm from '../../sections/Suppliers/QuoteForm';
import { STATUS, STATUS_LABEL } from '../../constants/rfqStatus';
import { IA_CATALOGS } from '../../constants/iaCatalogs';

// ── Field definitions ──────────────────────────────────────────────────────────

const SPEC_GROUPS = {
    mold: [
        {
            id: 'basic', label: 'Basic Information', icon: Info,
            fields: [
                { key: 'DESC',  label: 'Description',   big: true },
                { key: 'PNUM',  label: 'Part Number' },
                { key: 'PT',    label: 'Part Type' },
                { key: 'CUST',  label: 'Customer',      hideForSuppliers: true },
                { key: 'ELAB',  label: 'Elaborated By', hideForSuppliers: true },
            ],
        },
        {
            id: 'production', label: 'Production Planning', icon: Calendar,
            fields: [
                { key: 'PPY',  label: 'Parts Per Year', stat: true },
                { key: 'PRLF', label: 'Project Life',   stat: true },
                { key: 'TT',   label: 'Tool Type' },
                { key: 'DTQ',  label: 'Quote Deadline', stat: true },
            ],
        },
        {
            id: 'tool', label: 'Tool Configuration', icon: Settings,
            fields: [
                { key: 'Smach',       label: 'Machine' },
                { key: 'No_CAV',      label: 'No. of Cavities' },
                { key: 'No_ofHS',     label: 'Hydraulic Slides', options: [{value:'Defined by toolmaker',label:'Defined by toolmaker'},{value:'0',label:'0'},{value:'1',label:'1'},{value:'2',label:'2'},{value:'3',label:'3'},{value:'4+',label:'4+'}] },
                { key: 'No_ofMS',     label: 'Mechanical Slides', options: [{value:'Defined by toolmaker',label:'Defined by toolmaker'},{value:'0',label:'0'},{value:'1',label:'1'},{value:'2',label:'2'},{value:'3',label:'3'},{value:'4+',label:'4+'}] },
                { key: 'ThirdPSupp',  label: 'Third Party Supplier' },
                { key: 'No_subc',     label: 'No. of Subcontractors' },
            ],
        },
        {
            id: 'technical', label: 'Technical Details', icon: Layers,
            fields: [
                { key: 'Jco',          label: 'Jet Cooling' },
                { key: 'QcSys',        label: 'QC System' },
                { key: 'Ihtcs',        label: 'Integrated HT Control' },
                { key: 'Spin',         label: 'Spin' },
                { key: 'HICS',         label: 'HICS' },
                { key: 'CMGOM',        label: 'CMGOM' },
                { key: 'SPforThermoR', label: 'SP Thermo Regulation' },
                { key: 'NReturnV',     label: 'N Return Valve' },
                { key: 'VacV',         label: 'Vacuum Valve' },
                { key: 'ChillBl',      label: 'Chill Block' },
                { key: 'No_PlJcosys',  label: 'Plate Jet Cooling' },
                { key: 'Oth',          label: 'Other' },
            ],
        },
        {
            id: 'dimensions', label: 'Dimensions & Classification', icon: Package,
            fields: [
                { key: 'part_length',    label: 'Length',       unit: 'mm', stat: true },
                { key: 'part_height',    label: 'Height',       unit: 'mm', stat: true },
                { key: 'part_depth',     label: 'Depth',        unit: 'mm', stat: true },
                { key: 'part_weight_kg', label: 'Weight',       unit: 'kg', stat: true },
                { key: 'product_type',   label: 'Product Type', options: IA_CATALOGS.productTypes.map(t => ({ value: t, label: t })) },
                { key: 'comodity',       label: 'Commodity',    options: IA_CATALOGS.comodities.map(c => ({ value: c, label: c })) },
                { key: 'country',        label: 'Country',      options: IA_CATALOGS.countries.map(c => ({ value: c, label: c })) },
            ],
        },
    ],
    die: [
        {
            id: 'basic', label: 'Basic Information', icon: Info,
            fields: [
                { key: 'DESC',  label: 'Description', big: true },
                { key: 'PT_No', label: 'Part Number' },
                { key: 'CUST',  label: 'Customer',    hideForSuppliers: true },
            ],
        },
        {
            id: 'production', label: 'Production Planning', icon: Calendar,
            fields: [
                { key: 'PPY',    label: 'Parts Per Year', stat: true },
                { key: 'PROJ_L', label: 'Project Life',   stat: true },
                { key: 'DTQB',   label: 'Quote Deadline', stat: true },
            ],
        },
        {
            id: 'tool', label: 'Tool Configuration', icon: Settings,
            fields: [
                { key: 'Press',                  label: 'Press Type' },
                { key: 'No_cavities',            label: 'No. of Cavities' },
                { key: 'No_hydra_slides',        label: 'Hydraulic Slides',          options: [{value:'Defined by toolmaker',label:'Defined by toolmaker'},{value:'0',label:'0'},{value:'1',label:'1'},{value:'2',label:'2'},{value:'3',label:'3'},{value:'4+',label:'4+'}] },
                { key: 'Ful_Auto_proc',          label: 'Fully Automatic Process',   options: [{value:'Yes',label:'Yes'},{value:'No',label:'No'}] },
                { key: 'Presence_Detec',         label: 'Presence Detectors',        options: [{value:'Yes',label:'Yes'},{value:'No',label:'No'}] },
                { key: 'Trim_proc',              label: 'Trimming Process',          options: [{value:'Cold',label:'Cold'},{value:'Hot',label:'Hot'}] },
                { key: 'Pun_pins_req',           label: 'Punch Pins Required',       options: [{value:'Yes',label:'Yes'},{value:'No',label:'No'}] },
                { key: 'Admissible_res_burr_mm', label: 'Admissible Residual Burr (mm)' },
                { key: 'Castings_supp',          label: 'Castings Supplied By',      options: [{value:'Yes',label:'Yes'},{value:'No',label:'No'}] },
                { key: 'Adjust_opt_tool_maker',  label: 'Adjustments at Tool Maker', options: [{value:'Yes',label:'Yes'},{value:'No',label:'No'}] },
                { key: 'Gas_spri',               label: 'Gas Springs',               options: [{value:'Yes',label:'Yes'},{value:'No',label:'No'},{value:'Defined by toolmaker',label:'Defined by toolmaker'}] },
            ],
        },
        {
            id: 'dimensions', label: 'Dimensions & Classification', icon: Package,
            fields: [
                { key: 'part_length',    label: 'Length', unit: 'mm', stat: true },
                { key: 'part_height',    label: 'Height', unit: 'mm', stat: true },
                { key: 'part_depth',     label: 'Depth',  unit: 'mm', stat: true },
                { key: 'part_weight_kg', label: 'Weight', unit: 'kg', stat: true },
                { key: 'product_type',   label: 'Product Type', options: IA_CATALOGS.productTypes.map(t => ({ value: t, label: t })) },
                { key: 'comodity',       label: 'Commodity',    options: IA_CATALOGS.comodities.map(c => ({ value: c, label: c })) },
                { key: 'country',        label: 'Country',      options: IA_CATALOGS.countries.map(c => ({ value: c, label: c })) },
            ],
        },
    ],
};

const REQUIRED_SPEC_FIELDS = {
    mold: ['DESC', 'CUST', 'PPY', 'PRLF', 'TT', 'DTQ', 'Smach', 'No_CAV'],
    die:  ['DESC', 'CUST', 'PPY', 'PROJ_L', 'DTQB', 'Press', 'No_cavities'],
};

// ── Status styling ─────────────────────────────────────────────────────────────

function getStatusStyle(status) {
    const map = {
        [STATUS.IND_DRAFT]:             { color: 'var(--text-tertiary)',    bg: 'var(--surface-disabled)',    border: 'var(--border-default)' },
        [STATUS.SENT_TO_PURCHASES]:     { color: 'var(--status-active)',    bg: 'rgba(16,185,129,0.1)',       border: 'var(--status-active)' },
        [STATUS.PURCHASES_DRAFT]:       { color: 'var(--text-tertiary)',    bg: 'var(--surface-disabled)',    border: 'var(--border-default)' },
        [STATUS.SENT_TO_SUPPLIERS]:     { color: 'var(--status-pending)',   bg: 'rgba(245,158,11,0.1)',       border: 'var(--status-pending)' },
        [STATUS.WAITING_FOR_SUPPLIERS]: { color: 'var(--status-pending)',   bg: 'rgba(245,158,11,0.1)',       border: 'var(--status-pending)' },
        [STATUS.SUPPLIER_SELECTED]:     { color: 'var(--status-completed)', bg: 'rgba(59,130,246,0.1)',       border: 'var(--status-completed)' },
        [STATUS.RFQ_CLOSED]:            { color: 'var(--status-cancelled)', bg: 'rgba(239,68,68,0.1)',        border: 'var(--status-cancelled)' },
        'Final Quote': { color: 'var(--status-active)',    bg: 'rgba(16,185,129,0.1)', border: 'var(--status-active)' },
        'Responded':   { color: 'var(--status-completed)', bg: 'rgba(59,130,246,0.1)', border: 'var(--status-completed)' },
        'Selected':    { color: 'var(--status-active)',    bg: 'rgba(16,185,129,0.1)', border: 'var(--status-active)' },
        'Pending':     { color: 'var(--status-pending)',   bg: 'rgba(245,158,11,0.1)', border: 'var(--status-pending)' },
        'Draft':       { color: 'var(--text-tertiary)',    bg: 'var(--surface-disabled)', border: 'var(--border-default)' },
    };
    const s = map[status];
    return s
        ? { color: s.color, backgroundColor: s.bg, borderColor: s.border }
        : { color: 'var(--text-tertiary)', backgroundColor: 'var(--surface-disabled)', borderColor: 'var(--border-default)' };
}

// ── Display sub-components ─────────────────────────────────────────────────────

function SubLabel({ icon: Icon, text, accent }) {
    return (
        <div className="flex items-center gap-2 mb-4">
            <Icon size={14} style={{ color: accent ?? 'var(--brand-accent)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {text}
            </span>
        </div>
    );
}

function StatBlock({ label, value, unit }) {
    const empty = value == null || value === '';
    return (
        <div className="flex flex-col items-center justify-center p-4 rounded-xl text-center"
            style={{ backgroundColor: 'var(--background-secondary)' }}>
            <span className="text-2xl font-bold leading-none tracking-tight"
                style={{ color: empty ? 'var(--text-tertiary)' : 'var(--text-primary)' }}>
                {empty ? '—' : String(value)}
            </span>
            {unit && <span className="text-xs mt-0.5 font-medium" style={{ color: 'var(--text-secondary)' }}>{unit}</span>}
            <span className="text-xs mt-1.5 font-medium" style={{ color: 'var(--text-secondary)' }}>
                {label}
            </span>
        </div>
    );
}

function PropRow({ label, value, even }) {
    return (
        <div className="flex items-start justify-between gap-8 px-4 py-3"
            style={{ backgroundColor: even ? 'var(--background-secondary)' : 'transparent' }}>
            <span className="text-sm font-medium flex-shrink-0"
                style={{ color: 'var(--text-secondary)', minWidth: '160px' }}>
                {label}
            </span>
            <span className="text-sm font-semibold text-right"
                style={{ color: value ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                {value ? String(value) : '—'}
            </span>
        </div>
    );
}

function SpecGroupView({ group, specs, userRole }) {
    const Icon = group.icon;
    const visibleFields = group.fields.filter(f =>
        !(userRole === 'suppliers' && f.hideForSuppliers)
    );
    const populated = visibleFields.filter(f => specs[f.key] != null && specs[f.key] !== '');
    if (populated.length === 0) return null;

    const bigFields  = populated.filter(f => f.big);
    const statFields = populated.filter(f => f.stat && !f.big);
    const propFields = populated.filter(f => !f.stat && !f.big);

    return (
        <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
                <Icon size={15} style={{ color: 'var(--brand-accent)' }} />
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {group.label}
                </h3>
            </div>

            {bigFields.map(f => (
                <div key={f.key} className="mb-4">
                    <p className="text-xs font-semibold uppercase tracking-wider mb-1.5"
                        style={{ color: 'var(--text-tertiary)' }}>{f.label}</p>
                    <p className="text-base leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                        {specs[f.key] || '—'}
                    </p>
                </div>
            ))}

            {statFields.length > 0 && (
                <div className="grid gap-3 mb-3" style={{ gridTemplateColumns: `repeat(${Math.min(statFields.length, 4)}, 1fr)` }}>
                    {statFields.map(f => (
                        <StatBlock key={f.key} label={f.label} value={specs[f.key]} unit={f.unit} />
                    ))}
                </div>
            )}

            {propFields.length > 0 && (
                <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-light)' }}>
                    {propFields.map((f, i) => (
                        <PropRow key={f.key} label={f.label} value={specs[f.key]} even={i % 2 === 1} />
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Edit form field ────────────────────────────────────────────────────────────

function EditField({ label, value, onChange, required, type = 'text', options }) {
    const empty = !value && value !== 0;
    const borderColor = required && empty ? 'var(--brand-danger)' : 'var(--border-default)';
    return (
        <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>
                {label}{required && <span style={{ color: 'var(--brand-danger)' }}> *</span>}
            </label>
            {options ? (
                <select
                    value={value ?? ''}
                    onChange={e => onChange(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm border focus:outline-none focus:ring-1 focus:ring-brand-accent"
                    style={{ backgroundColor: 'var(--surface)', borderColor, color: 'var(--text-primary)' }}
                >
                    <option value="">Select…</option>
                    {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
                </select>
            ) : (
                <input
                    type={type}
                    value={value ?? ''}
                    onChange={e => onChange(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm border focus:outline-none focus:ring-1 focus:ring-brand-accent"
                    style={{ backgroundColor: 'var(--surface)', borderColor, color: 'var(--text-primary)' }}
                />
            )}
        </div>
    );
}

// ── Specs modal content ────────────────────────────────────────────────────────

function SpecsEditContent({ rfqType, specs, onChange }) {
    const groups = SPEC_GROUPS[rfqType] ?? [];
    const reqSet = new Set(REQUIRED_SPEC_FIELDS[rfqType] ?? []);
    return (
        <div className="space-y-6">
            {groups.map(group => {
                const Icon = group.icon;
                return (
                    <div key={group.id}>
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b" style={{ borderColor: 'var(--border-light)' }}>
                            <Icon size={13} style={{ color: 'var(--brand-accent)' }} />
                            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                                {group.label}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {group.fields.map(f => (
                                <div key={f.key} className={f.big ? 'sm:col-span-2' : ''}>
                                    <EditField
                                        label={f.label}
                                        value={specs[f.key]}
                                        required={reqSet.has(f.key)}
                                        type={(f.key === 'DTQ' || f.key === 'DTQB') ? 'date' : (f.stat && !f.options) ? 'number' : 'text'}
                                        options={f.options}
                                        onChange={v => onChange(f.key, v)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ── Purchases modal content ────────────────────────────────────────────────────

function PurchasesEditContent({ meta, onMetaChange, supplierIds, onAddSupplier, onRemoveSupplier, availableSuppliers, suppliersLoading, supplierSearch, onSearchChange }) {
    return (
        <div className="space-y-6">
            <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3 pb-2 border-b"
                    style={{ color: 'var(--text-tertiary)', borderColor: 'var(--border-light)' }}>
                    RFQ Details
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <EditField label="Response Deadline"    value={meta.response_deadline}    type="date"    required onChange={v => onMetaChange('response_deadline', v)} />
                    <EditField label="Shipping Terms"       value={meta.shipping_terms}       required onChange={v => onMetaChange('shipping_terms', v)} />
                    <EditField label="Quality Requirements" value={meta.quality_requirements} required onChange={v => onMetaChange('quality_requirements', v)} />
                </div>
            </div>

            <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3 pb-2 border-b"
                    style={{ color: 'var(--text-tertiary)', borderColor: 'var(--border-light)' }}>
                    Assign Suppliers
                </p>

                {supplierIds.length === 0 && (
                    <p className="text-xs mb-3" style={{ color: 'var(--brand-danger)' }}>
                        At least one supplier required to submit for approval.
                    </p>
                )}

                {supplierIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        {supplierIds.map(sid => {
                            const s = availableSuppliers.find(x => x.id === sid);
                            const label = s?.name ?? s?.username ?? `ID ${sid}`;
                            return (
                                <span key={sid} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs border"
                                    style={{ color: 'var(--status-active)', borderColor: 'var(--status-active)', backgroundColor: 'rgba(16,185,129,0.08)' }}>
                                    <Building2 size={11} />
                                    {label}
                                    <button onClick={() => onRemoveSupplier(sid)} style={{ color: 'var(--text-tertiary)' }}>
                                        <X size={11} />
                                    </button>
                                </span>
                            );
                        })}
                    </div>
                )}

                <input
                    type="text"
                    value={supplierSearch}
                    onChange={e => onSearchChange(e.target.value)}
                    placeholder={suppliersLoading ? 'Loading suppliers…' : 'Search to add a supplier…'}
                    disabled={suppliersLoading}
                    className="w-full px-3 py-2 text-sm border mb-1 focus:outline-none focus:ring-1 focus:ring-brand-accent"
                    style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                />
                <div className="max-h-40 overflow-y-auto border" style={{ borderColor: 'var(--border-light)' }}>
                    {availableSuppliers
                        .filter(s => !supplierIds.includes(s.id))
                        .filter(s => {
                            const q = supplierSearch.toLowerCase();
                            return !q || (s.name ?? '').toLowerCase().includes(q) || (s.username ?? '').toLowerCase().includes(q);
                        })
                        .map(s => (
                            <button key={s.id} onClick={() => onAddSupplier(s.id)}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-surface-hover flex justify-between items-center border-b last:border-0"
                                style={{ color: 'var(--text-primary)', borderColor: 'var(--border-light)' }}>
                                <span className="font-medium">{s.name || s.username}</span>
                                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{s.email}</span>
                            </button>
                        ))}
                    {!suppliersLoading && availableSuppliers.filter(s => !supplierIds.includes(s.id)).length === 0 && (
                        <p className="px-3 py-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>No more suppliers available.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Stage section header ───────────────────────────────────────────────────────

function StageHeader({ icon: Icon, label, accent, approved, canEdit, onEdit }) {
    return (
        <div>
            <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}60)` }} />
            <div className="flex items-center justify-between px-5 py-3.5"
                style={{ backgroundColor: 'var(--background-secondary)', borderBottom: '1px solid var(--border-light)' }}>
                <div className="flex items-center gap-2.5">
                    <Icon size={15} style={{ color: accent }} />
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {label}
                    </span>
                    {approved && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold"
                            style={{ color: 'var(--status-active)', backgroundColor: 'rgba(16,185,129,0.1)' }}>
                            <CheckCircle size={10} /> Approved
                        </span>
                    )}
                </div>
                {canEdit && (
                    <button onClick={onEdit}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors"
                        style={{ color: 'var(--brand-accent)', borderColor: 'var(--brand-accent)', backgroundColor: 'transparent' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(59,130,246,0.06)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <Edit size={12} /> Edit
                    </button>
                )}
            </div>
        </div>
    );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function RFQDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [rfqData, setRfqData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionError, setActionError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    const [modal, setModal] = useState(null); // 'specs' | 'purchases'
    const [editData, setEditData] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    const [availableSuppliers, setAvailableSuppliers] = useState([]);
    const [suppliersLoading, setSuppliersLoading] = useState(false);
    const [supplierSearch, setSupplierSearch] = useState('');

    const [expandedSupplier, setExpandedSupplier] = useState(null);

    const userRole = location.pathname.includes('/Purchases/') ? 'purchases'
        : location.pathname.includes('/Suppliers/') ? 'suppliers'
            : 'industrialization';

    const basePath = userRole === 'purchases' ? '/Purchases'
        : userRole === 'suppliers' ? '/Suppliers'
            : '/Industrialization';

    const storedUser = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
    const isAdmin = (storedUser.grupos ?? []).some(g => g.includes('_Admin') || g === 'SuperAdmin');

    // ── Data ──────────────────────────────────────────────────────────────────

    const reloadRFQ = () => {
        setLoading(true);
        setError(null);
        getRFQById(id)
            .then(setRfqData)
            .catch(err => { setError(err.message); setRfqData(null); })
            .finally(() => setLoading(false));
    };
    useEffect(() => { reloadRFQ(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

    const runAction = async (fn) => {
        setActionLoading(true);
        setActionError(null);
        try { await fn(); await reloadRFQ(); }
        catch (err) { setActionError(err.message); }
        finally { setActionLoading(false); }
    };

    // ── Modal management ──────────────────────────────────────────────────────

    const openSpecsModal = () => {
        setEditData({ specs: { ...(rfqData.stage1?.data?.specifications ?? {}) } });
        setModal('specs');
    };

    const openPurchasesModal = () => {
        setEditData({
            meta: {
                response_deadline:    rfqData.response_deadline    ?? '',
                shipping_terms:       rfqData.shipping_terms       ?? '',
                quality_requirements: rfqData.quality_requirements ?? '',
            },
            supplierIds: (rfqData.stage2?.data?.suppliers ?? []).map(s => s.id).filter(Boolean),
        });
        setSuppliersLoading(true);
        setSupplierSearch('');
        getSuppliers()
            .then(setAvailableSuppliers)
            .catch(() => {})
            .finally(() => setSuppliersLoading(false));
        setModal('purchases');
    };

    const closeModal = () => { setModal(null); setEditData({}); };

    const saveSpecs = async () => {
        setIsSaving(true);
        try {
            const payload = rfqData.type === 'mold'
                ? { mold_info_p1: editData.specs }
                : { die_trim: editData.specs };
            await saveSpecifications(rfqData.id, payload);
            closeModal();
            navigate(`${basePath}/Drafts`);
        } catch (err) { alert(`Save failed: ${err.message}`); }
        finally { setIsSaving(false); }
    };

    const saveAndSubmitSpecs = async () => {
        setIsSaving(true);
        try {
            const payload = rfqData.type === 'mold'
                ? { mold_info_p1: editData.specs }
                : { die_trim: editData.specs };
            await saveSpecifications(rfqData.id, payload);
            await submitRFQForReview(rfqData.id, rfqData.type, rfqData.title ?? '');
            closeModal();
            navigate(`${basePath}/All-RFQ`);
        } catch (err) { alert(`Submit failed: ${err.message}`); }
        finally { setIsSaving(false); }
    };

    const savePurchases = async (isDraft) => {
        setIsSaving(true);
        try {
            await savePurchasesMetadata(rfqData.id, editData.meta);
            await assignSuppliers(rfqData.id, editData.supplierIds ?? [], isDraft);
            closeModal();
            navigate(isDraft ? `${basePath}/Drafts` : `${basePath}/All-RFQ`);
        } catch (err) { alert(`Save failed: ${err.message}`); }
        finally { setIsSaving(false); }
    };

    // ── Derived ───────────────────────────────────────────────────────────────

    const stage1RequiredFilled = () => {
        const s = editData.specs ?? {};
        return (REQUIRED_SPEC_FIELDS[rfqData?.type] ?? []).every(f => s[f] && String(s[f]).trim());
    };

    const purchasesAllFilled = () => {
        const { meta = {}, supplierIds = [] } = editData;
        return meta.response_deadline && meta.shipping_terms && meta.quality_requirements && supplierIds.length > 0;
    };

    const shouldShowQuoteForm = () => {
        if (userRole !== 'suppliers' || !rfqData) return false;
        return rfqData.status === STATUS.SENT_TO_SUPPLIERS
            || rfqData.status === STATUS.WAITING_FOR_SUPPLIERS;
    };

    // ── Guards ────────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background-secondary)' }}>
                <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-t-transparent mx-auto mb-3"
                        style={{ borderColor: 'var(--brand-accent)', borderTopColor: 'transparent' }} />
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading RFQ…</p>
                </div>
            </div>
        );
    }

    if (!rfqData) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background-secondary)' }}>
                <div className="text-center">
                    <Package size={48} style={{ color: 'var(--text-tertiary)' }} />
                    <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>{error ?? 'RFQ not found'}</p>
                    <button onClick={() => navigate(-1)} className="mt-4 text-sm" style={{ color: 'var(--brand-accent)' }}>Go Back</button>
                </div>
            </div>
        );
    }

    const typeColor = rfqData.type === 'mold'
        ? { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.35)' }
        : { color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.35)' };

    const priorityMap = { High: 'var(--priority-high)', Critical: 'var(--priority-high)', Medium: 'var(--priority-medium)', Low: 'var(--priority-low)' };
    const specs    = rfqData.stage1?.data?.specifications ?? {};
    const specGroups = SPEC_GROUPS[rfqData.type] ?? [];

    const canEditStage1 = userRole === 'industrialization'
        && (rfqData.status === STATUS.IND_DRAFT);
    const canEditStage2 = userRole === 'purchases'
        && (rfqData.status === STATUS.SENT_TO_PURCHASES || rfqData.status === STATUS.PURCHASES_DRAFT);

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--background-secondary)' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* ── Header ─────────────────────────────────────────────── */}
                <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
                    <div className="flex items-start gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 mt-1 rounded-full transition-colors"
                            style={{ color: 'var(--text-secondary)' }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--surface-hover)'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full"
                                    style={{ color: typeColor.color, backgroundColor: typeColor.bg }}>
                                    <Factory size={10} /> {rfqData.type}
                                </span>
                                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full" style={getStatusStyle(rfqData.status)}>
                                    {STATUS_LABEL[rfqData.status] ?? rfqData.status}
                                </span>
                                {rfqData.submitted_for_review && (
                                    <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded-full"
                                        style={{ color: 'var(--status-pending)', backgroundColor: 'rgba(245,158,11,0.1)' }}>
                                        Pending Review
                                    </span>
                                )}
                                {rfqData.priority && (
                                    <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full"
                                        style={{ color: priorityMap[rfqData.priority] ?? 'var(--text-tertiary)', backgroundColor: `${priorityMap[rfqData.priority] ?? 'var(--text-tertiary)'}1a` }}>
                                        {rfqData.priority}
                                    </span>
                                )}
                            </div>
                            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{rfqData.title}</h1>
                            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                                RFQ #{rfqData.id} · Last modified: {rfqData.lastModified} · Created by: {rfqData.createdBy}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Winner banner ───────────────────────────────────────── */}
                {userRole === 'suppliers' && rfqData.is_winner && (
                    <div className="mb-6 px-5 py-4 rounded-2xl border"
                        style={{ backgroundColor: 'rgba(16,185,129,0.06)', borderColor: 'rgba(16,185,129,0.25)' }}>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--status-active)' }}>
                            Award Notification
                        </p>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                            BOCAR Group has selected your quotation for this RFQ. A representative from the Purchases team will reach out to finalize the terms of the agreement.
                        </p>
                    </div>
                )}

                <div className="space-y-5">

                    {/* ─── Stage 1: Industrialization ─────────────────────── */}
                    {rfqData.stage1 && (
                        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-light)', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                            <StageHeader
                                icon={Factory} label="Industrialization" accent="#38bdf8"
                                approved={!!rfqData.stage1.approvedBy}
                                canEdit={canEditStage1}
                                onEdit={openSpecsModal}
                            />
                            <div className="p-5 space-y-6">
                                <div>
                                    <SubLabel icon={Layers} text="Specifications" accent="#38bdf8" />
                                    {specGroups.length > 0
                                        ? specGroups.map(group => (
                                            <SpecGroupView key={group.id} group={group} specs={specs} userRole={userRole} />
                                        ))
                                        : Object.keys(specs).length === 0
                                            ? <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No specifications recorded yet.{canEditStage1 && <> Click <strong>Edit</strong> to add them.</>}</p>
                                            : (
                                                <div className="border overflow-hidden" style={{ borderColor: 'var(--border-light)' }}>
                                                    {Object.entries(specs)
                                                        .filter(([k]) => !(userRole === 'suppliers' && ['CUST', 'ELAB'].includes(k)))
                                                        .map(([k, v], i) => <PropRow key={k} label={k} value={v} even={i % 2 === 1} />)}
                                                </div>
                                            )
                                    }
                                </div>

                                <div>
                                    <SubLabel icon={FileText} text="Attached Documents" accent="#38bdf8" />
                                    {(rfqData.stage1.data.documents ?? []).length === 0
                                        ? <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No documents attached.</p>
                                        : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {rfqData.stage1.data.documents.map(doc => (
                                                    <div key={doc.id} className="rounded-xl border p-3 hover:shadow-md transition-all"
                                                        style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--surface)' }}>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            {doc.is3D ? <Package size={14} style={{ color: 'var(--brand-accent)' }} /> : <FileText size={14} style={{ color: 'var(--text-tertiary)' }} />}
                                                            <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{doc.name}</span>
                                                        </div>
                                                        <p className="text-[10px] mb-2" style={{ color: 'var(--text-tertiary)' }}>{doc.date} · {doc.uploadedBy}</p>
                                                        <button className="text-xs flex items-center gap-1" style={{ color: 'var(--brand-accent)' }}
                                                            onClick={() => downloadDocument(rfqData.id, doc.id, doc.name).catch(e => alert(e.message))}>
                                                            <Download size={11} /> Download
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                    }
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─── Stage 2: Purchases ─────────────────────────────── */}
                    {rfqData.stage2 && userRole !== 'suppliers' && (
                        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-light)', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                            <StageHeader
                                icon={ShoppingCart} label="Purchases" accent="#4ade80"
                                approved={false}
                                canEdit={canEditStage2}
                                onEdit={openPurchasesModal}
                            />
                            <div className="p-5 space-y-5">
                                {rfqData?.ia_predictions?.predictions && (
                                    <IARecommendations data={rfqData.ia_predictions.predictions} />
                                )}

                                {(rfqData.response_deadline || rfqData.shipping_terms || rfqData.quality_requirements) && (
                                    <div>
                                        <SubLabel icon={Info} text="RFQ Details" accent="#4ade80" />
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            {[
                                                { label: 'Response Deadline',    value: rfqData.response_deadline },
                                                { label: 'Shipping Terms',       value: rfqData.shipping_terms },
                                                { label: 'Quality Requirements', value: rfqData.quality_requirements },
                                            ].filter(x => x.value).map(({ label, value }) => (
                                                <div key={label} className="p-4 rounded-xl"
                                                    style={{ backgroundColor: 'var(--background-secondary)' }}>
                                                    <span className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                                                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <SubLabel icon={Building2} text="Assigned Suppliers" accent="#4ade80" />
                                    {(rfqData.stage2.data.suppliers ?? []).length === 0
                                        ? <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No suppliers assigned yet.</p>
                                        : (
                                            <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-light)' }}>
                                                {rfqData.stage2.data.suppliers.map((s, i) => (
                                                    <div key={s.id ?? i}
                                                        className="flex items-center justify-between px-4 py-3 border-b last:border-0"
                                                        style={{ borderColor: 'var(--border-light)', backgroundColor: i % 2 === 1 ? 'var(--background-secondary)' : 'var(--surface)' }}>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                                                style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-accent))', color: '#fff' }}>
                                                                {(s.name ?? '?').charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{s.name}</p>
                                                                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{s.email || 'No email'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            {s.has_responded && (
                                                                <span className="text-xs flex items-center gap-1" style={{ color: 'var(--status-active)' }}>
                                                                    <CheckCircle size={11} /> Responded
                                                                </span>
                                                            )}
                                                            <span className="px-2.5 py-0.5 text-xs rounded-full font-medium" style={getStatusStyle(s.status)}>{s.status}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                    }
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─── Stage 3: Supplier Responses / Quote Form ───────── */}
                    {(rfqData.stage3 || shouldShowQuoteForm()) && (
                        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-light)', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                            <div>
                                <div className="h-0.5" style={{ background: 'linear-gradient(90deg, #fb923c, #fb923c60)' }} />
                                <div className="flex items-center gap-2.5 px-5 py-3.5"
                                    style={{ backgroundColor: 'var(--background-secondary)', borderBottom: '1px solid var(--border-light)' }}>
                                <Users size={15} style={{ color: '#fb923c' }} />
                                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                    {shouldShowQuoteForm() ? 'Submit Your Quote' : 'Supplier Responses'}
                                </span>
                                {rfqData.stage3?.data?.statistics && !shouldShowQuoteForm() && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full ml-2"
                                        style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--background-tertiary)' }}>
                                        {rfqData.stage3.data.statistics.responsesReceived ?? 0} / {rfqData.stage3.data.statistics.totalInvited ?? 0} replied
                                    </span>
                                )}
                                </div>
                            </div>

                            <div className="p-5">
                                {shouldShowQuoteForm() ? (
                                    <QuoteForm
                                        rfqId={rfqData.id}
                                        rfqType={rfqData.type}
                                        existingResponses={rfqData.stage3?.data?.responses ?? []}
                                        onSubmitSuccess={() => navigate('/Suppliers/All-RFQ')}
                                    />
                                ) : rfqData.stage3 && (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {(rfqData.stage3.data.responses ?? []).map(response => {
                                            const expanded = expandedSupplier === response.supplier;
                                            const canSelectWinner = userRole === 'purchases'
                                                && rfqData.status === STATUS.WAITING_FOR_SUPPLIERS;
                                            return (
                                                <div key={response.supplier} className="rounded-xl overflow-hidden transition-all"
                                                    style={{
                                                        border: `1px solid ${expanded ? 'var(--brand-accent)' : 'var(--border-light)'}`,
                                                        boxShadow: expanded ? '0 4px 16px rgba(59,130,246,0.12)' : '0 1px 4px rgba(0,0,0,0.04)',
                                                    }}>
                                                    <div className="flex justify-between items-start p-4">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                                                                style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-accent))', color: '#fff' }}>
                                                                {(response.supplier ?? '?').charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{response.supplier}</p>
                                                                <span className="px-2 py-0.5 text-xs border" style={getStatusStyle(response.status)}>{response.status}</span>
                                                            </div>
                                                        </div>
                                                        {canSelectWinner && (
                                                            <button
                                                                disabled={actionLoading}
                                                                onClick={() => {
                                                                    const supplierId = rfqData.stage2?.data?.suppliers?.find(
                                                                        s => s.name === response.supplier || s.username === response.supplier
                                                                    )?.id;
                                                                    if (!supplierId) { setActionError('Could not identify supplier ID.'); return; }
                                                                    runAction(() => selectWinner(rfqData.id, supplierId));
                                                                }}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors"
                                                                style={{ color: 'var(--status-active)', borderColor: 'var(--status-active)', backgroundColor: 'rgba(16,185,129,0.06)' }}
                                                                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(16,185,129,0.14)'}
                                                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(16,185,129,0.06)'}
                                                            >
                                                                <CheckCircle size={13} /> Select Winner
                                                            </button>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => setExpandedSupplier(expanded ? null : response.supplier)}
                                                        className="w-full py-2 text-sm border-t flex items-center justify-center gap-1.5"
                                                        style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-light)', backgroundColor: 'var(--surface-hover)' }}>
                                                        {expanded ? <><ChevronUp size={13} /> Hide</> : <><ChevronDown size={13} /> View Cost Summary</>}
                                                    </button>
                                                    {expanded && (
                                                        <div className="p-4 border-t" style={{ borderColor: 'var(--border-light)' }}>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                {rfqData.type === 'mold' ? (
                                                                    <>
                                                                        <StatBlock label="Material"      value={`$${Number((response.info1 ?? {}).MatCst_M1_PrBd ?? 0).toLocaleString()}`} />
                                                                        <StatBlock label="Manufacturing" value={`$${Number((response.info1 ?? {}).ManCst_M1_PrBd ?? 0).toLocaleString()}`} />
                                                                        <StatBlock label="Logistics"     value={`$${Number((response.info1 ?? {}).LogCst_M1_PrBd ?? 0).toLocaleString()}`} />
                                                                        <StatBlock label="Grand Total"   value={`$${Number((response.info1 ?? {}).GrTot_M1_PrBd ?? 0).toLocaleString()}`} />
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <StatBlock label="Material"      value={`$${Number((response.info1 ?? {}).MatCst_TD1_PrBd ?? 0).toLocaleString()}`} />
                                                                        <StatBlock label="Manufacturing" value={`$${Number((response.info1 ?? {}).ManuCst_TD1_PrBd ?? 0).toLocaleString()}`} />
                                                                        <StatBlock label="Logistics"     value={`$${Number((response.info1 ?? {}).Logis_TD1_PrBd ?? 0).toLocaleString()}`} />
                                                                        <StatBlock label="Grand Total"   value={`$${Number((response.info1 ?? {}).GrTotal_TD1_PrBd ?? 0).toLocaleString()}`} />
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {(rfqData.stage3.data.responses ?? []).length === 0 && (
                                            <p className="col-span-2 text-sm py-4" style={{ color: 'var(--text-tertiary)' }}>No supplier responses yet.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ─── Action errors + Action bar ─────────────────────── */}
                    {actionError && (
                        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                            style={{ color: 'var(--brand-danger)', backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                            <AlertCircle size={15} /> {actionError}
                        </div>
                    )}
                    <ActionBar rfqData={rfqData} userRole={userRole} isAdmin={isAdmin} loading={actionLoading} onAction={runAction} />
                </div>
            </div>

            {/* ─── Specs Edit Modal ───────────────────────────────────── */}
            {rfqData && (
                <Modal open={modal === 'specs'} onClose={closeModal}
                    title={`Edit Specifications — ${rfqData.type === 'mold' ? 'Mold' : 'Trim Die'}`}
                    size="xl">
                    <SpecsEditContent
                        rfqType={rfqData.type}
                        specs={editData.specs ?? {}}
                        onChange={(key, val) => setEditData(prev => ({ ...prev, specs: { ...prev.specs, [key]: val } }))}
                    />
                    <div className="flex justify-end gap-2 mt-6 pt-4 border-t" style={{ borderColor: 'var(--border-default)' }}>
                        <Button variant="outline" onClick={closeModal} disabled={isSaving}>Cancel</Button>
                        <Button variant="outline" onClick={saveSpecs} disabled={isSaving}>
                            {isSaving ? 'Saving…' : 'Save Changes'}
                        </Button>
                        {rfqData.status === STATUS.IND_DRAFT && userRole === 'industrialization' && stage1RequiredFilled() && (
                            <Button variant="primary" onClick={saveAndSubmitSpecs} disabled={isSaving}>
                                {isSaving ? 'Submitting…' : 'Save & Submit for Approval'}
                            </Button>
                        )}
                    </div>
                </Modal>
            )}

            {/* ─── Purchases Edit Modal ───────────────────────────────── */}
            {rfqData && (
                <Modal open={modal === 'purchases'} onClose={closeModal} title="Edit Purchases Details" size="lg">
                    <PurchasesEditContent
                        meta={editData.meta ?? {}}
                        onMetaChange={(k, v) => setEditData(prev => ({ ...prev, meta: { ...prev.meta, [k]: v } }))}
                        supplierIds={editData.supplierIds ?? []}
                        onAddSupplier={sid => setEditData(prev => ({ ...prev, supplierIds: [...(prev.supplierIds ?? []), sid] }))}
                        onRemoveSupplier={sid => setEditData(prev => ({ ...prev, supplierIds: (prev.supplierIds ?? []).filter(x => x !== sid) }))}
                        availableSuppliers={availableSuppliers}
                        suppliersLoading={suppliersLoading}
                        supplierSearch={supplierSearch}
                        onSearchChange={setSupplierSearch}
                    />
                    <div className="flex justify-end gap-2 mt-6 pt-4 border-t" style={{ borderColor: 'var(--border-default)' }}>
                        <Button variant="outline" onClick={closeModal} disabled={isSaving}>Cancel</Button>
                        <Button variant="outline" onClick={() => savePurchases(true)} disabled={isSaving}>
                            {isSaving ? 'Saving…' : 'Save as Draft'}
                        </Button>
                        {purchasesAllFilled() && (
                            <Button variant="primary" onClick={() => savePurchases(false)} disabled={isSaving}>
                                {isSaving ? 'Submitting…' : 'Submit for Approval'}
                            </Button>
                        )}
                    </div>
                </Modal>
            )}
        </div>
    );
}

// ── ActionBar ──────────────────────────────────────────────────────────────────

function ActionBar({ rfqData, userRole, isAdmin, loading, onAction }) {
    if (!rfqData) return null;
    const { status, submitted_for_review, type, title, id } = rfqData;
    const actions = [];

    if (userRole === 'industrialization') {
        if (status === STATUS.IND_DRAFT && !submitted_for_review && !isAdmin)
            actions.push(
                <Button key="submit" disabled={loading}
                    onClick={() => onAction(() => submitRFQForReview(id, type, title ?? ''))}>
                    {loading ? 'Working…' : 'Submit for Approval'}
                </Button>
            );
        if (status === STATUS.IND_DRAFT && submitted_for_review && !isAdmin)
            actions.push(
                <span key="wait" className="text-sm flex items-center gap-1.5" style={{ color: 'var(--text-tertiary)' }}>
                    <Clock size={14} /> Waiting for Ind. Admin review
                </span>
            );
        if (status === STATUS.IND_DRAFT && submitted_for_review && isAdmin) {
            actions.push(
                <Button key="approve" disabled={loading}
                    onClick={() => onAction(() => approveRFQInd(id, true))}>
                    {loading ? 'Working…' : 'Approve — Send to Purchases'}
                </Button>,
                <Button key="reject" variant="outline" disabled={loading}
                    onClick={() => onAction(() => approveRFQInd(id, false))}>
                    Reject
                </Button>
            );
        }
    }

    if (userRole === 'purchases') {
        if (isAdmin && status === STATUS.PURCHASES_DRAFT && submitted_for_review) {
            actions.push(
                <Button key="approve" disabled={loading}
                    onClick={() => onAction(() => approveSupplierList(id, 'aprobar'))}>
                    {loading ? 'Working…' : 'Approve — Publish to Suppliers'}
                </Button>,
                <Button key="reject" variant="outline" disabled={loading}
                    onClick={() => onAction(() => approveSupplierList(id, 'rechazar'))}>
                    Reject
                </Button>
            );
        }
        if (!isAdmin && status === STATUS.PURCHASES_DRAFT && submitted_for_review)
            actions.push(
                <span key="wait" className="text-sm flex items-center gap-1.5" style={{ color: 'var(--text-tertiary)' }}>
                    <Clock size={14} /> Waiting for Purchases Admin approval
                </span>
            );
        if (isAdmin && status === STATUS.SUPPLIER_SELECTED) {
            actions.push(
                <Button key="award" disabled={loading}
                    onClick={() => onAction(() => finalManagerDecision(id, 'aprobar'))}>
                    {loading ? 'Working…' : 'Final Award — Close RFQ'}
                </Button>,
                <Button key="reevaluate" variant="outline" disabled={loading}
                    onClick={() => onAction(() => finalManagerDecision(id, 'rechazar'))}>
                    Re-evaluate
                </Button>
            );
        }
        if (!isAdmin && status === STATUS.SUPPLIER_SELECTED)
            actions.push(
                <span key="wait-award" className="text-sm flex items-center gap-1.5" style={{ color: 'var(--text-tertiary)' }}>
                    <Clock size={14} /> Waiting for Purchases Admin final award
                </span>
            );
    }

    if (actions.length === 0) return null;
    return (
        <div className="pt-4 border-t" style={{ borderColor: 'var(--border-default)' }}>
            <div className="flex flex-wrap gap-3 justify-end">{actions}</div>
        </div>
    );
}
