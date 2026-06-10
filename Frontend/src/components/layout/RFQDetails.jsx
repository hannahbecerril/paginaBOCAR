// components/layout/RFQDetails.jsx
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, Users, FileText, Package, Eye, Download, CheckCircle, Clock, User, Mail, Phone, DollarSign, Calendar, Truck, Building, MessageSquare, Edit, Save, X, Trash2, Plus, Upload, Trophy } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import IARecommendations from '../ui/IARecommendations'; // <--- IMPORTACIÓN DE IA CON RUTA RELATIVA
import {
    getRFQById, saveSpecifications, savePurchasesMetadata,
    submitRFQForReview, approveRFQInd,
    assignSuppliers, approveSupplierList, selectWinner, finalManagerDecision,
    downloadDocument, uploadDocument, getSuppliers, submitQuote,
} from '../../sections/api';
import UploadCard from '../ui/UploadCard';
import QuoteForm from '../../sections/Suppliers/QuoteForm';
import { STATUS, STATUS_LABEL } from '../../constants/rfqStatus';
export default function RFQDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [rfqData, setRfqData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [previewFile, setPreviewFile] = useState(null);
    const [selectedResponse, setSelectedResponse] = useState(null);
    const [error, setError] = useState(null);
    const [actionError, setActionError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Edit mode states
    const [editingSection, setEditingSection] = useState(null);
    const [editData, setEditData] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    // Supplier picker state (stage2)
    const [availableSuppliers, setAvailableSuppliers] = useState([]);
    const [suppliersLoading, setSuppliersLoading] = useState(false);
    const [supplierSearch, setSupplierSearch] = useState('');

    // Determine user role from URL path
    const userRole = location.pathname.includes('/Purchases/') ? 'purchases'
        : location.pathname.includes('/Suppliers/') ? 'suppliers'
            : 'industrialization';

    // Detect admin rank from stored user (to show Approve/Reject/Final Award buttons)
    const storedUser = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
    const userGroups = storedUser.grupos ?? [];
    const isAdmin = userGroups.some(g => g.includes('_Admin') || g === 'SuperAdmin');
    const storedUsername = storedUser.username ?? '';

    const reloadRFQ = () => {
        setLoading(true);
        setError(null);
        getRFQById(id)
            .then(rfq => {
                setRfqData(rfq);
                const firstDoc = rfq?.stage1?.data?.documents?.find(d => d.is3D);
                if (firstDoc) setPreviewFile(firstDoc);
            })
            .catch(err => { setError(err.message); setRfqData(null); })
            .finally(() => setLoading(false));
    };

    useEffect(() => { reloadRFQ(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

    // Generic wrapper for state-transition actions
    const runAction = async (fn, ...args) => {
        setActionLoading(true);
        setActionError(null);
        try {
            await fn(...args);
            await reloadRFQ();
        } catch (err) {
            setActionError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    // Status badge — uses snake_case keys from backend + "Draft"/"Final Quote" for response cards
    const getStatusBadgeStyle = (status) => {
        const styles = {
            [STATUS.IND_DRAFT]:             { color: 'var(--text-tertiary)',       backgroundColor: 'var(--surface-disabled)' },
            [STATUS.SENT_TO_PURCHASES]:     { color: 'var(--status-pending)',      backgroundColor: 'rgba(245, 158, 11, 0.1)' },
            [STATUS.PURCHASES_DRAFT]:       { color: 'var(--text-tertiary)',       backgroundColor: 'var(--surface-disabled)' },
            [STATUS.SENT_TO_SUPPLIERS]:     { color: 'var(--status-pending)',      backgroundColor: 'rgba(245, 158, 11, 0.1)' },
            [STATUS.WAITING_FOR_SUPPLIERS]: { color: 'var(--status-pending)',      backgroundColor: 'rgba(245, 158, 11, 0.1)' },
            [STATUS.SUPPLIER_SELECTED]:     { color: 'var(--status-active)',       backgroundColor: 'rgba(16, 185, 129, 0.1)' },
            [STATUS.RFQ_CLOSED]:            { color: 'var(--status-cancelled)',    backgroundColor: 'rgba(239, 68, 68, 0.1)' },
            'Draft':      { color: 'var(--text-tertiary)',    backgroundColor: 'var(--surface-disabled)' },
            'Final Quote':{ color: 'var(--status-active)',    backgroundColor: 'rgba(16, 185, 129, 0.1)' },
            'Responded':  { color: 'var(--status-completed)', backgroundColor: 'rgba(59, 130, 246, 0.1)' },
            'Selected':   { color: 'var(--status-active)',    backgroundColor: 'rgba(16, 185, 129, 0.1)' },
            'Pending':    { color: 'var(--status-pending)',   backgroundColor: 'rgba(245, 158, 11, 0.1)' },
        };
        return styles[status] || { color: 'var(--text-tertiary)', backgroundColor: 'var(--surface-disabled)' };
    };

    const getPriorityStyle = (priority) => {
        const styles = {
            High:     { color: 'var(--priority-high)',   backgroundColor: 'rgba(239, 68, 68, 0.1)' },
            Critical: { color: 'var(--priority-high)',   backgroundColor: 'rgba(239, 68, 68, 0.1)' },
            Medium:   { color: 'var(--priority-medium)', backgroundColor: 'rgba(245, 158, 11, 0.1)' },
            Low:      { color: 'var(--priority-low)',    backgroundColor: 'rgba(16, 185, 129, 0.1)' },
        };
        return styles[priority] || styles.Medium;
    };

    const canEditSection = (section) => {
        if (userRole === 'industrialization' && section === 'stage1') return true;
        if (userRole === 'purchases'        && section === 'stage2') return true;
        if (userRole === 'suppliers'        && section === 'stage3') return true;
        return false;
    };

    const canSeeSection = (section) => {
        if (userRole === 'suppliers' && section === 'stage2') return false;
        return true;
    };

    const shouldShowCreateResponse = () => {
        if (userRole !== 'suppliers' || !rfqData) return false;
        return rfqData.status === STATUS.SENT_TO_SUPPLIERS
            || rfqData.status === STATUS.WAITING_FOR_SUPPLIERS;
    };

    const hasSupplierResponse = () =>
        rfqData?.stage3?.data?.responses?.some(r => r.status === 'Final Quote') ?? false;

    const startEditing = (section) => {
        if (section === 'stage1') {
            setEditData({ specifications: { ...(rfqData.stage1?.data?.specifications ?? {}) } });
        } else if (section === 'stage2') {
            const currentIds = (rfqData.stage2?.data?.suppliers ?? []).map(s => s.id).filter(Boolean);
            setEditData({
                metadata: {
                    response_deadline: rfqData.response_deadline ?? '',
                    shipping_terms: rfqData.shipping_terms ?? '',
                    quality_requirements: rfqData.quality_requirements ?? '',
                },
                supplierIds: currentIds,
            });
            // Load available suppliers for the picker
            if (userRole === 'purchases') {
                setSuppliersLoading(true);
                setSupplierSearch('');
                getSuppliers()
                    .then(list => setAvailableSuppliers(list))
                    .catch(() => {})
                    .finally(() => setSuppliersLoading(false));
            }
        } else if (section === 'stage3') {
            setEditData({ responses: JSON.parse(JSON.stringify(rfqData.stage3?.data?.responses ?? [])) });
        }
        setEditingSection(section);
    };

    const addSupplierToRFQ = (id) =>
        setEditData(prev => ({ ...prev, supplierIds: [...(prev.supplierIds ?? []), id] }));

    const removeSupplierFromRFQ = (id) =>
        setEditData(prev => ({ ...prev, supplierIds: (prev.supplierIds ?? []).filter(x => x !== id) }));

    const saveSection = async () => {
        setIsSaving(true);
        try {
            if (editingSection === 'stage1') {
                const rfqType = rfqData.type;
                const payload = rfqType === 'mold'
                    ? { mold_info_p1: editData.specifications }
                    : { die_trim: editData.specifications };
                await saveSpecifications(rfqData.id, payload);
                setRfqData(prev => ({
                    ...prev,
                    stage1: { ...prev.stage1, data: { ...prev.stage1.data, specifications: { ...editData.specifications } } },
                }));

            } else if (editingSection === 'stage2') {
                await savePurchasesMetadata(rfqData.id, editData.metadata);
                setRfqData(prev => ({
                    ...prev,
                    stage2: { ...prev.stage2, data: { ...prev.stage2.data, metadata: { ...editData.metadata } } },
                }));

            } else if (editingSection === 'stage3') {
                // Determine if any response is being submitted as Final Quote
                const hasFinalQuote = editData.responses?.some(r => r.status === 'Final Quote');
                const isDraft = !hasFinalQuote;

                // Build minimal cost payload — Elaborated_by is set server-side from JWT
                const costPayload = rfqData.type === 'mold'
                    ? { mold_cost_p1: { Company: storedUsername, Country: 'MX', Base_currency: 'USD' } }
                    : { die_cost_p1: { Company: storedUsername, Country: 'MX' } };

                await submitQuote(rfqData.id, { is_draft: isDraft, ...costPayload });

                // Optimistic local update
                setRfqData(prev => ({
                    ...prev,
                    stage3: { ...prev.stage3, data: { ...prev.stage3.data, responses: [...editData.responses] } },
                }));
            }
            setEditingSection(null);
            setEditData({});
        } catch (err) {
            alert(`Error saving: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const cancelEditing = () => {
        setEditingSection(null);
        setEditData({});
    };

    const saveAndSubmit = async () => {
        setIsSaving(true);
        try {
            if (editingSection === 'stage1') {
                const rfqType = rfqData.type;
                const payload = rfqType === 'mold'
                    ? { mold_info_p1: editData.specifications }
                    : { die_trim: editData.specifications };
                await saveSpecifications(rfqData.id, payload);
            }
            await submitRFQForReview(rfqData.id, rfqData.type, rfqData.title ?? '');
            setEditingSection(null);
            setEditData({});
            reloadRFQ();
        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDocUpload = async (file, type) => {
        try {
            await uploadDocument(rfqData.id, file, type);
            reloadRFQ();
        } catch (err) {
            alert(`Upload failed: ${err.message}`);
        }
    };

    // Purchases stage2 — save metadata + change status + navigate
    const savePurchaseDraft = async () => {
        setIsSaving(true);
        try {
            await savePurchasesMetadata(rfqData.id, editData.metadata);
            const supplierIds = editData.supplierIds ?? [];
            await assignSuppliers(rfqData.id, supplierIds, true);   // is_draft=true → submitted_for_review=false
            setEditingSection(null);
            setEditData({});
            navigate('/Purchases/Drafts');
        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const submitForApproval = async () => {
        setIsSaving(true);
        try {
            await savePurchasesMetadata(rfqData.id, editData.metadata);
            const supplierIds = editData.supplierIds ?? [];
            await assignSuppliers(rfqData.id, supplierIds, false);  // is_draft=false → submitted_for_review=true
            setEditingSection(null);
            setEditData({});
            navigate('/Purchases/Drafts');
        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const sendToSuppliers = async () => {
        setIsSaving(true);
        try {
            await savePurchasesMetadata(rfqData.id, editData.metadata);
            await approveSupplierList(rfqData.id, 'aprobar');
            setEditingSection(null);
            setEditData({});
            navigate('/Purchases/All-RFQ');
        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const deleteResponse = (responseId) => {
        if (window.confirm('Are you sure you want to delete this response?')) {
            setRfqData(prev => ({
                ...prev,
                stage3: {
                    ...prev.stage3,
                    data: {
                        ...prev.stage3.data,
                        responses: prev.stage3.data.responses.filter(r => r.id !== responseId),
                    },
                },
            }));
            if (selectedResponse?.id === responseId) setSelectedResponse(null);
        }
    };

    const createNewResponse = () => {
        const newResponse = {
            id: Date.now(),
            supplier: 'New Supplier',
            contact: '',
            email: '',
            phone: '',
            status: 'Draft',
            amount: null,
            unitPrice: null,
            deliveryTime: '',
            submittedDate: null,
            documents: [],
            details: {},
        };
        setRfqData(prev => ({
            ...prev,
            stage3: {
                ...(prev.stage3 ?? { name: 'Suppliers', data: { responses: [], statistics: {} } }),
                data: {
                    ...(prev.stage3?.data ?? { responses: [] }),
                    responses: [...(prev.stage3?.data?.responses ?? []), newResponse],
                },
            },
        }));
    };

    const updateSpecification = (key, value) =>
        setEditData(prev => ({ ...prev, specifications: { ...prev.specifications, [key]: value } }));

    const updateMetadata = (key, value) =>
        setEditData(prev => ({ ...prev, metadata: { ...prev.metadata, [key]: value } }));

    const updateResponseField = (responseId, field, value) =>
        setEditData(prev => ({
            ...prev,
            responses: prev.responses.map(r => r.id === responseId ? { ...r, [field]: value } : r),
        }));

    const deleteResponseInEdit = (responseId) =>
        setEditData(prev => ({
            ...prev,
            responses: prev.responses.filter(r => r.id !== responseId),
        }));

    const statusStyle   = getStatusBadgeStyle(rfqData?.status);
    const priorityStyle = getPriorityStyle(rfqData?.priority);
    const hasStage1 = !!rfqData?.stage1;
    const hasStage2 = !!rfqData?.stage2;
    const hasStage3 = !!rfqData?.stage3;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background-secondary)' }}>
                <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-brand-accent border-t-transparent" />
                    <p className="text-sm mt-2" style={{ color: 'var(--text-tertiary)' }}>Loading RFQ data...</p>
                </div>
            </div>
        );
    }

    if (!rfqData) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background-secondary)' }}>
                <div className="text-center">
                    <Package size={48} style={{ color: 'var(--text-tertiary)' }} />
                    <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                        {error ?? 'RFQ not found'}
                    </p>
                    <button onClick={() => navigate(-1)} className="mt-4 text-sm" style={{ color: 'var(--brand-accent)' }}>Go Back</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--background-secondary)' }}>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-surface-hover transition-colors" style={{ color: 'var(--text-secondary)' }}>
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                                    {rfqData.title}
                                </h1>
                                <span className="px-2.5 py-0.5 text-xs font-medium border" style={statusStyle}>
                                    {STATUS_LABEL[rfqData.status] ?? rfqData.status}
                                </span>
                                {rfqData.priority && (
                                    <span className="px-2.5 py-0.5 text-xs font-medium border" style={priorityStyle}>
                                        {rfqData.priority}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                                ID: {rfqData.id} • Modified: {rfqData.lastModified} • By: {rfqData.createdBy}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline"><Download size={16} /> Export</Button>
                    </div>
                </div>

                {/* Banner de Adjudicacion */}
                {userRole === 'suppliers' && rfqData.is_winner && (
                    <div className="mb-6 flex items-start gap-4 p-5 rounded-lg border shadow-sm" 
                         style={{ 
                             backgroundColor: 'rgba(16, 185, 129, 0.08)', 
                             borderColor: 'rgba(16, 185, 129, 0.3)' 
                         }}>
                        <div className="p-3 rounded-full" style={{ backgroundColor: 'var(--status-active)' }}>
                            <Trophy size={28} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold" style={{ color: 'var(--status-active)' }}>
                                ¡Felicidades! Cotización Adjudicada
                            </h2>
                            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                                Bocar Group ha aprobado el fallo gerencial a tu favor y has sido seleccionado como el proveedor oficial para este requerimiento. 
                                El equipo de Compras se pondrá en contacto contigo a la brevedad para la emisión de la Orden de Compra (PO) y los siguientes pasos.
                            </p>
                        </div>
                    </div>
                )}

                {/* RFQ meta info */}
                <Card className="mb-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div><span className="text-xs uppercase tracking-wider block" style={{ color: 'var(--text-tertiary)' }}>Type</span>{rfqData.type}</div>
                        <div><span className="text-xs uppercase tracking-wider block" style={{ color: 'var(--text-tertiary)' }}>Category</span>{rfqData.category || '—'}</div>
                        <div><span className="text-xs uppercase tracking-wider block" style={{ color: 'var(--text-tertiary)' }}>For Review</span>{rfqData.submitted_for_review ? 'Yes' : 'No'}</div>
                        {rfqData.is_winner !== null && rfqData.is_winner !== undefined && (
                            <div><span className="text-xs uppercase tracking-wider block" style={{ color: 'var(--text-tertiary)' }}>Your Bid</span>
                                {rfqData.is_winner ? '✅ Selected' : '❌ Not selected'}
                            </div>
                        )}
                    </div>
                </Card>

                <div className="space-y-6">
                    {/* Stage 1: Industrialization */}
                    {hasStage1 && canSeeSection('stage1') && (
                        <Card title="1. Industrialization">
                            {rfqData.stage1.approvedBy && (
                                <div className="mb-4 p-3 border-l-4 flex justify-between items-center" style={{ borderLeftColor: 'var(--brand-accent)', backgroundColor: 'var(--background-tertiary)' }}>
                                    <div>
                                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Approved by: {rfqData.stage1.approvedBy.name}</p>
                                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{rfqData.stage1.approvedBy.role}</p>
                                    </div>
                                    {rfqData.stage1.approvedBy.approvedDate && <CheckCircle size={20} style={{ color: 'var(--status-completed)' }} />}
                                </div>
                            )}

                            {/* Specifications */}
                            <div className="mb-6">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Technical Specifications</h3>
                                    {canEditSection('stage1') && editingSection !== 'stage1' && (
                                        <button onClick={() => startEditing('stage1')} className="text-xs flex items-center gap-1" style={{ color: 'var(--brand-accent)' }}>
                                            <Edit size={12} /> Edit
                                        </button>
                                    )}
                                </div>

                                {editingSection === 'stage1' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {Object.entries(editData.specifications || {}).map(([key, value]) => (
                                            <div key={key} className="p-3 border border-border-default">
                                                <label className="text-xs block" style={{ color: 'var(--text-tertiary)' }}>{key}</label>
                                                <input
                                                    type="text"
                                                    value={value ?? ''}
                                                    onChange={(e) => updateSpecification(key, e.target.value)}
                                                    className="w-full mt-1 px-2 py-1 text-sm border border-border-default focus:outline-none focus:ring-1 focus:ring-brand-accent bg-surface"
                                                    style={{ color: 'var(--text-primary)' }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {Object.entries(rfqData.stage1.data.specifications ?? {})
                                            .filter(([key]) => !(userRole === 'suppliers' && ['CUST', 'ELAB'].includes(key)))
                                            .map(([key, value]) => (
                                            <div key={key} className="p-3 border border-border-default">
                                                <label className="text-xs block" style={{ color: 'var(--text-tertiary)' }}>{key}</label>
                                                <p className="text-sm mt-1 font-medium" style={{ color: 'var(--text-primary)' }}>{String(value ?? '—')}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Documents */}
                            <div>
                                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>Documents</h3>

                                {previewFile?.is3D && (
                                    <div className="mb-4 border border-border-default">
                                        <div className="p-2 border-b" style={{ backgroundColor: 'var(--background-tertiary)' }}>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm">3D Preview: {previewFile.name}</span>
                                                <button onClick={() => setPreviewFile(null)} className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Close</button>
                                            </div>
                                        </div>
                                        <div className="p-8 flex justify-center items-center" style={{ minHeight: '250px', backgroundColor: 'var(--surface-hover)' }}>
                                            <div className="text-center">
                                                <Package size={48} style={{ color: 'var(--text-tertiary)' }} />
                                                <p className="text-sm mt-2">3D Viewer Placeholder</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    {(rfqData.stage1.data.documents ?? []).map((doc) => (
                                        <div key={doc.id} className="flex justify-between items-center p-3 border border-border-default hover:bg-surface-hover">
                                            <div className="flex items-center gap-2">
                                                {doc.is3D ? <Package size={14} style={{ color: 'var(--brand-accent)' }} /> : <FileText size={14} style={{ color: 'var(--text-tertiary)' }} />}
                                                <div>
                                                    <span className="text-sm">{doc.name}</span>
                                                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{doc.date} • by {doc.uploadedBy}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-3">
                                                {doc.is3D && <button onClick={() => setPreviewFile(doc)} className="text-xs" style={{ color: 'var(--brand-accent)' }}>Preview 3D</button>}
                                                <button className="text-xs" style={{ color: 'var(--brand-accent)' }}
                                                    onClick={() => downloadDocument(rfqData.id, doc.id, doc.name).catch(e => alert(e.message))}>
                                                    Download
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {(rfqData.stage1.data.documents ?? []).length === 0 && (
                                        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No documents attached.</p>
                                    )}
                                </div>

                                {editingSection === 'stage1' && userRole === 'industrialization' && rfqData.status === STATUS.IND_DRAFT && (
                                    <div className="mt-4 pt-3 border-t">
                                        <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>
                                            <Upload size={12} className="inline mr-1" />
                                            Replace / Add Documents
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <UploadCard
                                                title="Technical PDF"
                                                subtitle="PDF documents"
                                                acceptedFileTypes={['pdf']}
                                                maxFileSize={20}
                                                expectedFileType="pdf"
                                                onFileUpload={(file) => handleDocUpload(file, 'pdf')}
                                            />
                                            <UploadCard
                                                title="Presentation (PPT)"
                                                subtitle="PPT, PPTX"
                                                acceptedFileTypes={['ppt', 'pptx']}
                                                maxFileSize={20}
                                                expectedFileType="presentation"
                                                onFileUpload={(file) => handleDocUpload(file, 'presentation')}
                                            />
                                            <UploadCard
                                                title="CAD / 3D Model"
                                                subtitle="STEP, STL, DWG, OBJ"
                                                acceptedFileTypes={['step', 'stl', 'dwg', 'obj', 'stp']}
                                                maxFileSize={100}
                                                expectedFileType="3d"
                                                onFileUpload={(file) => handleDocUpload(file, '3d')}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {editingSection === 'stage1' && (
                                <div className="flex justify-end gap-2 mt-4 pt-3 border-t flex-wrap">
                                    <Button variant="outline" size="sm" onClick={cancelEditing} disabled={isSaving}>Cancel</Button>
                                    <Button variant="outline" size="sm" onClick={saveSection} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</Button>
                                    {rfqData.status === STATUS.IND_DRAFT && userRole === 'industrialization' && (
                                        <Button variant="primary" size="sm" onClick={saveAndSubmit} disabled={isSaving}>
                                            {isSaving ? 'Submitting...' : 'Submit for Approval'}
                                        </Button>
                                    )}
                                </div>
                            )}
                        </Card>
                    )}

                    {/* Stage 2: Purchases */}
                    {hasStage2 && canSeeSection('stage2') && (
                        <Card title="2. Purchases">
                            <div className="overflow-x-auto mb-6">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Suppliers List</h3>
                                    {canEditSection('stage2') && editingSection !== 'stage2' && (
                                        <button onClick={() => startEditing('stage2')} className="text-xs flex items-center gap-1" style={{ color: 'var(--brand-accent)' }}>
                                            <Edit size={12} /> Edit
                                        </button>
                                    )}
                                </div>
                                <table className="min-w-full divide-y" style={{ divideColor: 'var(--border-default)' }}>
                                    <thead style={{ backgroundColor: 'var(--background-tertiary)' }}>
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs">Supplier</th>
                                            <th className="px-3 py-2 text-left text-xs">Email</th>
                                            <th className="px-3 py-2 text-left text-xs">Status</th>
                                            <th className="px-3 py-2 text-left text-xs">Responded</th>
                                            <th className="px-3 py-2 text-left text-xs">Deadline</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(rfqData.stage2.data.suppliers ?? []).map((s) => (
                                            <tr key={s.id} className="border-b border-border-light">
                                                <td className="px-3 py-2 text-sm">{s.name}</td>
                                                <td className="px-3 py-2 text-sm">{s.email || '—'}</td>
                                                <td className="px-3 py-2 text-sm">
                                                    <span className="px-2 py-0.5 text-xs border" style={getStatusBadgeStyle(s.status)}>{s.status}</span>
                                                </td>
                                                <td className="px-3 py-2 text-sm">{s.has_responded ? '✅' : '—'}</td>
                                                <td className="px-3 py-2 text-sm">{s.deadline || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div>
                                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>RFQ Details</h3>
                                {editingSection === 'stage2' ? (
                                    <div className="space-y-4">
                                        

{rfqData?.ia_predictions?.predictions ? (
    <div className="mb-4">
        {/* Aquí enviamos la lista tal cual */}
        <IARecommendations data={rfqData.ia_predictions.predictions} />
    </div>
) : (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-sm text-yellow-700">
            Aún no hay predicciones en el objeto (ia_predictions es: {JSON.stringify(rfqData?.ia_predictions)})
        </p>
    </div>
)}
                                        {/* Metadata fields */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            {Object.entries(editData.metadata || {}).map(([k, v]) => (
                                                <div key={k} className="p-2 border border-border-default">
                                                    <label className="text-xs block mb-1 capitalize" style={{ color: 'var(--text-tertiary)' }}>
                                                        {k.replace(/_/g, ' ')}
                                                    </label>
                                                    <input
                                                        type={k === 'response_deadline' ? 'date' : 'text'}
                                                        value={v ?? ''}
                                                        onChange={(e) => updateMetadata(k, e.target.value)}
                                                        className="w-full px-2 py-1.5 text-sm border border-border-default focus:outline-none focus:ring-1 focus:ring-brand-accent bg-surface"
                                                        style={{ color: 'var(--text-primary)' }}
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        {/* Supplier picker */}
                                        <div className="border border-border-default p-3">
                                            <h4 className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center justify-between" style={{ color: 'var(--text-tertiary)' }}>
                                                Assign Suppliers
                                                <span className="normal-case font-normal" style={{ color: (editData.supplierIds ?? []).length === 0 ? 'var(--brand-danger)' : 'var(--status-active)' }}>
                                                    {(editData.supplierIds ?? []).length === 0 ? '⚠ At least one supplier required' : `${(editData.supplierIds ?? []).length} selected`}
                                                </span>
                                            </h4>

                                            {/* Selected suppliers */}
                                            {(editData.supplierIds ?? []).length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 mb-3">
                                                    {(editData.supplierIds ?? []).map(id => {
                                                        const s = availableSuppliers.find(x => x.id === id);
                                                        return (
                                                            <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs border" style={{ color: 'var(--status-active)', borderColor: 'var(--status-active)', backgroundColor: 'rgba(16,185,129,0.08)' }}>
                                                                {s?.name ?? s?.username ?? `ID ${id}`}
                                                                <button onClick={() => removeSupplierFromRFQ(id)} className="ml-1 hover:text-brand-danger" title="Remove">×</button>
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* Search & add */}
                                            <input
                                                type="text"
                                                value={supplierSearch}
                                                onChange={e => setSupplierSearch(e.target.value)}
                                                placeholder={suppliersLoading ? 'Loading suppliers…' : 'Search suppliers to add…'}
                                                disabled={suppliersLoading}
                                                className="w-full px-3 py-1.5 text-sm border border-border-default focus:outline-none focus:ring-1 focus:ring-brand-accent bg-surface mb-2"
                                                style={{ color: 'var(--text-primary)' }}
                                            />
                                            <div className="max-h-32 overflow-y-auto border border-border-light">
                                                {availableSuppliers
                                                    .filter(s => !(editData.supplierIds ?? []).includes(s.id))
                                                    .filter(s => {
                                                        const q = supplierSearch.toLowerCase();
                                                        return !q || (s.name ?? '').toLowerCase().includes(q) || (s.username ?? '').toLowerCase().includes(q) || (s.email ?? '').toLowerCase().includes(q);
                                                    })
                                                    .map(s => (
                                                        <button
                                                            key={s.id}
                                                            onClick={() => addSupplierToRFQ(s.id)}
                                                            className="w-full text-left px-3 py-2 text-sm hover:bg-surface-hover flex items-center justify-between border-b border-border-light last:border-0"
                                                            style={{ color: 'var(--text-primary)' }}
                                                        >
                                                            <span>{s.name || s.username}</span>
                                                            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{s.email}</span>
                                                        </button>
                                                    ))}
                                                {!suppliersLoading && availableSuppliers.filter(s => !(editData.supplierIds ?? []).includes(s.id)).length === 0 && (
                                                    <p className="px-3 py-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>No more suppliers to add.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {Object.entries(rfqData.stage2.data.metadata ?? {}).map(([k, v]) => (
                                            <div key={k} className="p-2 border border-border-default">
                                                <label className="text-xs block" style={{ color: 'var(--text-tertiary)' }}>{k.replace(/([A-Z])/g, ' $1').trim()}</label>
                                                <p className="text-sm">{v || '—'}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {editingSection === 'stage2' && (() => {
                                const hasSupplier = (editData.supplierIds ?? []).length > 0;
                                return (
                                    <div className="flex justify-end gap-2 mt-4 pt-3 border-t flex-wrap">
                                        <Button variant="outline" size="sm" onClick={cancelEditing} disabled={isSaving}>Cancel</Button>
                                        <Button variant="outline" size="sm" onClick={savePurchaseDraft} disabled={isSaving}>
                                            {isSaving ? 'Saving...' : 'Save as Draft'}
                                        </Button>
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={submitForApproval}
                                            disabled={isSaving || !hasSupplier}
                                            title={!hasSupplier ? 'Assign at least one supplier first' : ''}
                                        >
                                            {isSaving ? 'Submitting...' : 'Submit for Approval'}
                                        </Button>
                                    </div>
                                );
                            })()}
                        </Card>
                    )}

                    {/* Stage 3: Supplier Responses */}
                    {hasStage3 && canSeeSection('stage3') && (
                        <Card title="3. Supplier Responses">
                            {/* Statistics bar — visible to all */}
                            <div className="flex gap-4 mb-4 pb-2 border-b flex-wrap">
                                <div className="flex items-center gap-2">
                                    <Users size={14} />
                                    <span className="text-sm">
                                        Received: {rfqData.stage3.data.statistics?.responsesReceived ?? 0} / {rfqData.stage3.data.statistics?.totalInvited ?? 0}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Truck size={14} />
                                    <span className="text-sm">
                                        Final Quotes: {rfqData.stage3.data.responses.filter(r => r.status === 'Final Quote').length}
                                    </span>
                                </div>
                            </div>

                            {/* Supplier role: show the full cost-breakdown quote form */}
                            {userRole === 'suppliers' && shouldShowCreateResponse() && (
                                <QuoteForm
                                    rfqId={rfqData.id}
                                    rfqType={rfqData.type}
                                    existingResponses={rfqData.stage3.data.responses}
                                    onSubmitSuccess={() => navigate('/Suppliers/All-RFQ')}
                                />
                            )}

                            {/* Purchases / Ind role: read-only comparison cards */}
                            {userRole !== 'suppliers' && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {rfqData.stage3.data.responses.map((response) => (
                                        <div key={response.supplier} className={`border-2 p-4 ${selectedResponse?.supplier === response.supplier ? 'border-brand-accent' : 'border-border-default'}`}>
                                            <div className="flex justify-between items-start mb-3">
                                                <h4 className="font-semibold">{response.supplier}</h4>
                                                <div className="flex gap-2">
                                                    <span className="px-2 py-0.5 text-xs border" style={getStatusBadgeStyle(response.status)}>{response.status}</span>
                                                    {canEditSection('stage3') && (
                                                        <button onClick={() => deleteResponse(response.id)} className="text-red-500"><Trash2 size={14} /></button>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-1 text-sm mb-3">
                                                {response.amount != null && (
                                                    <div className="flex justify-between pt-1"><span>Amount:</span><strong>{response.amount}</strong></div>
                                                )}
                                                {response.deliveryTime && (
                                                    <div className="flex justify-between"><span>Delivery:</span>{response.deliveryTime}</div>
                                                )}
                                            </div>
                                            <button onClick={() => setSelectedResponse(selectedResponse?.supplier === response.supplier ? null : response)} className="w-full py-2 text-sm" style={{ backgroundColor: 'var(--surface-hover)' }}>
                                                {selectedResponse?.supplier === response.supplier ? 'Hide Details' : 'View Details'}
                                            </button>

                                            {selectedResponse?.supplier === response.supplier && (
                                                <div className="mt-4 pt-4 border-t">
                                                    <h5 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                                        <DollarSign size={16} style={{ color: 'var(--brand-accent)' }} /> 
                                                        Quote Summary
                                                    </h5>
                                                    <div className="bg-surface rounded-md border p-3">
                                                        <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                                                            {rfqData.type === 'mold' ? (
                                                                <>
                                                                    <div><span className="text-xs text-text-tertiary block">Material Cost</span><span className="font-medium">${Number((response.info1 || {}).MatCst_M1_PrBd || 0).toLocaleString()}</span></div>
                                                                    <div><span className="text-xs text-text-tertiary block">Manufacturing Cost</span><span className="font-medium">${Number((response.info1 || {}).ManCst_M1_PrBd || 0).toLocaleString()}</span></div>
                                                                    <div><span className="text-xs text-text-tertiary block">Logistics Cost</span><span className="font-medium">${Number((response.info1 || {}).LogCst_M1_PrBd || 0).toLocaleString()}</span></div>
                                                                    <div className="col-span-2 pt-2 mt-1 border-t"><span className="text-xs text-text-tertiary block">GRAND TOTAL</span><span className="text-lg font-bold" style={{ color: 'var(--brand-accent)' }}>${Number((response.info1 || {}).GrTot_M1_PrBd || 0).toLocaleString()}</span></div>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <div><span className="text-xs text-text-tertiary block">Material Cost</span><span className="font-medium">${Number((response.info1 || {}).MatCst_TD1_PrBd || 0).toLocaleString()}</span></div>
                                                                    <div><span className="text-xs text-text-tertiary block">Manufacturing Cost</span><span className="font-medium">${Number((response.info1 || {}).ManuCst_TD1_PrBd || 0).toLocaleString()}</span></div>
                                                                    <div><span className="text-xs text-text-tertiary block">Logistics Cost</span><span className="font-medium">${Number((response.info1 || {}).Logis_TD1_PrBd || 0).toLocaleString()}</span></div>
                                                                    <div className="col-span-2 pt-2 mt-1 border-t"><span className="text-xs text-text-tertiary block">GRAND TOTAL</span><span className="text-lg font-bold" style={{ color: 'var(--brand-accent)' }}>${Number((response.info1 || {}).GrTotal_TD1_PrBd || 0).toLocaleString()}</span></div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                    
{userRole === 'purchases' && rfqData.status === STATUS.WAITING_FOR_SUPPLIERS && (
    <div className="flex gap-2 mt-4">
        <Button size="sm" disabled={actionLoading}
            onClick={() => {
                const supplierId = rfqData.stage2?.data?.suppliers?.find(
                    s => s.name === response.supplier || s.username === response.supplier
                )?.id;
                if (!supplierId) { setActionError('Cannot identify supplier ID.'); return; }
                runAction(selectWinner, rfqData.id, supplierId);
            }}>
            <CheckCircle size={16} className="mr-2" />
            Propose this Supplier (Wait for Admin)
        </Button>
    </div>
)}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    )}

                    {/* ── State Transition Action Bar ────────────────────────────── */}
                    {actionError && (
                        <div className="px-4 py-3 border text-sm" style={{ color: 'var(--brand-danger)', borderColor: 'var(--brand-danger)', backgroundColor: 'rgba(239,68,68,0.1)' }}>
                            {actionError}
                        </div>
                    )}

                    <ActionBar
                        rfqData={rfqData}
                        userRole={userRole}
                        isAdmin={isAdmin}
                        loading={actionLoading}
                        onAction={runAction}
                    />
                </div>
            </div>
        </div>
    );
}

// ── Action Bar ─────────────────────────────────────────────────────────────────
function ActionBar({ rfqData, userRole, isAdmin, loading, onAction }) {
    if (!rfqData) return null;
    const { status, submitted_for_review, type, title, id } = rfqData;

    const btn = (label, fn, variant = 'primary') => (
        <Button key={label} variant={variant} disabled={loading} onClick={() => onAction(fn)}>
            {loading ? 'Working…' : label}
        </Button>
    );

    const actions = [];

    // ── Industrialization ──────────────────────────────────────────────────────
    if (userRole === 'industrialization') {
        if (status === STATUS.IND_DRAFT && !submitted_for_review && !isAdmin) {
            actions.push(btn('Submit for Approval', () => submitRFQForReview(id, type, title ?? '')));
        }
        if (status === STATUS.IND_DRAFT && submitted_for_review && !isAdmin) {
            actions.push(
                <span key="pending" className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    ⏳ Waiting for Ind. Admin review
                </span>
            );
        }
        // Ind_Admin: approve or reject
        if (status === STATUS.IND_DRAFT && submitted_for_review && isAdmin) {
            actions.push(btn('Approve →  Purchases', () => approveRFQInd(id, true)));
            actions.push(btn('Reject (return to engineer)', () => approveRFQInd(id, false), 'outline'));
        }
    }

    // ── Purchases ─────────────────────────────────────────────────────────────
   // ── Purchases ─────────────────────────────────────────────────────────────
    if (userRole === 'purchases') {
        // Purchases_Admin: approve or reject supplier list
        if (isAdmin && status === STATUS.PURCHASES_DRAFT && submitted_for_review) {
            actions.push(btn('Approve Supplier List → Publish', () => approveSupplierList(id, 'aprobar')));
            actions.push(btn('Reject (return to Purchases)', () => approveSupplierList(id, 'rechazar'), 'outline'));
        }
        if (!isAdmin && status === STATUS.PURCHASES_DRAFT && submitted_for_review) {
            actions.push(
                <span key="pending" className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    ⏳ Waiting for Purchases Admin approval
                </span>
            );
        }

        // --- NUEVO: Indicador para el usuario normal cuando ya propuso al ganador ---
        if (!isAdmin && status === STATUS.SUPPLIER_SELECTED) {
            actions.push(
                <span key="pending-award" className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    ⏳ Waiting for Purchases Admin final award approval
                </span>
            );
        }

        // Purchases_Admin: final manager decision
        if (isAdmin && status === STATUS.SUPPLIER_SELECTED) {
            actions.push(btn('Final Award — Close RFQ', () => finalManagerDecision(id, 'aprobar')));
            actions.push(btn('Reject — Re-evaluate Suppliers', () => finalManagerDecision(id, 'rechazar'), 'outline'));
        }
    }

    // ── Suppliers ─────────────────────────────────────────────────────────────
    // (Quote creation handled via stage3 edit + save)

    if (actions.length === 0) return null;

    return (
        <div className="mt-6 pt-4 border-t border-border-default">
            <div className="flex flex-wrap gap-3 justify-end">
                {actions}
            </div>
        </div>
    );
}