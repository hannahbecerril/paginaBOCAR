// sections/Suppliers/QuoteForm.jsx
// Full cost-breakdown quote form for suppliers. Mirrors the backend MOLD_COSTBR_P*_S / DIE_COSTBR_P*_S models.
import { useState, useEffect } from 'react';
import { Save, Send, ChevronRight, ChevronLeft, Check } from 'lucide-react';
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
    { key: 'Tool_dimensions_Fixed_Side_1_in_mm', label: 'Dim. Fixed 1 (mm)', type: 'number' },
    { key: 'Tool_dimensions_Fixed_Side_2_in_mm', label: 'Dim. Fixed 2 (mm)', type: 'number' },
    { key: 'Tool_dimensions_Fixed_Side_3_in_mm', label: 'Dim. Fixed 3 (mm)', type: 'number' },
    { key: 'Tool_dimensions_Ejector_Side_1_in_mm', label: 'Dim. Ejector 1 (mm)', type: 'number' },
    { key: 'Tool_dimensions_Ejector_Side_2_in_mm', label: 'Dim. Ejector 2 (mm)', type: 'number' },
    { key: 'Tool_dimensions_Ejector_Side_3_in_mm', label: 'Dim. Ejector 3 (mm)', type: 'number' },
    { key: 'Tool_weight_Fixed_Side_in_kg', label: 'Weight Fixed (kg)', type: 'number' },
    { key: 'Tool_weight_Ejector_Side_in_kg', label: 'Weight Ejector (kg)', type: 'number' },
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
    { prefix: 'GrandTotalManufacCost', label: 'GRAND TOTAL MFG',  suffix: 'h', isTotal: true },
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

const MOLD_P5_TOOL_REPLACEMENT = [
    { prefix: 'DieImprovements', label: 'Die Improvements Design', suffix: 'unit' },
    { prefix: 'OthersToolReplace', label: 'Others (Tool Replace)', suffix: 'unit' },
    { prefix: 'TotalToolReplace', label: 'TOTAL TOOL REPLACEMENT', suffix: 'unit', isTotal: true },
];

const CAVITIES_P1_ACCESSORIES = [
    { prefix: 'JetCooling', label: 'Jet Cooling', suffix: 'unit' },
    { prefix: 'SqueezePin', label: 'Squeeze Pin', suffix: 'unit' },
    { prefix: 'InterchangeableInserts', label: 'Interchangeable Inserts', suffix: 'unit' },
    { prefix: 'InsertsSpareParts', label: 'Inserts Spare Parts', suffix: 'unit' },
    { prefix: 'ChillBlocks', label: 'Chill Blocks', suffix: 'unit' },
    { prefix: 'OthersAccesories', label: 'Others (Accessories)', suffix: 'unit' },
    { prefix: 'TotalAccesories', label: 'TOTAL ACCESSORIES', suffix: 'unit', isTotal: true },
];

const CAVITIES_P1_MATERIALS = [
    { prefix: 'RawMaterials', label: 'Raw Materials', suffix: 'unit' },
    { prefix: 'OthersMaterialCosts', label: 'Others (Materials)', suffix: 'unit' },
    { prefix: 'TotalMaterialCost', label: 'TOTAL MATERIALS', suffix: 'unit', isTotal: true },
];

const CAVITIES_P1_MACHINING = [
    { prefix: 'Milling', label: 'Milling', suffix: 'h' },
    { prefix: 'Turning', label: 'Turning', suffix: 'h' },
    { prefix: 'WireCutting', label: 'Wire Cutting', suffix: 'h' },
    { prefix: 'EDM', label: 'EDM', suffix: 'h' },
    { prefix: 'Grinding', label: 'Grinding', suffix: 'h' },
    { prefix: 'Drillling', label: 'Drilling', suffix: 'h' },
    { prefix: 'OthersMachining', label: 'Others (Machining)', suffix: 'h' },
    { prefix: 'TotalMachining', label: 'TOTAL MACHINING', suffix: 'h', isTotal: true },
];

const CAVITIES_P2_MANUAL = [
    { prefix: 'Assembly', label: 'Assembly', suffix: 'h' },
    { prefix: 'Spotting', label: 'Spotting', suffix: 'h' },
    { prefix: 'StrippingAndPol', label: 'Stripping & Polishing', suffix: 'h' },
    { prefix: 'OthersManualWork', label: 'Others (Manual)', suffix: 'h' },
    { prefix: 'TotalManualWork', label: 'TOTAL MANUAL WORK', suffix: 'h', isTotal: true },
];

const CAVITIES_P2_HEAT = [
    { prefix: 'Hardening', label: 'Hardening', suffix: 'h' },
    { prefix: 'Nitriding', label: 'Nitriding', suffix: 'h' },
    { prefix: 'Coating', label: 'Coating', suffix: 'h' },
    { prefix: 'Graining', label: 'Graining', suffix: 'h' },
    { prefix: 'OthersHeatSurface', label: 'Others (Heat/Surface)', suffix: 'h' },
    { prefix: 'TotalHeatSurface', label: 'TOTAL HEAT/SURFACE', suffix: 'h', isTotal: true },
];

const CAVITIES_P2_ENGINEERING = [
    { prefix: 'Design', label: 'Design', suffix: 'h' },
    { prefix: 'CamNcProg', label: 'CAM/NC Programming', suffix: 'h' },
    { prefix: 'Simulation', label: 'Simulation', suffix: 'h' },
    { prefix: 'OthersEngAndDesign', label: 'Others (Engineering)', suffix: 'h' },
    { prefix: 'TotalEngAndDesign', label: 'TOTAL ENGINEERING', suffix: 'h', isTotal: true },
];

const CAVITIES_P3_CORRECTIONS = [
    { prefix: 'MeasureCavities', label: 'Measure Cavities', suffix: 'H' },
    { prefix: 'OthersCorrectOpt', label: 'Others (Corrections)', suffix: 'H' },
    { prefix: 'TotalCorrectOpt', label: 'TOTAL CORRECTIONS', suffix: 'H', isTotal: true },
];

const CAVITIES_P3_LOGISTICS = [
    { prefix: 'CleaningAndPack', label: 'Cleaning & Packaging', suffix: 'unit' },
    { prefix: 'OthersCosts', label: 'Others (Logistics)', suffix: 'unit' },
    { prefix: 'TotalLogistics', label: 'TOTAL LOGISTICS', suffix: 'unit', isTotal: true },
];

const CAVITIES_P3_SPARE = [
    { prefix: 'InterchangeInserts', label: 'Interchange Inserts', suffix: 'unit' },
    { prefix: 'CorePins', label: 'Core Pins', suffix: 'unit' },
    { prefix: 'OthersSpareParts', label: 'Others (Spare Parts)', suffix: 'unit' },
    { prefix: 'TotalSpareParts', label: 'TOTAL SPARE PARTS', suffix: 'unit', isTotal: true },
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
    { prefix: 'Mill',           label: 'Milling',           suffix: 'H' },
    { prefix: 'Turn',           label: 'Turning',           suffix: 'H' },
    { prefix: 'Wirecut',        label: 'Wire Cutting',      suffix: 'H' },
    { prefix: 'EDM',            label: 'EDM',               suffix: 'H' },
    { prefix: 'Grind',          label: 'Grinding',          suffix: 'H' },
    { prefix: 'Drill',          label: 'Drilling',          suffix: 'H' },
    { prefix: 'OthMachin',      label: 'Others (Machining)',suffix: 'H' },
    { prefix: 'TotalMachinCst', label: 'TOTAL MACHINING',   suffix: 'H', isTotal: true },
];

const DIE_P2_MANUAL = [
    { prefix: 'Assem',       label: 'Assembly',           suffix: 'H' },
    { prefix: 'Spot',        label: 'Spotting',           suffix: 'H' },
    { prefix: 'StripPolish', label: 'Strip & Polish',     suffix: 'H' },
    { prefix: 'OthManual',   label: 'Others (Manual)',    suffix: 'H' },
    { prefix: 'TotalManuWk', label: 'TOTAL MANUAL WORK',  suffix: 'H', isTotal: true },
];

// ── Helper: get field keys from prefix + suffix style ─────────────────────────
function getFieldKeys(prefix, suffix) {
    if (suffix === 'h')    return [`${prefix}_h`,    `${prefix}_PriceH`,    `${prefix}_Total`, `${prefix}_Weeks`];
    if (suffix === 'H')    return [`${prefix}_H`,    `${prefix}_PriceH`,    `${prefix}_Total`, `${prefix}_Weeks`];
    if (suffix === 'q')    return [`${prefix}_Q`,    `${prefix}_PriceQ`,    `${prefix}_Total`, `${prefix}_Weeks`];
    return                        [`${prefix}_Unit`,  `${prefix}_PriceUnit`, `${prefix}_Total`, `${prefix}_Weeks`];
}


// ── Cost row component ─────────────────────────────────────────────────────────

function CostRow({ item, data, onChange }) {
    const [k1, k2, k3, k4] = getFieldKeys(item.prefix, item.suffix);
    const rowStyle = item.isTotal
        ? { backgroundColor: 'var(--background-tertiary)', fontWeight: 600 }
        : {};

    // Smart change: when Qty or Price changes, recalculate Total immediately.
    // Passes a batch object to onChange so all updates land in one setState.
    const handleSmartChange = (key, rawValue) => {
        const value = rawValue === '' ? null : parseFloat(rawValue);
        if (!item.isTotal && (key === k1 || key === k2)) {
            // Compute new total based on updated qty/price
            const currentQty   = key === k1 ? (value ?? 0) : (parseFloat(data[k1] ?? 0) || 0);
            const currentPrice = key === k2 ? (value ?? 0) : (parseFloat(data[k2] ?? 0) || 0);
            const newTotal = parseFloat((currentQty * currentPrice).toFixed(4));
            // Pass a batch object: onChange detects {key: val} shape and merges atomically
            onChange({ [key]: value, [k3]: newTotal });
        } else {
            onChange(key, value);
        }
    };


    const editableField = (k) => (
        <td key={k} className="px-2 py-1.5">
            <input
                type="number"
                step="0.01"
                value={data[k] ?? ''}
                onChange={e => handleSmartChange(k, e.target.value)}
                className="w-full px-2 py-1 text-sm border border-border-default bg-surface focus:outline-none focus:ring-1 focus:ring-brand-accent"
                style={{ color: 'var(--text-primary)' }}
            />
        </td>
    );

    // _Total (k3) for non-total rows is auto-calculated → show read-only with accent bg
    const totalField = () => (
        <td key={k3} className="px-2 py-1.5">
            <input
                type="number"
                step="0.01"
                readOnly={!item.isTotal}
                tabIndex={!item.isTotal ? -1 : undefined}
                value={data[k3] ?? ''}
                onChange={item.isTotal ? (e => handleSmartChange(k3, e.target.value)) : undefined}
                className="w-full px-2 py-1 text-sm border border-border-default focus:outline-none"
                style={{
                    color: 'var(--text-primary)',
                    backgroundColor: !item.isTotal
                        ? 'rgba(16, 185, 129, 0.07)' // subtle teal = auto-calculated
                        : 'var(--background-tertiary)',
                    cursor: !item.isTotal ? 'default' : undefined,
                    fontWeight: item.isTotal ? 600 : undefined,
                }}
            />
        </td>
    );

    return (
        <tr style={rowStyle} className="border-b border-border-light">
            <td className="px-3 py-1.5 text-sm" style={{ color: 'var(--text-primary)', minWidth: '200px' }}>{item.label}</td>
            {editableField(k1)}
            {editableField(k2)}
            {totalField()}
            {editableField(k4)}
        </tr>
    );
}

// ── Section table ─────────────────────────────────────────────────────────────
function SectionTable({ title, items, data, onChange }) {
    const sfx  = items[0]?.suffix?.toLowerCase();
    const col1 = sfx === 'h' ? 'Hours'   : (sfx === 'q' ? 'Qty'     : 'Units');
    const col2 = sfx === 'h' ? 'Price/h' : (sfx === 'q' ? 'Price/q' : 'Price/unit');
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

// Minimum required: P1 header fields Company and Country must be non-empty
function isQuoteComplete(formData) {
    const p1 = formData.p1 ?? {};
    return (p1.Company ?? '').trim() !== '' && (p1.Country ?? '').trim() !== '';
}

// ── Main form component ───────────────────────────────────────────────────────
// ── Summary Tables ─────────────────────────────────────────────────────────────
function SummaryRowMold({ label, prefix, data, onChange, skipToolRep=false, skipCav=false }) {
    const inputStyle = "w-full px-2 py-1 text-sm border border-border-default bg-surface focus:outline-none focus:ring-1 focus:ring-brand-accent";
    
    const numField = (k) => (
        <td className="px-1 py-1.5">
            <input
                type="number" step="0.01"
                value={data[k] ?? ''}
                onChange={e => onChange(k, e.target.value === '' ? null : parseFloat(e.target.value))}
                className={inputStyle}
                style={{ color: 'var(--text-primary)' }}
            />
        </td>
    );

    const emptyCell = () => <td className="px-1 py-1.5"></td>;

    return (
        <tr className="border-b border-border-light">
            <td className="px-3 py-1.5 text-sm" style={{ color: 'var(--text-primary)' }}>{label}</td>
            {numField(`${prefix}_M1_PrBd`)}
            {numField(`${prefix}_M1_TBd`)}
            {!skipToolRep ? numField(`${prefix}_ToolRep_PrBd`) : emptyCell()}
            {!skipToolRep ? numField(`${prefix}_ToolRep_TBd`) : emptyCell()}
            {!skipCav ? numField(`${prefix}_Cav_PrBd`) : emptyCell()}
            {!skipCav ? numField(`${prefix}_Cav_TBd`) : emptyCell()}
        </tr>
    );
}

function SummaryTableMold({ data, onChange }) {
    return (
        <div className="mb-6 overflow-x-auto">
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-2 pb-1 border-b" style={{ color: 'var(--text-tertiary)', borderColor: 'var(--border-default)' }}>
                COST AND TIMING BREAKDOWN
            </h4>
            <table className="w-full text-sm">
                <thead style={{ backgroundColor: 'var(--background-tertiary)' }}>
                    <tr>
                        <th rowSpan="2" className="px-3 py-2 text-left text-xs font-medium" style={{ color: 'var(--text-tertiary)', minWidth:'180px' }}>SUMMARY</th>
                        <th colSpan="2" className="px-2 py-1 text-center text-xs font-medium border-l border-border-default" style={{ color: 'var(--text-tertiary)' }}>MOLD 1</th>
                        <th colSpan="2" className="px-2 py-1 text-center text-xs font-medium border-l border-border-default" style={{ color: 'var(--text-tertiary)' }}>TOOL REPLACEMENT</th>
                        <th colSpan="2" className="px-2 py-1 text-center text-xs font-medium border-l border-border-default" style={{ color: 'var(--text-tertiary)' }}>SET OF CAVITIES</th>
                    </tr>
                    <tr className="border-t border-border-light">
                        <th className="px-1 py-1 text-center text-xs font-medium border-l border-border-default" style={{ color: 'var(--text-tertiary)' }}>Price</th>
                        <th className="px-1 py-1 text-center text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Weeks</th>
                        <th className="px-1 py-1 text-center text-xs font-medium border-l border-border-default" style={{ color: 'var(--text-tertiary)' }}>Price</th>
                        <th className="px-1 py-1 text-center text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Weeks</th>
                        <th className="px-1 py-1 text-center text-xs font-medium border-l border-border-default" style={{ color: 'var(--text-tertiary)' }}>Price</th>
                        <th className="px-1 py-1 text-center text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Weeks</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td colSpan="7" className="px-3 py-1 text-xs font-bold bg-surface-hover">DIE FABRICATION</td></tr>
                    <SummaryRowMold label="Material cost" prefix="MatCst" data={data} onChange={onChange} />
                    <SummaryRowMold label="Accessories" prefix="Accs" data={data} onChange={onChange} />
                    <SummaryRowMold label="Manufacturing cost" prefix="ManCst" data={data} onChange={onChange} />
                    
                    <tr><td colSpan="7" className="px-3 py-1 text-xs font-bold bg-surface-hover">ACTIVITIES REQUIRED POST-FABRICATION</td></tr>
                    <SummaryRowMold label="Correction, optimization" prefix="CorrOptAndMeas" data={data} onChange={onChange} />
                    <SummaryRowMold label="Logistic cost" prefix="LogCst" data={data} onChange={onChange} />
                    
                    <tr style={{ backgroundColor: 'var(--background-tertiary)', fontWeight: 'bold' }}>
                        <td colSpan="7" className="p-0">
                            <table className="w-full"><tbody>
                                <SummaryRowMold label="GRAND TOTAL" prefix="GrTot" data={data} onChange={onChange} />
                            </tbody></table>
                        </td>
                    </tr>
                    
                    <SummaryRowMold label="SAMPLING IN SUPPLIER FACILITIES" prefix="SampSuppFac" data={data} onChange={onChange} skipToolRep skipCav />
                    <SummaryRowMold label="SPARE PARTS" prefix="SPPT" data={data} onChange={onChange} />
                    
                    <tr className="border-b border-border-light">
                        <td className="px-3 py-2 text-sm font-bold">CURRENCY</td>
                        <td colSpan="2" className="px-1 py-1">
                            <input
                                type="text"
                                value={data['Curr'] ?? ''}
                                onChange={e => onChange('Curr', e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-border-default bg-surface"
                            />
                        </td>
                        <td colSpan="4"></td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}

function SummaryRowDie({ label, prefix, data, onChange }) {
    const inputStyle = "w-full px-2 py-1 text-sm border border-border-default bg-surface focus:outline-none focus:ring-1 focus:ring-brand-accent";
    
    const numField = (k) => (
        <td className="px-1 py-1.5">
            <input
                type="number" step="0.01"
                value={data[k] ?? ''}
                onChange={e => onChange(k, e.target.value === '' ? null : parseFloat(e.target.value))}
                className={inputStyle}
                style={{ color: 'var(--text-primary)' }}
            />
        </td>
    );

    return (
        <tr className="border-b border-border-light">
            <td className="px-3 py-1.5 text-sm" style={{ color: 'var(--text-primary)' }}>{label}</td>
            {numField(`${prefix}_TD1_PrBd`)}
            {numField(`${prefix}_TD1_TmBd`)}
            {numField(`${prefix}_TD2_PrBd`)}
            {numField(`${prefix}_TD2_TmBd`)}
        </tr>
    );
}

function SummaryTableDie({ data, onChange }) {
    return (
        <div className="mb-6 overflow-x-auto">
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-2 pb-1 border-b" style={{ color: 'var(--text-tertiary)', borderColor: 'var(--border-default)' }}>
                COST AND TIMING BREAKDOWN
            </h4>
            <table className="w-full text-sm">
                <thead style={{ backgroundColor: 'var(--background-tertiary)' }}>
                    <tr>
                        <th rowSpan="2" className="px-3 py-2 text-left text-xs font-medium" style={{ color: 'var(--text-tertiary)', minWidth:'180px' }}>SUMMARY</th>
                        <th colSpan="2" className="px-2 py-1 text-center text-xs font-medium border-l border-border-default" style={{ color: 'var(--text-tertiary)' }}>TRIM DIE 1</th>
                        <th colSpan="2" className="px-2 py-1 text-center text-xs font-medium border-l border-border-default" style={{ color: 'var(--text-tertiary)' }}>TRIM DIE 2</th>
                    </tr>
                    <tr className="border-t border-border-light">
                        <th className="px-1 py-1 text-center text-xs font-medium border-l border-border-default" style={{ color: 'var(--text-tertiary)' }}>Price</th>
                        <th className="px-1 py-1 text-center text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Weeks</th>
                        <th className="px-1 py-1 text-center text-xs font-medium border-l border-border-default" style={{ color: 'var(--text-tertiary)' }}>Price</th>
                        <th className="px-1 py-1 text-center text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Weeks</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td colSpan="5" className="px-3 py-1 text-xs font-bold bg-surface-hover">DIE FABRICATION</td></tr>
                    <SummaryRowDie label="Material cost" prefix="MatCst" data={data} onChange={onChange} />
                    <SummaryRowDie label="Accessories" prefix="Acc" data={data} onChange={onChange} />
                    <SummaryRowDie label="Manufacturing cost" prefix="ManuCst" data={data} onChange={onChange} />
                    
                    <tr><td colSpan="5" className="px-3 py-1 text-xs font-bold bg-surface-hover">POST-FABRICATION</td></tr>
                    <SummaryRowDie label="Adjustment" prefix="Adjus" data={data} onChange={onChange} />
                    <SummaryRowDie label="Logistic cost" prefix="Logis" data={data} onChange={onChange} />
                    
                    <tr style={{ backgroundColor: 'var(--background-tertiary)', fontWeight: 'bold' }}>
                        <td colSpan="5" className="p-0">
                            <table className="w-full"><tbody>
                                <SummaryRowDie label="GRAND TOTAL" prefix="GrTotal" data={data} onChange={onChange} />
                            </tbody></table>
                        </td>
                    </tr>
                    
                    <SummaryRowDie label="SPARE PARTS" prefix="SpParts" data={data} onChange={onChange} />
                    
                    <tr className="border-b border-border-light">
                        <td className="px-3 py-2 text-sm font-bold">CURRENCY</td>
                        <td colSpan="2" className="px-1 py-1">
                            <input type="text" value={data['Curr_Trim_1'] ?? ''} onChange={e => onChange('Curr_Trim_1', e.target.value)} className="w-full px-2 py-1 text-sm border bg-surface" />
                        </td>
                        <td colSpan="2" className="px-1 py-1">
                            <input type="text" value={data['Curr_Trim_2'] ?? ''} onChange={e => onChange('Curr_Trim_2', e.target.value)} className="w-full px-2 py-1 text-sm border bg-surface" />
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}

export default function QuoteForm({ rfqId, rfqType, existingResponses = [], onSubmitSuccess }) {
    const [activeStep, setActiveTab] = useState(0);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Initialise form data from existing backend response (p1, p2, … fields).
    // Strip DB-internal / metadata keys that must never be sent back to the API.
    const _STRIP_KEYS = new Set(['id', 'id_rfq_id', 'supplier_id', 'supplier',
        'Last_change', 'Last_edit_by', 'Last_edited_by', 'Elaborated_by']);
    const cleanSeed = (part) => {
        const obj = existingResponses[0]?.[part] ?? {};
        return Object.fromEntries(Object.entries(obj).filter(([k]) => !_STRIP_KEYS.has(k)));
    };
    const [formData, setFormData] = useState({
        p1: cleanSeed('p1'),
        p2: cleanSeed('p2'),
        p3: cleanSeed('p3'),
        p4: cleanSeed('p4'),
        p5: cleanSeed('p5'),
        cav1: cleanSeed('cav1'),
        cav2: cleanSeed('cav2'),
        cav3: cleanSeed('cav3'),
        info1: cleanSeed('info1'),
        info2: cleanSeed('info2'),
    });

    // setField supports two call signatures:
    //   setField('p1')('MyKey', value)                  — single field
    //   setField('p1')({ MyKey: v1, OtherKey: v2 })     — batch (atomic, avoids stale closure)
    const setField = (part) => (keyOrUpdates, value) => {
        if (typeof keyOrUpdates === 'object' && keyOrUpdates !== null) {
            // Batch update: merge all key-value pairs atomically
            setFormData(prev => ({ ...prev, [part]: { ...prev[part], ...keyOrUpdates } }));
        } else {
            setFormData(prev => ({ ...prev, [part]: { ...prev[part], [keyOrUpdates]: value } }));
        }
    };


    // ── Auto-Calculation Logic for Summary ─────────────────────────────────────────

    useEffect(() => {
        setFormData(prev => {
            const info1 = { ...prev.info1 };
            const getVal = (part, key) => parseFloat(prev[part]?.[key] || 0);

            const sumArr = (part, arr) => {
                if (!arr) return 0;
                return arr.filter(i => !i.isTotal).reduce((sum, item) => sum + getVal(part, `${item.prefix}_Total`), 0);
            };

            const maxArr = (part, arr) => {
                if (!arr) return 0;
                return arr.filter(i => !i.isTotal).reduce((max, item) => Math.max(max, getVal(part, `${item.prefix}_Weeks`)), 0);
            };

            if (rfqType === 'mold') {
                // MOLD 1 Column
                info1['MatCst_M1_PrBd'] = sumArr('p2', MOLD_P2_MATERIALS);
                info1['MatCst_M1_TBd'] = maxArr('p2', MOLD_P2_MATERIALS);
                info1['Accs_M1_PrBd'] = sumArr('p1', MOLD_P1_ITEMS);
                info1['Accs_M1_TBd'] = maxArr('p1', MOLD_P1_ITEMS);
                info1['ManCst_M1_PrBd'] = sumArr('p2', MOLD_P2_MACHINING) + sumArr('p3', MOLD_P3_MANUAL) + sumArr('p3', MOLD_P3_HEAT) + sumArr('p3', MOLD_P3_ENGINEERING);
                info1['ManCst_M1_TBd'] = Math.max(maxArr('p2', MOLD_P2_MACHINING), maxArr('p3', MOLD_P3_MANUAL), maxArr('p3', MOLD_P3_HEAT), maxArr('p3', MOLD_P3_ENGINEERING));
                info1['CorrOptAndMeas_M1_PrBd'] = sumArr('p4', MOLD_P4_CORRECTIONS);
                info1['CorrOptAndMeas_M1_TBd'] = maxArr('p4', MOLD_P4_CORRECTIONS);
                info1['LogCst_M1_PrBd'] = sumArr('p4', MOLD_P4_LOGISTICS);
                info1['LogCst_M1_TBd'] = maxArr('p4', MOLD_P4_LOGISTICS);
                info1['GrTot_M1_PrBd'] = info1['MatCst_M1_PrBd'] + info1['Accs_M1_PrBd'] + info1['ManCst_M1_PrBd'] + info1['CorrOptAndMeas_M1_PrBd'] + info1['LogCst_M1_PrBd'];
                info1['GrTot_M1_TBd'] = Math.max(info1['MatCst_M1_TBd'], info1['Accs_M1_TBd'], info1['ManCst_M1_TBd'], info1['CorrOptAndMeas_M1_TBd'], info1['LogCst_M1_TBd']);
                info1['SampSuppFac_M1_PrBd'] = sumArr('p5', MOLD_P5_SAMPLING);
                info1['SampSuppFac_M1_TBd'] = maxArr('p5', MOLD_P5_SAMPLING);
                info1['SPPT_M1_PrBd'] = sumArr('p5', MOLD_P5_SPARE);
                info1['SPPT_M1_TBd'] = maxArr('p5', MOLD_P5_SPARE);

                // TOOL REPLACEMENT Column
                info1['MatCst_ToolRep_PrBd'] = 0; info1['MatCst_ToolRep_TBd'] = 0;
                info1['Accs_ToolRep_PrBd'] = 0; info1['Accs_ToolRep_TBd'] = 0;
                info1['ManCst_ToolRep_PrBd'] = sumArr('p5', MOLD_P5_TOOL_REPLACEMENT);
                info1['ManCst_ToolRep_TBd'] = maxArr('p5', MOLD_P5_TOOL_REPLACEMENT);
                info1['CorrOptAndMeas_ToolRep_PrBd'] = 0; info1['CorrOptAndMeas_ToolRep_TBd'] = 0;
                info1['LogCst_ToolRep_PrBd'] = 0; info1['LogCst_ToolRep_TBd'] = 0;
                info1['GrTot_ToolRep_PrBd'] = info1['ManCst_ToolRep_PrBd'];
                info1['GrTot_ToolRep_TBd'] = info1['ManCst_ToolRep_TBd'];
                info1['SPPT_ToolRep_PrBd'] = 0; info1['SPPT_ToolRep_TBd'] = 0;

                // SET OF CAVITIES Column
                info1['MatCst_Cav_PrBd'] = sumArr('cav1', CAVITIES_P1_MATERIALS);
                info1['MatCst_Cav_TBd'] = maxArr('cav1', CAVITIES_P1_MATERIALS);
                info1['Accs_Cav_PrBd'] = sumArr('cav1', CAVITIES_P1_ACCESSORIES);
                info1['Accs_Cav_TBd'] = maxArr('cav1', CAVITIES_P1_ACCESSORIES);
                info1['ManCst_Cav_PrBd'] = sumArr('cav1', CAVITIES_P1_MACHINING) + sumArr('cav2', CAVITIES_P2_MANUAL) + sumArr('cav2', CAVITIES_P2_HEAT) + sumArr('cav2', CAVITIES_P2_ENGINEERING);
                info1['ManCst_Cav_TBd'] = Math.max(maxArr('cav1', CAVITIES_P1_MACHINING), maxArr('cav2', CAVITIES_P2_MANUAL), maxArr('cav2', CAVITIES_P2_HEAT), maxArr('cav2', CAVITIES_P2_ENGINEERING));
                info1['CorrOptAndMeas_Cav_PrBd'] = sumArr('cav3', CAVITIES_P3_CORRECTIONS);
                info1['CorrOptAndMeas_Cav_TBd'] = maxArr('cav3', CAVITIES_P3_CORRECTIONS);
                info1['LogCst_Cav_PrBd'] = sumArr('cav3', CAVITIES_P3_LOGISTICS);
                info1['LogCst_Cav_TBd'] = maxArr('cav3', CAVITIES_P3_LOGISTICS);
                info1['GrTot_Cav_PrBd'] = info1['MatCst_Cav_PrBd'] + info1['Accs_Cav_PrBd'] + info1['ManCst_Cav_PrBd'] + info1['CorrOptAndMeas_Cav_PrBd'] + info1['LogCst_Cav_PrBd'];
                info1['GrTot_Cav_TBd'] = Math.max(info1['MatCst_Cav_TBd'], info1['Accs_Cav_TBd'], info1['ManCst_Cav_TBd'], info1['CorrOptAndMeas_Cav_TBd'], info1['LogCst_Cav_TBd']);
                info1['SPPT_Cav_PrBd'] = sumArr('cav3', CAVITIES_P3_SPARE);
                info1['SPPT_Cav_TBd'] = maxArr('cav3', CAVITIES_P3_SPARE);
            } else {
                // TRIM DIE 1 Column
                info1['MatCst_TD1_PrBd'] = sumArr('p1', DIE_P1_MATERIALS);
                info1['MatCst_TD1_TmBd'] = maxArr('p1', DIE_P1_MATERIALS);
                info1['Acc_TD1_PrBd'] = sumArr('p1', DIE_P1_ACCESSORIES);
                info1['Acc_TD1_TmBd'] = maxArr('p1', DIE_P1_ACCESSORIES);
                info1['ManuCst_TD1_PrBd'] = sumArr('p2', DIE_P2_MACHINING) + sumArr('p2', DIE_P2_MANUAL) + sumArr('p3', MOLD_P3_HEAT);
                info1['ManuCst_TD1_TmBd'] = Math.max(maxArr('p2', DIE_P2_MACHINING), maxArr('p2', DIE_P2_MANUAL), maxArr('p3', MOLD_P3_HEAT));
                info1['Logis_TD1_PrBd'] = sumArr('p4', MOLD_P4_LOGISTICS);
                info1['Logis_TD1_TmBd'] = maxArr('p4', MOLD_P4_LOGISTICS);
                
                info1['GrTotal_TD1_PrBd'] = info1['MatCst_TD1_PrBd'] + info1['Acc_TD1_PrBd'] + info1['ManuCst_TD1_PrBd'] + (info1['Adjus_TD1_PrBd']||0) + info1['Logis_TD1_PrBd'];
                info1['GrTotal_TD1_TmBd'] = Math.max(info1['MatCst_TD1_TmBd'], info1['Acc_TD1_TmBd'], info1['ManuCst_TD1_TmBd'], (info1['Adjus_TD1_TmBd']||0), info1['Logis_TD1_TmBd']);
            }

            const hasChanged = Object.keys(info1).some(k => info1[k] !== prev.info1[k]);
            return hasChanged ? { ...prev, info1 } : prev;
        });
    }, [rfqType, formData.p1, formData.p2, formData.p3, formData.p4, formData.p5, formData.cav1, formData.cav2, formData.cav3]);

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
                    mold_cavities_p1: formData.cav1,
                    mold_cavities_p2: formData.cav2,
                    mold_cavities_p3: formData.cav3,
                    mold_info_p1: formData.info1,
                    mold_info_p2: formData.info2,
                };
            } else {
                payload = {
                    is_draft: isDraft,
                    die_cost_p1: formData.p1,
                    die_cost_p2: formData.p2,
                    die_cost_p3: formData.p3,
                    die_cost_p4: formData.p4,
                    die_trim_s: formData.info1,
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
            label: 'P5 – Tool Repl & Spares',
            render: () => (
                <>
                    <SectionTable title="Tool Replacement" items={MOLD_P5_TOOL_REPLACEMENT} data={formData.p5} onChange={setField('p5')} />
                    <SectionTable title="Sampling" items={MOLD_P5_SAMPLING} data={formData.p5} onChange={setField('p5')} />
                    <SectionTable title="Spare Parts" items={MOLD_P5_SPARE} data={formData.p5} onChange={setField('p5')} />
                </>
            ),
        },
        {
            label: 'Cavities P1 – Acc & Mat',
            render: () => (
                <>
                    <SectionTable title="Cavities - Accessories" items={CAVITIES_P1_ACCESSORIES} data={formData.cav1} onChange={setField('cav1')} />
                    <SectionTable title="Cavities - Materials" items={CAVITIES_P1_MATERIALS} data={formData.cav1} onChange={setField('cav1')} />
                    <SectionTable title="Cavities - Machining" items={CAVITIES_P1_MACHINING} data={formData.cav1} onChange={setField('cav1')} />
                </>
            ),
        },
        {
            label: 'Cavities P2 – Manuf & Eng',
            render: () => (
                <>
                    <SectionTable title="Cavities - Manual Work" items={CAVITIES_P2_MANUAL} data={formData.cav2} onChange={setField('cav2')} />
                    <SectionTable title="Cavities - Heat/Surface" items={CAVITIES_P2_HEAT} data={formData.cav2} onChange={setField('cav2')} />
                    <SectionTable title="Cavities - Engineering" items={CAVITIES_P2_ENGINEERING} data={formData.cav2} onChange={setField('cav2')} />
                </>
            ),
        },
        {
            label: 'Cavities P3 – Log & Spare',
            render: () => (
                <>
                    <SectionTable title="Cavities - Corrections" items={CAVITIES_P3_CORRECTIONS} data={formData.cav3} onChange={setField('cav3')} />
                    <SectionTable title="Cavities - Logistics" items={CAVITIES_P3_LOGISTICS} data={formData.cav3} onChange={setField('cav3')} />
                    <SectionTable title="Cavities - Spare Parts" items={CAVITIES_P3_SPARE} data={formData.cav3} onChange={setField('cav3')} />
                </>
            ),
        },
        {
            label: 'Summary – Cost & Timing',
            render: () => (
                <>
                    <SummaryTableMold data={formData.info1} onChange={setField('info1')} />
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 p-4 border border-border-default" style={{ backgroundColor: 'var(--background-tertiary)' }}>
                        <div><label className="text-xs uppercase text-text-tertiary">Supplier</label><input type="text" value={formData.info2['SUPP'] ?? ''} onChange={e => setField('info2')('SUPP', e.target.value)} className="w-full px-2 py-1 mt-1 text-sm border border-border-default bg-surface focus:outline-none focus:ring-1 focus:ring-brand-accent" /></div>
                        <div><label className="text-xs uppercase text-text-tertiary">Signature</label><input type="text" value={formData.info2['SIGN'] ?? ''} onChange={e => setField('info2')('SIGN', e.target.value)} className="w-full px-2 py-1 mt-1 text-sm border border-border-default bg-surface focus:outline-none focus:ring-1 focus:ring-brand-accent" /></div>
                        <div><label className="text-xs uppercase text-text-tertiary">Date</label><input type="date" value={formData.info2['DATE'] ?? ''} onChange={e => setField('info2')('DATE', e.target.value)} className="w-full px-2 py-1 mt-1 text-sm border border-border-default bg-surface focus:outline-none focus:ring-1 focus:ring-brand-accent" /></div>
                        <div><label className="text-xs uppercase text-text-tertiary">Prepared By</label><input type="text" value={formData.info2['PREP'] ?? ''} onChange={e => setField('info2')('PREP', e.target.value)} className="w-full px-2 py-1 mt-1 text-sm border border-border-default bg-surface focus:outline-none focus:ring-1 focus:ring-brand-accent" /></div>
                        <div><label className="text-xs uppercase text-text-tertiary">Quote No.</label><input type="text" value={formData.info2['QT_No'] ?? ''} onChange={e => setField('info2')('QT_No', e.target.value)} className="w-full px-2 py-1 mt-1 text-sm border border-border-default bg-surface focus:outline-none focus:ring-1 focus:ring-brand-accent" /></div>
                        <div><label className="text-xs uppercase text-text-tertiary">Incoterm</label><input type="text" value={formData.info2['INC'] ?? ''} onChange={e => setField('info2')('INC', e.target.value)} className="w-full px-2 py-1 mt-1 text-sm border border-border-default bg-surface focus:outline-none focus:ring-1 focus:ring-brand-accent" /></div>
                        <div className="col-span-2 md:col-span-4"><label className="text-xs uppercase text-text-tertiary">Comments / Remarks</label><textarea value={formData.info2['Comment'] ?? ''} onChange={e => setField('info2')('Comment', e.target.value)} className="w-full px-2 py-1 mt-1 text-sm border border-border-default bg-surface focus:outline-none focus:ring-1 focus:ring-brand-accent" rows="3" /></div>
                    </div>
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
        {
            label: 'Summary – Cost & Timing',
            render: () => (
                <>
                    <SummaryTableDie data={formData.info1} onChange={setField('info1')} />
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 p-4 border border-border-default" style={{ backgroundColor: 'var(--background-tertiary)' }}>
                        <div><label className="text-xs uppercase text-text-tertiary">Supplier</label><input type="text" value={formData.info1['SUPP'] ?? ''} onChange={e => setField('info1')('SUPP', e.target.value)} className="w-full px-2 py-1 mt-1 text-sm border border-border-default bg-surface focus:outline-none focus:ring-1 focus:ring-brand-accent" /></div>
                        <div><label className="text-xs uppercase text-text-tertiary">Signature</label><input type="text" value={formData.info1['SIGN'] ?? ''} onChange={e => setField('info1')('SIGN', e.target.value)} className="w-full px-2 py-1 mt-1 text-sm border border-border-default bg-surface focus:outline-none focus:ring-1 focus:ring-brand-accent" /></div>
                        <div><label className="text-xs uppercase text-text-tertiary">Date</label><input type="date" value={formData.info1['DATE'] ?? ''} onChange={e => setField('info1')('DATE', e.target.value)} className="w-full px-2 py-1 mt-1 text-sm border border-border-default bg-surface focus:outline-none focus:ring-1 focus:ring-brand-accent" /></div>
                        <div><label className="text-xs uppercase text-text-tertiary">Prepared By</label><input type="text" value={formData.info1['PREP'] ?? ''} onChange={e => setField('info1')('PREP', e.target.value)} className="w-full px-2 py-1 mt-1 text-sm border border-border-default bg-surface focus:outline-none focus:ring-1 focus:ring-brand-accent" /></div>
                    </div>
                </>
            ),
        },
    ];

    const tabs = rfqType === 'mold' ? moldTabs : dieTabs;
    const TOTAL = tabs.length;

    // A step is "done" if any value in its primary data part is non-null/non-empty
    const isStepDone = (idx) => {
        const moldParts = ['p1', 'p2', 'p3', 'p4', 'p5', 'cav1', 'cav2', 'cav3', 'info1'];
        const dieParts  = ['p1', 'p2', 'p3', 'p4', 'info1'];
        const parts = rfqType === 'mold' ? moldParts : dieParts;
        const key = parts[idx];
        if (!key) return false;
        return Object.values(formData[key] ?? {}).some(v => v !== null && v !== '' && v !== 0 && v !== undefined);
    };

    return (
        <div>
            {/* ── Stepper ── */}
            <div className="flex items-center mb-8 overflow-x-auto pb-1">
                {tabs.map((tab, idx) => {
                    const isActive = activeStep === idx;
                    const isDone   = isStepDone(idx);
                    const stepNum  = idx + 1;
                    return (
                        <div key={idx} className="flex items-center flex-shrink-0">
                            <button
                                onClick={() => setActiveTab(idx)}
                                className="flex flex-col items-center gap-1.5 group"
                                style={{ minWidth: '60px' }}
                            >
                                <div
                                    className="w-9 h-9 flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all"
                                    style={{
                                        backgroundColor: isDone
                                            ? 'var(--status-active)'
                                            : isActive
                                                ? 'var(--brand-accent)'
                                                : 'var(--surface-hover)',
                                        color: isDone || isActive ? '#fff' : 'var(--text-tertiary)',
                                        border: isDone || isActive
                                            ? 'none'
                                            : '1px solid var(--border-default)',
                                    }}
                                >
                                    {isDone && !isActive ? <Check size={16} strokeWidth={3} /> : stepNum}
                                </div>
                                <span
                                    className="text-[10px] font-medium text-center leading-tight"
                                    style={{
                                        color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
                                        maxWidth: '60px',
                                    }}
                                >
                                    {tab.label}
                                </span>
                            </button>
                            {idx < TOTAL - 1 && (
                                <div
                                    className="h-px flex-1 mx-2 flex-shrink-0"
                                    style={{
                                        width: '24px',
                                        backgroundColor: isStepDone(idx) ? 'var(--status-active)' : 'var(--border-default)',
                                    }}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* ── Step content ── */}
            <div className="min-h-[300px]">
                {tabs[activeStep]?.render()}
            </div>

            {/* ── Step navigation ── */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border-default">
                <div>
                    {activeStep > 0 && (
                        <Button variant="outline" onClick={() => setActiveTab(s => s - 1)}>
                            <ChevronLeft size={14} /> Back
                        </Button>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    {/* Feedback inline */}
                    {error && (
                        <span className="text-xs" style={{ color: 'var(--brand-danger)' }}>{error}</span>
                    )}
                    {success && (
                        <span className="text-xs" style={{ color: 'var(--status-active)' }}>{success}</span>
                    )}
                    <Button variant="outline" disabled={saving} onClick={() => handleSubmit(true)}>
                        <Save size={14} /> {saving ? 'Saving…' : 'Save Draft'}
                    </Button>
                    {activeStep < TOTAL - 1 ? (
                        <Button variant="primary" onClick={() => setActiveTab(s => s + 1)}>
                            Next <ChevronRight size={14} />
                        </Button>
                    ) : isQuoteComplete(formData) ? (
                        <Button variant="primary" disabled={saving} onClick={() => handleSubmit(false)}>
                            <Send size={14} /> {saving ? 'Submitting…' : 'Submit Final Quote'}
                        </Button>
                    ) : null}
                </div>
            </div>
            {activeStep === TOTAL - 1 && !isQuoteComplete(formData) && (
                <p className="text-xs mt-2 text-right" style={{ color: 'var(--text-tertiary)' }}>
                    Fill in Company and Country in P1 to unlock final submission.
                </p>
            )}
        </div>
    );
}
