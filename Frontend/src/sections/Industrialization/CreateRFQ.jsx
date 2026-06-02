import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import UploadCard from '../../components/ui/UploadCard';
import { CheckCircle, AlertCircle, ChevronRight, ChevronLeft, Save, Send, RefreshCw } from 'lucide-react';
import { getRFQFormConfig, uploadDocument } from '../api';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

// ── Sub-componentes del formulario ────────────────────────────────────────────
function SectionTitle({ children }) {
    return (
        <p className="text-[11px] font-semibold uppercase tracking-wider mb-4 pb-2 border-b border-border-default"
            style={{ color: 'var(--text-tertiary)' }}>
            {children}
        </p>
    );
}

function CheckRow({ label, field, notes, onCheck, onNote }) {
    return (
        <div className="flex items-start gap-3 py-2.5 border-b border-border-light last:border-0">
            <input
                type="checkbox"
                id={field}
                checked={notes.checked}
                onChange={(e) => onCheck(field, e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded accent-brand-primary cursor-pointer flex-shrink-0"
            />
            <div className="flex-1">
                <label htmlFor={field} className="text-sm cursor-pointer select-none" style={{ color: 'var(--text-primary)' }}>
                    {label}
                </label>
                {notes.checked && (
                    <input
                        type="text"
                        value={notes.note}
                        onChange={(e) => onNote(field, e.target.value)}
                        placeholder="Notes (optional)"
                        className="mt-1.5 w-full border border-border-default bg-surface px-3 py-1.5 text-xs text-text-primary placeholder:text-text-tertiary focus:border-ring focus:ring-2 focus:ring-ring/20 outline-none transition-all"
                    />
                )}
            </div>
        </div>
    );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function RFQForm() {
    const [step, setStep] = useState(1);
    const TOTAL_STEPS = 3;

    // Form config loaded from api.js
    const [formConfig, setFormConfig] = useState(null);

    // Step 1 - General
    const [general, setGeneral] = useState({ tool: '', type: '' });

    // Step 2 - Die data
    const [dieTrim, setDieTrim] = useState(null);
    const [dieBooleans, setDieBooleans] = useState(null);

    // Step 2 - Mold data
    const [moldP1, setMoldP1] = useState(null);
    const [moldP2, setMoldP2] = useState(null);

    // Step 3 - Files
    const [files, setFiles] = useState({ pdf: null, ppt: null, cad: null });

    // UI state
    const [loading, setLoading] = useState(false);
    const [configLoading, setConfigLoading] = useState(true);
    const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', message }

    // Load form config and initialize defaults on mount
    useEffect(() => {
        getRFQFormConfig().then(cfg => {
            setFormConfig(cfg);
            setDieTrim(JSON.parse(JSON.stringify(cfg.defaults.dieTrim)));
            setDieBooleans(JSON.parse(JSON.stringify(cfg.defaults.dieBooleans)));
            setMoldP1(JSON.parse(JSON.stringify(cfg.defaults.moldP1)));
            setMoldP2(JSON.parse(JSON.stringify(cfg.defaults.moldP2)));
            setConfigLoading(false);
        });
    }, []);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const setDieField = (key, val) => setDieTrim(p => ({ ...p, [key]: val }));
    const setMoldField = (key, val) => setMoldP1(p => ({ ...p, [key]: val }));

    const setDieBool = (field, checked) =>
        setDieBooleans(p => ({ ...p, [field]: { ...p[field], checked } }));
    const setDieNote = (field, note) =>
        setDieBooleans(p => ({ ...p, [field]: { ...p[field], note } }));

    const setMoldBool = (field, checked) =>
        setMoldP2(p => ({ ...p, [field]: { ...p[field], checked } }));
    const setMoldNote = (field, note) =>
        setMoldP2(p => ({ ...p, [field]: { ...p[field], note } }));

    // Flatten booleans map to backend format
    const flattenBooleans = (boolMap) => {
        const result = {};
        for (const [key, val] of Object.entries(boolMap)) {
            result[key] = val.checked;
            result[`${key}_notes`] = val.note;
        }
        return result;
    };

    const buildPayload = (isDraft) => {
        const base = { tool: general.tool, type: general.type, is_draft: isDraft };
        if (general.type === 'die') {
            return { ...base, die_trim: { ...dieTrim, ...flattenBooleans(dieBooleans) } };
        }
        return {
            ...base,
            mold_info_p1: moldP1,
            mold_info_p2: flattenBooleans(moldP2),
        };
    };

    const getMissingFields = () => {
        const missing = [];
        if (step === 1) {
            if (!general.tool.trim()) missing.push('Tool Name');
            if (!general.type) missing.push('Tool Type (Mold or Die)');
        }
        if (step === 2 && general.type === 'die') {
            const required = [
                ['DESC', 'Description'], ['CUST', 'Customer'], ['PPY', 'Parts Per Year'],
                ['PROJ_L', 'Project Life'], ['DTQB', 'Quote Deadline'], ['Press', 'Press Type'],
                ['No_cavities', 'Number of Cavities'], ['Ful_Auto_proc', 'Fully Automatic Process'],
                ['Presence_Detec', 'Presence Detectors'], ['Trim_proc', 'Trimming Process Condition'],
                ['Pun_pins_req', 'Punch Pins Required'], ['Castings_supp', 'Castings Supplied By'],
                ['Adjust_opt_tool_maker', 'Adjustments at Tool Maker'], ['Gas_spri', 'Gas Springs'],
            ];
            for (const [field, label] of required) {
                if (!dieTrim[field] || (typeof dieTrim[field] === 'string' && !dieTrim[field].trim())) {
                    missing.push(label);
                }
            }
        }
        if (step === 2 && general.type === 'mold') {
            const required = [
                ['DESC', 'Description'], ['CUST', 'Customer'], ['PPY', 'Parts Per Year'],
                ['PRLF', 'Project Life'], ['TT', 'Tool Type'], ['DTQ', 'Quote Deadline'],
                ['ELAB', 'Elaborated By'], ['Smach', 'Machine (Smach)'], ['No_CAV', 'Number of Cavities'],
            ];
            for (const [field, label] of required) {
                if (!moldP1[field] || (typeof moldP1[field] === 'string' && !moldP1[field].trim())) {
                    missing.push(label);
                }
            }
        }
        return missing;
    };

    const validateStep = () => {
        const missing = getMissingFields();
        if (missing.length === 0) return null;
        if (missing.length === 1) return `"${missing[0]}" is required.`;
        return `The following fields are required: ${missing.join(', ')}.`;
    };

    const handleNext = () => {
        const err = validateStep();
        if (err) { setFeedback({ type: 'error', message: err }); return; }
        setFeedback(null);
        setStep(s => Math.min(s + 1, TOTAL_STEPS));
    };

    const handleBack = () => {
        setFeedback(null);
        setStep(s => Math.max(s - 1, 1));
    };

    const submitRFQ = async (isDraft) => {
        const err = validateStep();
        if (err && !isDraft) { setFeedback({ type: 'error', message: err }); return; }

        setLoading(true);
        setFeedback(null);
        const token = Cookies.get('access_token');

        try {
            const response = await fetch(`${API_BASE}/api/rfq/crear/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(buildPayload(isDraft)),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error creating RFQ');
            }

            // Upload selected files for this RFQ
            const uploadErrors = [];
            const fileMap = [
                { file: files.pdf, type: 'pdf' },
                { file: files.ppt, type: 'presentation' },
                { file: files.cad, type: '3d' },
            ];
            for (const { file, type } of fileMap) {
                if (file) {
                    try { await uploadDocument(data.id_rfq, file, type); }
                    catch (e) { uploadErrors.push(`${type}: ${e.message}`); }
                }
            }

            const uploadNote = uploadErrors.length > 0 ? ` (upload errors: ${uploadErrors.join(', ')})` : '';
            setFeedback({
                type: uploadErrors.length > 0 ? 'error' : 'success',
                message: isDraft
                    ? `Draft saved — RFQ #${data.id_rfq}${uploadNote}`
                    : `RFQ #${data.id_rfq} submitted for approval${uploadNote}`,
            });

            if (!isDraft) {
                setTimeout(() => {
                    setStep(1);
                    setGeneral({ tool: '', type: '' });
                    setDieTrim(JSON.parse(JSON.stringify(formConfig.defaults.dieTrim)));
                    setDieBooleans(JSON.parse(JSON.stringify(formConfig.defaults.dieBooleans)));
                    setMoldP1(JSON.parse(JSON.stringify(formConfig.defaults.moldP1)));
                    setMoldP2(JSON.parse(JSON.stringify(formConfig.defaults.moldP2)));
                    setFiles({ pdf: null, ppt: null, cad: null });
                    setFeedback(null);
                }, 3000);
            }
        } catch (e) {
            setFeedback({ type: 'error', message: e.message });
        } finally {
            setLoading(false);
        }
    };

    // ── Loading guard ────────────────────────────────────────────────────────
    if (configLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: 'var(--background-secondary)' }}>
                <div className="text-center">
                    <RefreshCw size={24} style={{ color: 'var(--text-tertiary)' }} className="animate-spin mx-auto" />
                    <p className="text-sm mt-2" style={{ color: 'var(--text-tertiary)' }}>Loading form...</p>
                </div>
            </div>
        );
    }

    // ── Render helpers ────────────────────────────────────────────────────────
    const stepLabels = ['General Info', 'Technical Specs', 'Required Data & Files'];
    const { options } = formConfig;

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--background-secondary)' }}>
            <div className="max-w-5xl mx-auto px-6 py-8">

                {/* HEADER */}
                <div className="mb-6">
                    <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Create RFQ
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Request for Quotation — complete all sections before submitting
                    </p>
                </div>

                {/* STEPPER */}
                <div className="flex items-center gap-0 mb-8">
                    {stepLabels.map((label, i) => {
                        const n = i + 1;
                        const active = step === n;
                        const done = step > n;
                        return (
                            <div key={n} className="flex items-center flex-1 last:flex-none">
                                <div className="flex items-center gap-2">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                                        ${done ? 'bg-brand-success text-white' : active ? 'bg-brand-primary text-white' : 'bg-surface-active text-text-tertiary border border-border-default'}`}>
                                        {done ? '✓' : n}
                                    </div>
                                    <span className={`text-xs font-medium hidden sm:block ${active ? 'text-text-primary' : 'text-text-tertiary'}`}>
                                        {label}
                                    </span>
                                </div>
                                {i < stepLabels.length - 1 && (
                                    <div className="flex-1 h-px mx-3" style={{ backgroundColor: 'var(--border-default)' }} />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* FEEDBACK */}
                {feedback && (
                    <div className={`flex items-center gap-2 px-4 py-3 mb-4 text-sm border
                        ${feedback.type === 'success'
                            ? 'border-brand-success bg-brand-success/10 text-brand-success'
                            : 'border-brand-danger bg-brand-danger/10 text-brand-danger'}`}>
                        {feedback.type === 'success'
                            ? <CheckCircle size={16} />
                            : <AlertCircle size={16} />}
                        {feedback.message}
                    </div>
                )}

                {/* ── STEP 1: GENERAL INFO ── */}
                {step === 1 && (
                    <div className="bg-surface border border-border-default p-6">
                        <SectionTitle>General Information</SectionTitle>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <Input
                                    label="Tool Name / Identifier"
                                    placeholder="E.g., CVT AIR GUIDE BR01-25025-1003"
                                    value={general.tool}
                                    onChange={e => setGeneral(p => ({ ...p, tool: e.target.value }))}
                                    required
                                />
                            </div>
                            <Input
                                label="Tool Type"
                                variant="select"
                                value={general.type}
                                onChange={e => setGeneral(p => ({ ...p, type: e.target.value }))}
                                options={options.toolType}
                                required
                            />
                        </div>
                    </div>
                )}

                {/* ── STEP 2: DIE TECHNICAL SPECS ── */}
                {step === 2 && general.type === 'die' && (
                    <div className="space-y-4">
                        {/* Basic Info */}
                        <div className="bg-surface border border-border-default p-6">
                            <SectionTitle>Trim Die — Basic Information</SectionTitle>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="lg:col-span-2">
                                    <Input label="Description" placeholder="Part description"
                                        value={dieTrim.DESC} onChange={e => setDieField('DESC', e.target.value)} required />
                                </div>
                                <Input label="Part Number" placeholder="E.g., 900212614"
                                    value={dieTrim.PT_No} onChange={e => setDieField('PT_No', e.target.value)} />
                                <Input label="Customer" placeholder="Customer name"
                                    value={dieTrim.CUST} onChange={e => setDieField('CUST', e.target.value)} required />
                                <Input label="Parts Per Year" type="number" placeholder="E.g., 35000"
                                    value={dieTrim.PPY} onChange={e => setDieField('PPY', e.target.value)} />
                                <Input label="Project Life" placeholder="E.g., 6 Years"
                                    value={dieTrim.PROJ_L} onChange={e => setDieField('PROJ_L', e.target.value)} />
                                <Input label="Quote Deadline" type="date"
                                    value={dieTrim.DTQB} onChange={e => setDieField('DTQB', e.target.value)} />
                            </div>
                        </div>

                        {/* Tool Specs */}
                        <div className="bg-surface border border-border-default p-6">
                            <SectionTitle>Tool Specifications</SectionTitle>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <Input label="Press Type" placeholder="E.g., SEP 16-100"
                                    value={dieTrim.Press} onChange={e => setDieField('Press', e.target.value)} />
                                <Input label="Number of Cavities" placeholder="E.g., 1x"
                                    value={dieTrim.No_cavities} onChange={e => setDieField('No_cavities', e.target.value)} />
                                <Input label="Number of Hydraulic Slides"
                                    variant="select" value={dieTrim.No_hydra_slides}
                                    onChange={e => setDieField('No_hydra_slides', e.target.value)}
                                    options={options.hydraulicSlides} />
                                <Input label="Fully Automatic Process"
                                    variant="select" value={dieTrim.Ful_Auto_proc}
                                    onChange={e => setDieField('Ful_Auto_proc', e.target.value)}
                                    options={options.yesNoSimple} />
                                <Input label="Presence Detectors"
                                    variant="select" value={dieTrim.Presence_Detec}
                                    onChange={e => setDieField('Presence_Detec', e.target.value)}
                                    options={options.yesNoSimple} />
                                <Input label="Trimming Process Condition"
                                    variant="select" value={dieTrim.Trim_proc}
                                    onChange={e => setDieField('Trim_proc', e.target.value)}
                                    options={options.trimCondition} />
                                <Input label="Punch Pins Required"
                                    variant="select" value={dieTrim.Pun_pins_req}
                                    onChange={e => setDieField('Pun_pins_req', e.target.value)}
                                    options={options.yesNoSimple} />
                                <Input label="Admissible Residual Burr (mm)" type="number" placeholder="E.g., 0.2"
                                    value={dieTrim.Admissible_res_burr_mm}
                                    onChange={e => setDieField('Admissible_res_burr_mm', e.target.value)} />
                                <Input label="Castings Supplied by"
                                    variant="select" value={dieTrim.Castings_supp}
                                    onChange={e => setDieField('Castings_supp', e.target.value)}
                                    options={options.yesNoSimple} />
                                <Input label="Adjustments at Tool Maker's Facilities"
                                    variant="select" value={dieTrim.Adjust_opt_tool_maker}
                                    onChange={e => setDieField('Adjust_opt_tool_maker', e.target.value)}
                                    options={options.yesNoSimple} />
                                <Input label="Gas Springs"
                                    variant="select" value={dieTrim.Gas_spri}
                                    onChange={e => setDieField('Gas_spri', e.target.value)}
                                    options={options.yesNo} />
                            </div>
                        </div>
                    </div>
                )}

                {/* ── STEP 2: MOLD TECHNICAL SPECS ── */}
                {step === 2 && general.type === 'mold' && (
                    <div className="space-y-4">
                        {/* Basic Info */}
                        <div className="bg-surface border border-border-default p-6">
                            <SectionTitle>Mold — Basic Information</SectionTitle>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="lg:col-span-2">
                                    <Input label="Description" placeholder="Part description"
                                        value={moldP1.DESC} onChange={e => setMoldField('DESC', e.target.value)} required />
                                </div>
                                <Input label="Part Number (PNUM)" placeholder="E.g., NK4E-6675-AA"
                                    value={moldP1.PNUM} onChange={e => setMoldField('PNUM', e.target.value)} />
                                <Input label="Customer" placeholder="Customer name"
                                    value={moldP1.CUST} onChange={e => setMoldField('CUST', e.target.value)} required />
                                <Input label="Part Type (PT)" placeholder="E.g., Oil Pan"
                                    value={moldP1.PT} onChange={e => setMoldField('PT', e.target.value)} />
                                <Input label="Parts Per Year" type="number" placeholder="E.g., 35000"
                                    value={moldP1.PPY} onChange={e => setMoldField('PPY', e.target.value)} />
                                <Input label="Project Life" placeholder="E.g., 6 Years"
                                    value={moldP1.PRLF} onChange={e => setMoldField('PRLF', e.target.value)} />
                                <Input label="Tool Type (TT)" placeholder="E.g., Die Cast"
                                    value={moldP1.TT} onChange={e => setMoldField('TT', e.target.value)} />
                                <Input label="Quote Deadline" type="date"
                                    value={moldP1.DTQ} onChange={e => setMoldField('DTQ', e.target.value)} />
                                <Input label="Elaborated By" placeholder="Name"
                                    value={moldP1.ELAB} onChange={e => setMoldField('ELAB', e.target.value)} />
                            </div>
                        </div>

                        {/* Tool Specs */}
                        <div className="bg-surface border border-border-default p-6">
                            <SectionTitle>Mold — Tool Specifications</SectionTitle>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <Input label="Machine (Smach)" placeholder="E.g., Bühler 900T"
                                    value={moldP1.Smach} onChange={e => setMoldField('Smach', e.target.value)} />
                                <Input label="Number of Cavities" placeholder="E.g., 1x"
                                    value={moldP1.No_CAV} onChange={e => setMoldField('No_CAV', e.target.value)} />
                                <Input label="No. of Hydraulic Slides"
                                    value={moldP1.No_ofHS} onChange={e => setMoldField('No_ofHS', e.target.value)} placeholder="Defined by toolmaker" />
                                <Input label="No. of Mechanical Slides"
                                    value={moldP1.No_ofMS} onChange={e => setMoldField('No_ofMS', e.target.value)} placeholder="Defined by toolmaker" />
                                <Input label="Third Party Supplier"
                                    value={moldP1.ThirdPSupp} onChange={e => setMoldField('ThirdPSupp', e.target.value)} />
                                <Input label="No. of Subcontractors"
                                    value={moldP1.No_subc} onChange={e => setMoldField('No_subc', e.target.value)} />
                                <Input label="Jet Cooling (Jco)"
                                    value={moldP1.Jco} onChange={e => setMoldField('Jco', e.target.value)} />
                                <Input label="Quality Control System (QcSys)"
                                    value={moldP1.QcSys} onChange={e => setMoldField('QcSys', e.target.value)} />
                                <Input label="Integrated HT Control (Ihtcs)"
                                    value={moldP1.Ihtcs} onChange={e => setMoldField('Ihtcs', e.target.value)} />
                                <Input label="Spin" value={moldP1.Spin} onChange={e => setMoldField('Spin', e.target.value)} />
                                <Input label="HICS" value={moldP1.HICS} onChange={e => setMoldField('HICS', e.target.value)} />
                                <Input label="CMGOM" value={moldP1.CMGOM} onChange={e => setMoldField('CMGOM', e.target.value)} />
                                <Input label="SP for Thermo Regulation"
                                    value={moldP1.SPforThermoR} onChange={e => setMoldField('SPforThermoR', e.target.value)} />
                                <Input label="N Return Valve"
                                    value={moldP1.NReturnV} onChange={e => setMoldField('NReturnV', e.target.value)} />
                                <Input label="Vacuum Valve (VacV)"
                                    value={moldP1.VacV} onChange={e => setMoldField('VacV', e.target.value)} />
                                <Input label="Chill Block (ChillBl)"
                                    value={moldP1.ChillBl} onChange={e => setMoldField('ChillBl', e.target.value)} />
                                <Input label="No. Plate Jet Cooling Systems"
                                    value={moldP1.No_PlJcosys} onChange={e => setMoldField('No_PlJcosys', e.target.value)} />
                                <Input label="Other (Oth)" value={moldP1.Oth}
                                    onChange={e => setMoldField('Oth', e.target.value)} />
                            </div>
                        </div>
                    </div>
                )}

                {/* ── STEP 3: REQUIRED DATA + FILES ── */}
                {step === 3 && (
                    <div className="space-y-4">
                        {/* DIE: Required Data */}
                        {general.type === 'die' && (
                            <div className="bg-surface border border-border-default p-6">
                                <SectionTitle>Data Information Required in the Price of the Trim Die</SectionTitle>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>
                                            Design & Documentation
                                        </p>
                                        <CheckRow label="Design 3D Model" field="Desi_3D" notes={dieBooleans.Desi_3D} onCheck={setDieBool} onNote={setDieNote} />
                                        <CheckRow label="Design 2D Data" field="Desi_2D" notes={dieBooleans.Desi_2D} onCheck={setDieBool} onNote={setDieNote} />
                                        <CheckRow label="Punch Pins Data" field="Punch_Data" notes={dieBooleans.Punch_Data} onCheck={setDieBool} onNote={setDieNote} />
                                        <CheckRow label="Manufacturing Proposals" field="Manu_Propo" notes={dieBooleans.Manu_Propo} onCheck={setDieBool} onNote={setDieNote} />
                                        <CheckRow label="Latest Trim Die Improvements" field="Late_trim_imp" notes={dieBooleans.Late_trim_imp} onCheck={setDieBool} onNote={setDieNote} />
                                        <CheckRow label="Sketch of Trim Die Concept (incl. steel dimensions)" field="Sketch_die" notes={dieBooleans.Sketch_die} onCheck={setDieBool} onNote={setDieNote} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>
                                            Trim Die Deliverables
                                        </p>
                                        <CheckRow label="Trim Die No. 1" field="Trim_No_1" notes={dieBooleans.Trim_No_1} onCheck={setDieBool} onNote={setDieNote} />
                                        <CheckRow label="Trim Die No. 2" field="Trim_No_2" notes={dieBooleans.Trim_No_2} onCheck={setDieBool} onNote={setDieNote} />
                                        <CheckRow label="Set of Spare Parts (recommended by toolmaker)" field="Set_spare" notes={dieBooleans.Set_spare} onCheck={setDieBool} onNote={setDieNote} />
                                        <CheckRow label="Hydraulic Cylinders and Limit Switches" field="Hydra_Cylin_switch" notes={dieBooleans.Hydra_Cylin_switch} onCheck={setDieBool} onNote={setDieNote} />
                                        <p className="text-[10px] font-semibold uppercase tracking-wider mt-4 mb-2" style={{ color: 'var(--text-tertiary)' }}>
                                            Other Information
                                        </p>
                                        <CheckRow label="Frame Refurbishment" field="Frame_Refur" notes={dieBooleans.Frame_Refur} onCheck={setDieBool} onNote={setDieNote} />
                                        <CheckRow label="Set of Electric Wires" field="Set_elec_wires" notes={dieBooleans.Set_elec_wires} onCheck={setDieBool} onNote={setDieNote} />
                                        <CheckRow label="Delivery Date" field="Deli_date" notes={dieBooleans.Deli_date} onCheck={setDieBool} onNote={setDieNote} />
                                        <CheckRow label="Ejector System in Fixed Side" field="Ejec_syst_fix" notes={dieBooleans.Ejec_syst_fix} onCheck={setDieBool} onNote={setDieNote} />
                                        <CheckRow label="Others" field="Others" notes={dieBooleans.Others} onCheck={setDieBool} onNote={setDieNote} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* MOLD: Required Data P2 */}
                        {general.type === 'mold' && (
                            <div className="bg-surface border border-border-default p-6">
                                <SectionTitle>Data Information Required in the Price of the Mold</SectionTitle>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>
                                            Design & Documentation
                                        </p>
                                        <CheckRow label="3D Design" field="ThreeD" notes={moldP2.ThreeD} onCheck={setMoldBool} onNote={setMoldNote} />
                                        <CheckRow label="Flow Analysis" field="FlAn" notes={moldP2.FlAn} onCheck={setMoldBool} onNote={setMoldNote} />
                                        <CheckRow label="Runner Design" field="Run_des" notes={moldP2.Run_des} onCheck={setMoldBool} onNote={setMoldNote} />
                                        <CheckRow label="Runner and Overflow Modification" field="Run_and_over_mod" notes={moldP2.Run_and_over_mod} onCheck={setMoldBool} onNote={setMoldNote} />
                                        <CheckRow label="Manufacturing Proposals" field="ManProp" notes={moldP2.ManProp} onCheck={setMoldBool} onNote={setMoldNote} />
                                        <CheckRow label="LDI" field="Ldi" notes={moldP2.Ldi} onCheck={setMoldBool} onNote={setMoldNote} />
                                        <CheckRow label="Add. of Machining Steel" field="Add_of_mach_st" notes={moldP2.Add_of_mach_st} onCheck={setMoldBool} onNote={setMoldNote} />
                                        <CheckRow label="Sketch of Die Concept incl. Steel Dimensions" field="Sketch_d_conc_inc_s_dim" notes={moldP2.Sketch_d_conc_inc_s_dim} onCheck={setMoldBool} onNote={setMoldNote} />
                                        <CheckRow label="2D Drawing Design" field="TwoDDrDes" notes={moldP2.TwoDDrDes} onCheck={setMoldBool} onNote={setMoldNote} />
                                        <CheckRow label="3D Model (Solid)" field="ThreeDDModSolid" notes={moldP2.ThreeDDModSolid} onCheck={setMoldBool} onNote={setMoldNote} />
                                        <CheckRow label="Eyebolts" field="Eyeb" notes={moldP2.Eyeb} onCheck={setMoldBool} onNote={setMoldNote} />
                                        <CheckRow label="Oil/Water Connectors" field="OW_Conn" notes={moldP2.OW_Conn} onCheck={setMoldBool} onNote={setMoldNote} />
                                        <CheckRow label="STM 1/2" field="STM_1_2" notes={moldP2.STM_1_2} onCheck={setMoldBool} onNote={setMoldNote} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>
                                            Quality & Validation
                                        </p>
                                        <CheckRow label="CMM Dimensional Report CAI" field="CMM_dim_rep_cai" notes={moldP2.CMM_dim_rep_cai} onCheck={setMoldBool} onNote={setMoldNote} />
                                        <CheckRow label="GOM Report" field="GOM_rep" notes={moldP2.GOM_rep} onCheck={setMoldBool} onNote={setMoldNote} />
                                        <CheckRow label="H13 Validation Subcontracted In" field="H_val_subc_in" notes={moldP2.H_val_subc_in} onCheck={setMoldBool} onNote={setMoldNote} />
                                        <CheckRow label="Dimensional Corrections / Optimizations" field="Dim_corr_opt" notes={moldP2.Dim_corr_opt} onCheck={setMoldBool} onNote={setMoldNote} />
                                        <CheckRow label="Spotting Press" field="Sp_Pt" notes={moldP2.Sp_Pt} onCheck={setMoldBool} onNote={setMoldNote} />
                                        <CheckRow label="Complete Design" field="Comp_D" notes={moldP2.Comp_D} onCheck={setMoldBool} onNote={setMoldNote} />
                                        <CheckRow label="Subsequent Design" field="Subseq_D" notes={moldP2.Subseq_D} onCheck={setMoldBool} onNote={setMoldNote} />
                                        <CheckRow label="Set of Replacement H13 Steel" field="Set_of_repl_H13" notes={moldP2.Set_of_repl_H13} onCheck={setMoldBool} onNote={setMoldNote} />
                                        <CheckRow label="Spare Set of Ejector Inserts" field="Sp_set_of_EI" notes={moldP2.Sp_set_of_EI} onCheck={setMoldBool} onNote={setMoldNote} />
                                        <CheckRow label="FICF" field="FICF" notes={moldP2.FICF} onCheck={setMoldBool} onNote={setMoldNote} />
                                        <CheckRow label="HCLS" field="HCLS" notes={moldP2.HCLS} onCheck={setMoldBool} onNote={setMoldNote} />
                                        <CheckRow label="Frame Refurbishment" field="Fr_Refur" notes={moldP2.Fr_Refur} onCheck={setMoldBool} onNote={setMoldNote} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* FILE UPLOADS */}
                        <div className="bg-surface border border-border-default p-6">
                            <SectionTitle>Attachments</SectionTitle>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <UploadCard
                                    title="Technical PDF"
                                    subtitle="PDF documents"
                                    acceptedFileTypes={['pdf']}
                                    maxFileSize={20}
                                    expectedFileType="pdf"
                                    onFileUpload={(file) => setFiles(p => ({ ...p, pdf: file }))}
                                />
                                <UploadCard
                                    title="Presentation (PPT)"
                                    subtitle="PPT, PPTX"
                                    acceptedFileTypes={['ppt', 'pptx']}
                                    maxFileSize={20}
                                    expectedFileType="presentation"
                                    onFileUpload={(file) => setFiles(p => ({ ...p, ppt: file }))}
                                />
                                <UploadCard
                                    title="CAD / 3D Model"
                                    subtitle="STEP, STL, DWG, OBJ"
                                    acceptedFileTypes={['step', 'stl', 'dwg', 'obj', 'stp']}
                                    maxFileSize={100}
                                    expectedFileType="3d"
                                    onFileUpload={(file) => setFiles(p => ({ ...p, cad: file }))}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* NAVIGATION */}
                {(() => {
                    const missing = getMissingFields();
                    const hasAnyCheck = general.type === 'die'
                        ? dieBooleans && Object.values(dieBooleans).some(v => v.checked)
                        : moldP2 && Object.values(moldP2).some(v => v.checked);
                    const canSubmit = step === TOTAL_STEPS && hasAnyCheck && files.pdf !== null && files.cad !== null;

                    // Step-3 missing items for the Submit button hint
                    const step3Missing = step === TOTAL_STEPS ? [
                        ...(!hasAnyCheck ? ['at least one data checkbox'] : []),
                        ...(files.pdf === null ? ['Technical PDF'] : []),
                        ...(files.cad === null ? ['CAD / 3D Model'] : []),
                    ] : [];

                    return (
                        <>
                            <div className="flex justify-between items-center mt-6">
                                <div>
                                    {step > 1 && (
                                        <Button variant="outline" onClick={handleBack} disabled={loading}>
                                            <ChevronLeft size={16} /> Back
                                        </Button>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    {step >= 2 && (
                                        <Button variant="outline" onClick={() => submitRFQ(true)} disabled={loading}>
                                            <Save size={16} />
                                            {loading ? 'Saving...' : 'Save as Draft'}
                                        </Button>
                                    )}
                                    {step < TOTAL_STEPS ? (
                                        <Button variant="primary" onClick={handleNext} disabled={loading || !general.type}>
                                            Next <ChevronRight size={16} />
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="primary"
                                            onClick={() => submitRFQ(false)}
                                            disabled={loading || !canSubmit}
                                        >
                                            <Send size={16} />
                                            {loading ? 'Submitting...' : 'Submit for Approval'}
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Inline validation hints */}
                            {step < TOTAL_STEPS && missing.length > 0 && feedback?.type === 'error' && (
                                <div className="mt-3 p-3 border border-dashed" style={{ borderColor: 'var(--brand-danger)', backgroundColor: 'rgba(239,68,68,0.04)' }}>
                                    <p className="text-xs font-semibold mb-1" style={{ color: 'var(--brand-danger)' }}>
                                        Complete these fields before continuing:
                                    </p>
                                    <ul className="space-y-0.5">
                                        {missing.map(f => (
                                            <li key={f} className="text-xs flex items-center gap-1.5" style={{ color: 'var(--brand-danger)' }}>
                                                <span>•</span> {f}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {step === TOTAL_STEPS && step3Missing.length > 0 && (
                                <div className="mt-3 p-3 border border-dashed" style={{ borderColor: 'var(--status-pending)', backgroundColor: 'rgba(245,158,11,0.04)' }}>
                                    <p className="text-xs font-semibold mb-1" style={{ color: 'var(--status-pending)' }}>
                                        Required to Submit for Approval:
                                    </p>
                                    <ul className="space-y-0.5">
                                        {step3Missing.map(f => (
                                            <li key={f} className="text-xs flex items-center gap-1.5" style={{ color: 'var(--status-pending)' }}>
                                                <span>•</span> {f}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </>
                    );
                })()}

            </div>
        </div>
    );
}
