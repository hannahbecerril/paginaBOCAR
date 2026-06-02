// sections/Suppliers/QuoteForm.jsx
// Full cost-breakdown quote form for suppliers. Mirrors the backend MOLD_COSTBR_P*_S / DIE_COSTBR_P*_S models.
import { useState } from 'react';
import { Save, Send, ChevronRight } from 'lucide-react';
import Button from '../../components/ui/Button';
import { submitQuote } from '../api';

// ── Schema definitions ────────────────────────────────────────────────────────
// Each entry: { key: backend field prefix, label: display name, suffix: column suffix style }
// suffix 'unit' → _Unit / _PriceUnit / _Total / _Weeks
// suffix 'h'    → _h   / _PriceH   / _Total / _Weeks

const MOLD_P1_HEADER = [
    { key: 'Company',      label: 'Company',       type: 'text' },
    { key: 'Country',      label: 'Country',       type: 'text' },
    { key: 'Base_currency',label: 'Currency',      type: 'text' },
];

const MOLD_P1_ITEMS = [
    { prefix: 'ParkerHydraulicCylindersSquaresSwitches', label: 'Parker Cylinders',      suffix: 'unit' },
    { prefix: 'JetCooling',                              label: 'Jet Cooling',            suffix: 'unit' },
    { prefix: 'SqueezePin',                              label: 'Squeeze Pin',            suffix: 'unit' },
    { prefix: 'InterchangeableInserts',                  label: 'Interchangeable Inserts',suffix: 'unit' },
    { prefix: 'ChillBlocks',                             label: 'Chill Blocks',           suffix: 'unit' },
    { prefix: 'Eyebolts',                                label: 'Eyebolts',               suffix: 'unit' },
    { prefix: 'OilWaterConnectors',                      label: 'Oil/Water Connectors',   suffix: 'unit' },
    { prefix: 'LethiguelDistributor',                    label: 'Lethiguel Distributor',  suffix: 'unit' },
    { prefix: 'OthersAccesoriesCost',                    label: 'Others (Accessories)',   suffix: 'unit' },
    { prefix: 'TotalAccesoriesCost',                     label: 'TOTAL ACCESSORIES',      suffix: 'unit', isTotal: true },
];

const MOLD_P2_MATERIALS = [
    { prefix: 'DieFrame',            label: 'Die Frame',            suffix: 'unit' },
    { prefix: 'Cavity',              label: 'Cavity',               suffix: 'unit' },
    { prefix: 'SteelPipesTubes',     label: 'Steel Pipes & Tubes',  suffix: 'unit' },
    { prefix: 'OthersMaterialCosts', label: 'Others (Materials)',   suffix: 'unit' },
    { prefix: 'TotalMaterialCosts',  label: 'TOTAL MATERIALS',      suffix: 'unit', isTotal: true },
];

const MOLD_P2_MACHINING = [
    { prefix: 'Milling',         label: 'Milling',          suffix: 'h' },
    { prefix: 'Turning',         label: 'Turning',          suffix: 'h' },
    { prefix: 'WireCutting',     label: 'Wire Cutting',     suffix: 'h' },
    { prefix: 'EDM',             label: 'EDM',              suffix: 'h' },
    { prefix: 'Grinding',        label: 'Grinding',         suffix: 'h' },
    { prefix: 'Drillling',       label: 'Drilling',         suffix: 'h' },
    { prefix: 'OthersMachining', label: 'Others (Machining)',suffix: 'h' },
    { prefix: 'TotalMachining',  label: 'TOTAL MACHINING',  suffix: 'h', isTotal: true },
];

const MOLD_P3_MANUAL = [
    { prefix: 'Assembly',          label: 'Assembly',           suffix: 'h' },
    { prefix: 'Spotting',          label: 'Spotting',           suffix: 'h' },
    { prefix: 'StrippingAndPol',   label: 'Stripping & Polishing',suffix: 'h' },
    { prefix: 'OthersManualWork',  label: 'Others (Manual)',    suffix: 'h' },
    { prefix: 'TotalManualWork',   label: 'TOTAL MANUAL WORK', suffix: 'h', isTotal: true },
];

const MOLD_P3_HEAT = [
    { prefix: 'Hardening',         label: 'Hardening',          suffix: 'h' },
    { prefix: 'Nitriding',         label: 'Nitriding',          suffix: 'h' },
    { prefix: 'Coating',           label: 'Coating',            suffix: 'h' },
    { prefix: 'Graining',          label: 'Graining',           suffix: 'h' },
    { prefix: 'OthersHeatSurface', label: 'Others (Heat/Surface)',suffix: 'h' },
    { prefix: 'TotalHeatSurface',  label: 'TOTAL HEAT/SURFACE', suffix: 'h', isTotal: true },
];

const MOLD_P3_ENGINEERING = [
    { prefix: 'Design',                label: 'Design',             suffix: 'h' },
    { prefix: 'CamNcProg',             label: 'CAM/NC Programming', suffix: 'h' },
    { prefix: 'Simulation',            label: 'Simulation',         suffix: 'h' },
    { prefix: 'OthersEngAndDesign',    label: 'Others (Engineering)',suffix: 'h' },
    { prefix: 'TotalEngAndDesign',     label: 'TOTAL ENGINEERING',  suffix: 'h', isTotal: true },
    { prefix: 'GrandTotalManufacCost', label: '★ GRAND TOTAL MFG',  suffix: 'h', isTotal: true },
];

const MOLD_P4_CORRECTIONS = [
    { prefix: 'MeasureMold',         label: 'Measure Mold',         suffix: 'h' },
    { prefix: 'DimensionalCorrect',  label: 'Dimensional Corrections',suffix: 'h' },
    { prefix: 'Optimizations',       label: 'Optimizations',        suffix: 'h' },
    { prefix: 'OthersCorrectOpt',    label: 'Others (Corrections)', suffix: 'h' },
    { prefix: 'TotalCorrectOpt',     label: 'TOTAL CORRECTIONS',    suffix: 'h', isTotal: true },
];

const MOLD_P4_LOGISTICS = [
    { prefix: 'TransportSuppToBTC', label: 'Transport Supp→BTC',   suffix: 'unit' },
    { prefix: 'TransportBTCtoSupp', label: 'Transport BTC→Supp',   suffix: 'unit' },
    { prefix: 'DutyCosts',          label: 'Duty Costs',           suffix: 'unit' },
    { prefix: 'CleaningPack',       label: 'Cleaning & Packaging', suffix: 'unit' },
    { prefix: 'OthersLogistics',    label: 'Others (Logistics)',   suffix: 'unit' },
    { prefix: 'TotalLogistics',     label: 'TOTAL LOGISTICS',      suffix: 'unit', isTotal: true },
];

const MOLD_P5_SAMPLING = [
    { prefix: 'TryoutCost',    label: 'Tryout Cost',    suffix: 'q' },
    { prefix: 'Measurement',   label: 'Measurement',    suffix: 'q' },
    { prefix: 'OthersSampling',label: 'Others (Sampling)',suffix: 'q' },
    { prefix: 'TotalSampling', label: 'TOTAL SAMPLING', suffix: 'q', isTotal: true },
];

const MOLD_P5_SPARE = [
    { prefix: 'InterchangeInserts',  label: 'Interchange Inserts',  suffix: 'unit' },
    { prefix: 'CorePins',            label: 'Core Pins',            suffix: 'unit' },
    { prefix: 'InsertsSparePart',    label: 'Insert Spare Parts',   suffix: 'unit' },
    { prefix: 'OthersSpareParts',    label: 'Others (Spare Parts)', suffix: 'unit' },
    { prefix: 'TotalSpareParts',     label: 'TOTAL SPARE PARTS',    suffix: 'unit', isTotal: true },
];

const DIE_P1_HEADER = [
    { key: 'Company',       label: 'Company',        type: 'text' },
    { key: 'Country',       label: 'Country',        type: 'text' },
    { key: 'Base_currency', label: 'Currency',       type: 'text' },
    { key: 'Exchange_rate', label: 'Exchange Rate',  type: 'text' },
];

const DIE_P1_MATERIALS = [
    { prefix: 'RawMat',        label: 'Raw Materials',    suffix: 'unit' },
    { prefix: 'OthMat',        label: 'Other Materials',  suffix: 'unit' },
    { prefix: 'TotalMatCost',  label: 'TOTAL MATERIALS',  suffix: 'unit', isTotal: true },
];

const DIE_P1_ACCESSORIES = [
    { prefix: 'MerkCyl',     label: 'Merk Cylinders',      suffix: 'unit' },
    { prefix: 'TeleLimit',   label: 'Tele-Limitators',     suffix: 'unit' },
    { prefix: 'SensIFM',     label: 'IFM Sensors',         suffix: 'unit' },
    { prefix: 'AirDevi',     label: 'Air Devices',         suffix: 'unit' },
    { prefix: 'OthAccCst',   label: 'Others (Accessories)',suffix: 'unit' },
    { prefix: 'TotalAccCst', label: 'TOTAL ACCESSORIES',   suffix: 'unit', isTotal: true },
];

const DIE_P2_MACHINING = [
    { prefix: 'Mill',           label: 'Milling',           suffix: 'h' },
    { prefix: 'Turn',           label: 'Turning',           suffix: 'h' },
    { prefix: 'Wirecut',        label: 'Wire Cutting',      suffix: 'h' },
    { prefix: 'EDM',            label: 'EDM',               suffix: 'h' },
    { prefix: 'Grind',          label: 'Grinding',          suffix: 'h' },
    { prefix: 'Drill',          label: 'Drilling',          suffix: 'h' },
    { prefix: 'OthMachin',      label: 'Others (Machining)',suffix: 'h' },
    { prefix: 'TotalMachinCst', label: 'TOTAL MACHINING',   suffix: 'h', isTotal: true },
];

const DIE_P2_MANUAL = [
    { prefix: 'Assem',       label: 'Assembly',          suffix: 'h' },
    { prefix: 'Spot',        label: 'Spotting',          suffix: 'h' },
    { prefix: 'StripPolish', label: 'Strip & Polish',    suffix: 'h' },
    { prefix: 'OthManual',   label: 'Others (Manual)',   suffix: 'h' },
    { prefix: 'TotalManuWk', label: 'TOTAL MANUAL WORK', suffix: 'h', isTotal: true },
];

// ── Helper: get field keys from prefix + suffix style ─────────────────────────
function getFieldKeys(prefix, suffix) {
    if (suffix === 'h')    return [`${prefix}_h`,    `${prefix}_PriceH`,    `${prefix}_Total`, `${prefix}_Weeks`];
    if (suffix === 'q')    return [`${prefix}_Q`,    `${prefix}_PriceQ`,    `${prefix}_Total`, `${prefix}_Weeks`];
    return                        [`${prefix}_Unit`,  `${prefix}_PriceUnit`, `${prefix}_Total`, `${prefix}_Weeks`];
}

// ── Cost row component ────────────────────────────────────────────────────────
function CostRow({ item, data, onChange }) {
    const [k1, k2, k3, k4] = getFieldKeys(item.prefix, item.suffix);
    const labelFor = (k) => k.replace(item.prefix + '_', '').replace('H', '/h').replace('Unit', '/unit').replace('PriceH', 'Price/h').replace('PriceUnit', 'Price/unit').replace('PriceQ', 'Price/q').replace('Q', 'Qty');
    const rowStyle = item.isTotal
        ? { backgroundColor: 'var(--background-tertiary)', fontWeight: 600 }
        : {};

    const numField = (k) => (
        <td key={k} className="px-2 py-1.5">
            <input
                type="number"
                step="0.01"
                value={data[k] ?? ''}
                onChange={e => onChange(k, e.target.value === '' ? null : parseFloat(e.target.value))}
                className="w-full px-2 py-1 text-sm border border-border-default bg-surface focus:outline-none focus:ring-1 focus:ring-brand-accent"
                style={{ color: 'var(--text-primary)' }}
            />
        </td>
    );

    return (
        <tr style={rowStyle} className="border-b border-border-light">
            <td className="px-3 py-1.5 text-sm" style={{ color: 'var(--text-primary)', minWidth: '200px' }}>{item.label}</td>
            {numField(k1)}
            {numField(k2)}
            {numField(k3)}
            {numField(k4)}
        </tr>
    );
}

// ── Section table ─────────────────────────────────────────────────────────────
function SectionTable({ title, items, data, onChange }) {
    const col1 = items[0]?.suffix === 'h' ? 'Hours' : (items[0]?.suffix === 'q' ? 'Qty' : 'Units');
    const col2 = items[0]?.suffix === 'h' ? 'Price/h' : (items[0]?.suffix === 'q' ? 'Price/q' : 'Price/unit');
    return (
        <div className="mb-6">
            {title && (
                <h4 className="text-xs font-semibold uppercase tracking-wider mb-2 pb-1 border-b" style={{ color: 'var(--text-tertiary)', borderColor: 'var(--border-default)' }}>
                    {title}
                </h4>
            )}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead style={{ backgroundColor: 'var(--background-tertiary)' }}>
                        <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Item</th>
                            <th className="px-2 py-2 text-left text-xs font-medium" style={{ color: 'var(--text-tertiary)', width: '100px' }}>{col1}</th>
                            <th className="px-2 py-2 text-left text-xs font-medium" style={{ color: 'var(--text-tertiary)', width: '100px' }}>{col2}</th>
                            <th className="px-2 py-2 text-left text-xs font-medium" style={{ color: 'var(--text-tertiary)', width: '110px' }}>Total</th>
                            <th className="px-2 py-2 text-left text-xs font-medium" style={{ color: 'var(--text-tertiary)', width: '80px' }}>Weeks</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(item => (
                            <CostRow key={item.prefix} item={item} data={data} onChange={onChange} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ── Header fields ─────────────────────────────────────────────────────────────
function HeaderFields({ fields, data, onChange }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 p-3 border border-border-default" style={{ backgroundColor: 'var(--background-tertiary)' }}>
            {fields.map(f => (
                <div key={f.key}>
                    <label className="text-xs uppercase tracking-wider block mb-1" style={{ color: 'var(--text-tertiary)' }}>{f.label}</label>
                    <input
                        type={f.type ?? 'text'}
                        value={data[f.key] ?? ''}
                        onChange={e => onChange(f.key, e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-border-default bg-surface focus:outline-none focus:ring-1 focus:ring-brand-accent"
                        style={{ color: 'var(--text-primary)' }}
                    />
                </div>
            ))}
        </div>
    );
}

// ── Main form component ───────────────────────────────────────────────────────
export default function QuoteForm({ rfqId, rfqType, existingResponses = [], onSubmitSuccess }) {
    const [activeTab, setActiveTab] = useState(0);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Initialise form data from existing backend response (p1, p2, … fields)
    const seed = existingResponses[0] ?? {};
    const [formData, setFormData] = useState({
        p1: seed.p1 ?? {},
        p2: seed.p2 ?? {},
        p3: seed.p3 ?? {},
        p4: seed.p4 ?? {},
        p5: seed.p5 ?? {},
    });

    const setField = (part) => (key, value) =>
        setFormData(prev => ({ ...prev, [part]: { ...prev[part], [key]: value } }));

    const handleSubmit = async (isDraft) => {
        setSaving(true);
        setError(null);
        setSuccess(null);
        try {
            let payload;
            if (rfqType === 'mold') {
                payload = {
                    is_draft: isDraft,
                    mold_cost_p1: formData.p1,
                    mold_cost_p2: formData.p2,
                    mold_cost_p3: formData.p3,
                    mold_cost_p4: formData.p4,
                    mold_cost_p5: formData.p5,
                };
            } else {
                payload = {
                    is_draft: isDraft,
                    die_cost_p1: formData.p1,
                    die_cost_p2: formData.p2,
                    die_cost_p3: formData.p3,
                    die_cost_p4: formData.p4,
                };
            }
            await submitQuote(rfqId, payload);
            setSuccess(isDraft ? 'Quote saved as draft.' : 'Quote submitted successfully!');
            if (!isDraft && onSubmitSuccess) onSubmitSuccess();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    // ── Tab definitions ───────────────────────────────────────────────────────
    const moldTabs = [
        {
            label: 'P1 – Accessories',
            render: () => (
                <>
                    <HeaderFields fields={MOLD_P1_HEADER} data={formData.p1} onChange={setField('p1')} />
                    <SectionTable title="Accessories" items={MOLD_P1_ITEMS} data={formData.p1} onChange={setField('p1')} />
                </>
            ),
        },
        {
            label: 'P2 – Materials & Machining',
            render: () => (
                <>
                    <SectionTable title="Materials" items={MOLD_P2_MATERIALS} data={formData.p2} onChange={setField('p2')} />
                    <SectionTable title="Machining" items={MOLD_P2_MACHINING} data={formData.p2} onChange={setField('p2')} />
                </>
            ),
        },
        {
            label: 'P3 – Manufacturing',
            render: () => (
                <>
                    <SectionTable title="Manual Work" items={MOLD_P3_MANUAL} data={formData.p3} onChange={setField('p3')} />
                    <SectionTable title="Heat & Surface Treatment" items={MOLD_P3_HEAT} data={formData.p3} onChange={setField('p3')} />
                    <SectionTable title="Engineering & Design" items={MOLD_P3_ENGINEERING} data={formData.p3} onChange={setField('p3')} />
                </>
            ),
        },
        {
            label: 'P4 – Corrections & Logistics',
            render: () => (
                <>
                    <SectionTable title="Corrections & Optimizations" items={MOLD_P4_CORRECTIONS} data={formData.p4} onChange={setField('p4')} />
                    <SectionTable title="Logistics" items={MOLD_P4_LOGISTICS} data={formData.p4} onChange={setField('p4')} />
                </>
            ),
        },
        {
            label: 'P5 – Sampling & Spares',
            render: () => (
                <>
                    <SectionTable title="Sampling" items={MOLD_P5_SAMPLING} data={formData.p5} onChange={setField('p5')} />
                    <SectionTable title="Spare Parts" items={MOLD_P5_SPARE} data={formData.p5} onChange={setField('p5')} />
                </>
            ),
        },
    ];

    const dieTabs = [
        {
            label: 'P1 – Materials & Accessories',
            render: () => (
                <>
                    <HeaderFields fields={DIE_P1_HEADER} data={formData.p1} onChange={setField('p1')} />
                    <SectionTable title="Materials" items={DIE_P1_MATERIALS} data={formData.p1} onChange={setField('p1')} />
                    <SectionTable title="Accessories" items={DIE_P1_ACCESSORIES} data={formData.p1} onChange={setField('p1')} />
                </>
            ),
        },
        {
            label: 'P2 – Machining & Manual Work',
            render: () => (
                <>
                    <SectionTable title="Machining" items={DIE_P2_MACHINING} data={formData.p2} onChange={setField('p2')} />
                    <SectionTable title="Manual Work" items={DIE_P2_MANUAL} data={formData.p2} onChange={setField('p2')} />
                </>
            ),
        },
        {
            label: 'P3 – Heat Treatment',
            render: () => (
                <SectionTable title="Heat & Surface Treatment" items={MOLD_P3_HEAT} data={formData.p3} onChange={setField('p3')} />
            ),
        },
        {
            label: 'P4 – Logistics',
            render: () => (
                <SectionTable title="Logistics" items={MOLD_P4_LOGISTICS} data={formData.p4} onChange={setField('p4')} />
            ),
        },
    ];

    const tabs = rfqType === 'mold' ? moldTabs : dieTabs;

    return (
        <div>
            <p className="text-xs uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>
                Cost Breakdown — {rfqType === 'mold' ? 'Mold' : 'Die'} Quote Form
            </p>

            {/* Tab bar */}
            <div className="flex border-b border-border-default mb-4 overflow-x-auto">
                {tabs.map((tab, idx) => (
                    <button
                        key={idx}
                        onClick={() => setActiveTab(idx)}
                        className={`px-4 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
                            activeTab === idx
                                ? 'border-b-2 border-brand-accent text-brand-accent'
                                : 'text-text-secondary hover:text-text-primary'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Active tab content */}
            <div className="min-h-[300px]">
                {tabs[activeTab]?.render()}
            </div>

            {/* Navigation between tabs */}
            {activeTab < tabs.length - 1 && (
                <div className="flex justify-end mb-4">
                    <button
                        onClick={() => setActiveTab(activeTab + 1)}
                        className="flex items-center gap-1 text-sm"
                        style={{ color: 'var(--brand-accent)' }}
                    >
                        Next: {tabs[activeTab + 1]?.label} <ChevronRight size={14} />
                    </button>
                </div>
            )}

            {/* Feedback */}
            {error && (
                <div className="mb-3 px-3 py-2 text-sm border" style={{ color: 'var(--brand-danger)', borderColor: 'var(--brand-danger)', backgroundColor: 'rgba(239,68,68,0.1)' }}>
                    {error}
                </div>
            )}
            {success && (
                <div className="mb-3 px-3 py-2 text-sm border" style={{ color: 'var(--status-active)', borderColor: 'var(--status-active)', backgroundColor: 'rgba(16,185,129,0.1)' }}>
                    {success}
                </div>
            )}

            {/* Submit buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border-default">
                <Button variant="outline" disabled={saving} onClick={() => handleSubmit(true)}>
                    <Save size={14} /> {saving ? 'Saving…' : 'Save Draft'}
                </Button>
                <Button variant="primary" disabled={saving} onClick={() => handleSubmit(false)}>
                    <Send size={14} /> {saving ? 'Submitting…' : 'Submit Final Quote'}
                </Button>
            </div>
        </div>
    );
}
