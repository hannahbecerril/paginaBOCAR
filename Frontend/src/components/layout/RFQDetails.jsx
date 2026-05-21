// components/layout/RFQDetails.jsx
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, Users, FileText, Package, Eye, Download, CheckCircle, Clock, User, Mail, Phone, DollarSign, Calendar, Truck, Building, MessageSquare, Edit, Save, X, Trash2, Plus } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import rfqsData from '../../sections/rfqs-data.json';

export default function RFQDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [rfqData, setRfqData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [previewFile, setPreviewFile] = useState(null);
    const [selectedResponse, setSelectedResponse] = useState(null);

    // Edit mode states
    const [editingSection, setEditingSection] = useState(null);
    const [editData, setEditData] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    // Determine user role from URL path
    const userRole = location.pathname.includes('/Purchases/') ? 'purchases'
        : location.pathname.includes('/Suppliers/') ? 'suppliers'
            : 'industrialization';

    useEffect(() => {
        const rfq = rfqsData.rfqs.find(r => r.id === id);
        if (rfq) {
            setRfqData(JSON.parse(JSON.stringify(rfq))); // Deep copy for editing
            if (rfq.stage1?.data?.defaultPreviewFile) {
                const defaultFile = rfq.stage1.data.documents.find(d => d.id === rfq.stage1.data.defaultPreviewFile);
                if (defaultFile) setPreviewFile(defaultFile);
            }
        }
        setLoading(false);
    }, [id]);

    const getStatusBadgeStyle = (status) => {
        const styles = {
            'industrialization draft': { color: 'var(--text-tertiary)', backgroundColor: 'var(--surface-disabled)' },
            'sent to purchases': { color: 'var(--status-pending)', backgroundColor: 'rgba(245, 158, 11, 0.1)' },
            'purchases draft': { color: 'var(--text-tertiary)', backgroundColor: 'var(--surface-disabled)' },
            'sent to suppliers': { color: 'var(--status-pending)', backgroundColor: 'rgba(245, 158, 11, 0.1)' },
            'waiting for suppliers': { color: 'var(--status-pending)', backgroundColor: 'rgba(245, 158, 11, 0.1)' },
            'supplier response': { color: 'var(--status-completed)', backgroundColor: 'rgba(59, 130, 246, 0.1)' },
            'supplier selected': { color: 'var(--status-active)', backgroundColor: 'rgba(16, 185, 129, 0.1)' },
            'rfq closed': { color: 'var(--status-cancelled)', backgroundColor: 'rgba(239, 68, 68, 0.1)' }
        };
        return styles[status?.toLowerCase()] || styles['industrialization draft'];
    };

    const getPriorityStyle = (priority) => {
        const styles = {
            High: { color: 'var(--priority-high)', backgroundColor: 'rgba(239, 68, 68, 0.1)' },
            Medium: { color: 'var(--priority-medium)', backgroundColor: 'rgba(245, 158, 11, 0.1)' },
            Low: { color: 'var(--priority-low)', backgroundColor: 'rgba(16, 185, 129, 0.1)' }
        };
        return styles[priority] || styles.Medium;
    };

    // Check if user can edit a section
    const canEditSection = (section) => {
        if (userRole === 'industrialization' && section === 'stage1') return true;
        if (userRole === 'purchases' && section === 'stage2') return true;
        if (userRole === 'suppliers' && section === 'stage3') return true;
        return false;
    };

    // Check if user can see a section
    const canSeeSection = (section) => {
        if (userRole === 'suppliers' && section === 'stage2') return false;
        return true;
    };

    // Check if create response button should be shown
    const shouldShowCreateResponse = () => {
        if (userRole !== 'suppliers') return false;
        if (!rfqData) return false;
        const status = rfqData.status?.toLowerCase();
        return status === 'sent to suppliers' || status === 'waiting for suppliers';
    };

    // Check if create response already exists
    const hasSupplierResponse = () => {
        return rfqData?.stage3?.data?.responses?.some(r => r.status !== 'Draft') || false;
    };

    // Start editing a section
    const startEditing = (section) => {
        if (section === 'stage1') {
            setEditData({ specifications: { ...rfqData.stage1.data.specifications } });
        } else if (section === 'stage2') {
            setEditData({ metadata: { ...rfqData.stage2.data.metadata } });
        } else if (section === 'stage3') {
            setEditData({ responses: JSON.parse(JSON.stringify(rfqData.stage3.data.responses)) });
        }
        setEditingSection(section);
    };

    // Save edited section
    const saveSection = () => {
        setIsSaving(true);
        setTimeout(() => {
            if (editingSection === 'stage1') {
                setRfqData(prev => ({
                    ...prev,
                    stage1: {
                        ...prev.stage1,
                        data: {
                            ...prev.stage1.data,
                            specifications: { ...editData.specifications }
                        }
                    }
                }));
            } else if (editingSection === 'stage2') {
                setRfqData(prev => ({
                    ...prev,
                    stage2: {
                        ...prev.stage2,
                        data: {
                            ...prev.stage2.data,
                            metadata: { ...editData.metadata }
                        }
                    }
                }));
            } else if (editingSection === 'stage3') {
                setRfqData(prev => ({
                    ...prev,
                    stage3: {
                        ...prev.stage3,
                        data: {
                            ...prev.stage3.data,
                            responses: [...editData.responses]
                        }
                    }
                }));
            }
            setEditingSection(null);
            setEditData({});
            setIsSaving(false);
            alert('Changes saved successfully!');
        }, 500);
    };

    // Cancel editing
    const cancelEditing = () => {
        setEditingSection(null);
        setEditData({});
    };

    // Delete a response
    const deleteResponse = (responseId) => {
        if (window.confirm('Are you sure you want to delete this response?')) {
            setRfqData(prev => ({
                ...prev,
                stage3: {
                    ...prev.stage3,
                    data: {
                        ...prev.stage3.data,
                        responses: prev.stage3.data.responses.filter(r => r.id !== responseId)
                    }
                }
            }));
            if (selectedResponse?.id === responseId) setSelectedResponse(null);
        }
    };

    // Create new response
    const createNewResponse = () => {
        const newResponse = {
            id: Date.now(),
            supplier: 'New Supplier',
            contact: 'Contact Name',
            email: 'email@supplier.com',
            phone: '+52 555-000-0000',
            status: 'Draft',
            amount: 'Pending',
            unitPrice: 'TBD',
            deliveryTime: 'TBD',
            submittedDate: null,
            documents: [],
            details: {}
        };

        setRfqData(prev => ({
            ...prev,
            stage3: prev.stage3 || {
                name: 'Suppliers',
                role: 'Supplier Responses',
                data: { responses: [] }
            },
            stage3: {
                ...prev.stage3,
                data: {
                    responses: [...(prev.stage3?.data?.responses || []), newResponse]
                }
            }
        }));
    };

    // Update edit data for specs
    const updateSpecification = (key, value) => {
        setEditData(prev => ({
            ...prev,
            specifications: { ...prev.specifications, [key]: value }
        }));
    };

    // Update edit data for metadata
    const updateMetadata = (key, value) => {
        setEditData(prev => ({
            ...prev,
            metadata: { ...prev.metadata, [key]: value }
        }));
    };

    // Update response in edit mode
    const updateResponseField = (responseId, field, value) => {
        setEditData(prev => ({
            ...prev,
            responses: prev.responses.map(r =>
                r.id === responseId ? { ...r, [field]: value } : r
            )
        }));
    };

    // Delete response in edit mode
    const deleteResponseInEdit = (responseId) => {
        setEditData(prev => ({
            ...prev,
            responses: prev.responses.filter(r => r.id !== responseId)
        }));
    };

    const statusStyle = getStatusBadgeStyle(rfqData?.status);
    const priorityStyle = getPriorityStyle(rfqData?.priority);
    const hasStage1 = rfqData?.stage1 !== null;
    const hasStage2 = rfqData?.stage2 !== null;
    const hasStage3 = rfqData?.stage3 !== null;

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
                    <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>RFQ not found</p>
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
                                    {rfqData.status}
                                </span>
                                <span className="px-2.5 py-0.5 text-xs font-medium border" style={priorityStyle}>
                                    {rfqData.priority}
                                </span>
                            </div>
                            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>ID: {rfqData.id} • Created: {rfqData.createdAt} • By: {rfqData.createdBy}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline"><Download size={16} /> Export</Button>
                    </div>
                </div>

                {/* Description */}
                <Card className="mb-6">
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{rfqData.description}</p>
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
                                                <label className="text-xs block" style={{ color: 'var(--text-tertiary)' }}>{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                                                <input
                                                    type="text"
                                                    value={value}
                                                    onChange={(e) => updateSpecification(key, e.target.value)}
                                                    className="w-full mt-1 px-2 py-1 text-sm border border-border-default focus:outline-none focus:ring-1 focus:ring-brand-accent bg-surface"
                                                    style={{ color: 'var(--text-primary)' }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {Object.entries(rfqData.stage1.data.specifications).map(([key, value]) => (
                                            <div key={key} className="p-3 border border-border-default">
                                                <label className="text-xs block" style={{ color: 'var(--text-tertiary)' }}>{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                                                <p className="text-sm mt-1 font-medium" style={{ color: 'var(--text-primary)' }}>{value}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Documents with Preview */}
                            <div>
                                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>Documents</h3>

                                {previewFile && previewFile.is3D && (
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
                                                <button className="text-sm mt-2" style={{ color: 'var(--brand-accent)' }}>Open Viewer →</button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    {rfqData.stage1.data.documents.map((doc) => (
                                        <div key={doc.id} className="flex justify-between items-center p-3 border border-border-default hover:bg-surface-hover">
                                            <div className="flex items-center gap-2">
                                                {doc.is3D ? <Package size={14} style={{ color: 'var(--brand-accent)' }} /> : <FileText size={14} style={{ color: 'var(--text-tertiary)' }} />}
                                                <div>
                                                    <span className="text-sm">{doc.name}</span>
                                                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{doc.size} • by {doc.uploadedBy}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-3">
                                                {doc.is3D && <button onClick={() => setPreviewFile(doc)} className="text-xs" style={{ color: 'var(--brand-accent)' }}>Preview 3D</button>}
                                                <button className="text-xs" style={{ color: 'var(--brand-accent)' }}>Download</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {editingSection === 'stage1' && (
                                <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
                                    <Button variant="outline" size="sm" onClick={cancelEditing} disabled={isSaving}>Cancel</Button>
                                    <Button variant="primary" size="sm" onClick={saveSection} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</Button>
                                </div>
                            )}
                        </Card>
                    )}

                    {/* Stage 2: Purchases */}
                    {hasStage2 && canSeeSection('stage2') && (
                        <Card title="2. Purchases">
                            {rfqData.stage2.approvedBy && (
                                <div className="mb-4 p-3 border-l-4 flex justify-between items-center" style={{ borderLeftColor: 'var(--brand-accent)', backgroundColor: 'var(--background-tertiary)' }}>
                                    <div>
                                        <p className="text-sm font-medium">Approved by: {rfqData.stage2.approvedBy.name}</p>
                                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{rfqData.stage2.approvedBy.role}</p>
                                    </div>
                                    {rfqData.stage2.approvedBy.approvedDate && <CheckCircle size={20} style={{ color: 'var(--status-completed)' }} />}
                                </div>
                            )}

                            <div className="overflow-x-auto mb-6">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Suppliers List</h3>
                                    {canEditSection('stage2') && editingSection !== 'stage2' && (
                                        <button onClick={() => startEditing('stage2')} className="text-xs flex items-center gap-1" style={{ color: 'var(--brand-accent)' }}>
                                            <Edit size={12} /> Edit Metadata
                                        </button>
                                    )}
                                </div>
                                <table className="min-w-full divide-y" style={{ divideColor: 'var(--border-default)' }}>
                                    <thead style={{ backgroundColor: 'var(--background-tertiary)' }}>
                                        <tr><th className="px-3 py-2 text-left text-xs">Supplier</th><th className="px-3 py-2 text-left text-xs">Contact</th><th className="px-3 py-2 text-left text-xs">Status</th><th className="px-3 py-2 text-left text-xs">Invited</th><th className="px-3 py-2 text-left text-xs">Response</th><th className="px-3 py-2 text-left text-xs">Deadline</th></tr>
                                    </thead>
                                    <tbody>
                                        {rfqData.stage2.data.suppliers.map((s) => (
                                            <tr key={s.id} className="border-b border-border-light">
                                                <td className="px-3 py-2 text-sm">{s.name}</td>
                                                <td className="px-3 py-2 text-sm">{s.contact}</td>
                                                <td className="px-3 py-2 text-sm">{s.status}</td>
                                                <td className="px-3 py-2 text-sm">{s.invitedDate || '-'}</td>
                                                <td className="px-3 py-2 text-sm">{s.deliveryDate || '-'}</td>
                                                <td className="px-3 py-2 text-sm">{s.deadline}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div>
                                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>RFQ Details</h3>
                                {editingSection === 'stage2' ? (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {Object.entries(editData.metadata || {}).map(([k, v]) => (
                                            <div key={k} className="p-2 border border-border-default">
                                                <label className="text-xs block" style={{ color: 'var(--text-tertiary)' }}>{k.replace(/([A-Z])/g, ' $1').trim()}</label>
                                                <input
                                                    type="text"
                                                    value={v}
                                                    onChange={(e) => updateMetadata(k, e.target.value)}
                                                    className="w-full mt-1 px-2 py-1 text-sm border border-border-default focus:outline-none focus:ring-1 focus:ring-brand-accent bg-surface"
                                                    style={{ color: 'var(--text-primary)' }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {Object.entries(rfqData.stage2.data.metadata).map(([k, v]) => (
                                            <div key={k} className="p-2 border border-border-default">
                                                <label className="text-xs block" style={{ color: 'var(--text-tertiary)' }}>{k.replace(/([A-Z])/g, ' $1').trim()}</label>
                                                <p className="text-sm">{v}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {editingSection === 'stage2' && (
                                <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
                                    <Button variant="outline" size="sm" onClick={cancelEditing} disabled={isSaving}>Cancel</Button>
                                    <Button variant="primary" size="sm" onClick={saveSection} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</Button>
                                </div>
                            )}
                        </Card>
                    )}

                    {/* Stage 3: Supplier Responses */}
                    {hasStage3 && canSeeSection('stage3') && (
                        <Card title="3. Supplier Responses">
                            <div className="flex justify-between items-center mb-4 pb-2 border-b flex-wrap gap-2">
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-2"><Users size={14} /><span className="text-sm">Responses: {rfqData.stage3.data.responses.filter(r => r.status === 'Final Quote').length}/{rfqData.stage3.data.responses.length}</span></div>
                                    <div className="flex items-center gap-2"><Truck size={14} /><span className="text-sm">Quotes: {rfqData.stage3.data.responses.filter(r => r.amount !== 'Pending').length}</span></div>
                                </div>
                                {canEditSection('stage3') && editingSection !== 'stage3' && (
                                    <button onClick={() => startEditing('stage3')} className="text-xs flex items-center gap-1" style={{ color: 'var(--brand-accent)' }}>
                                        <Edit size={12} /> Edit Responses
                                    </button>
                                )}
                            </div>

                            {editingSection === 'stage3' ? (
                                <div className="space-y-4">
                                    {editData.responses?.map((response) => (
                                        <div key={response.id} className="border-2 border-border-default p-4">
                                            <div className="flex justify-between items-start mb-3">
                                                <input
                                                    type="text"
                                                    value={response.supplier}
                                                    onChange={(e) => updateResponseField(response.id, 'supplier', e.target.value)}
                                                    className="font-semibold px-2 py-1 border border-border-default"
                                                    style={{ color: 'var(--text-primary)' }}
                                                />
                                                <button onClick={() => deleteResponseInEdit(response.id)} className="text-red-500">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                <div><label className="text-xs">Contact</label><input type="text" value={response.contact} onChange={(e) => updateResponseField(response.id, 'contact', e.target.value)} className="w-full px-2 py-1 border" /></div>
                                                <div><label className="text-xs">Email</label><input type="email" value={response.email} onChange={(e) => updateResponseField(response.id, 'email', e.target.value)} className="w-full px-2 py-1 border" /></div>
                                                <div><label className="text-xs">Amount</label><input type="text" value={response.amount} onChange={(e) => updateResponseField(response.id, 'amount', e.target.value)} className="w-full px-2 py-1 border" /></div>
                                                <div><label className="text-xs">Delivery Time</label><input type="text" value={response.deliveryTime} onChange={(e) => updateResponseField(response.id, 'deliveryTime', e.target.value)} className="w-full px-2 py-1 border" /></div>
                                                <div><label className="text-xs">Status</label>
                                                    <select value={response.status} onChange={(e) => updateResponseField(response.id, 'status', e.target.value)} className="w-full px-2 py-1 border">
                                                        <option>Draft</option><option>Final Quote</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex justify-end gap-2 mt-2">
                                        <Button variant="outline" size="sm" onClick={cancelEditing}>Cancel</Button>
                                        <Button variant="primary" size="sm" onClick={saveSection} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {rfqData.stage3.data.responses.map((response) => (
                                        <div key={response.id} className={`border-2 p-4 ${selectedResponse?.id === response.id ? 'border-brand-accent' : 'border-border-default'}`}>
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
                                                <div className="flex items-center gap-2"><User size={12} />{response.contact}</div>
                                                <div className="flex items-center gap-2"><Mail size={12} />{response.email}</div>
                                                <div className="flex justify-between pt-1"><span>Amount:</span><strong>{response.amount}</strong></div>
                                                <div className="flex justify-between"><span>Delivery:</span>{response.deliveryTime}</div>
                                            </div>
                                            <button onClick={() => setSelectedResponse(selectedResponse?.id === response.id ? null : response)} className="w-full py-2 text-sm" style={{ backgroundColor: 'var(--surface-hover)' }}>
                                                {selectedResponse?.id === response.id ? 'Hide Details' : 'View Details'}
                                            </button>

                                            {selectedResponse?.id === response.id && response.details && Object.keys(response.details).length > 0 && (
                                                <div className="mt-4 pt-3 border-t">
                                                    <h5 className="text-sm font-semibold mb-2">Quote Details</h5>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                                        {Object.entries(response.details).map(([k, v]) => (
                                                            <div key={k}><label className="text-xs block" style={{ color: 'var(--text-tertiary)' }}>{k.replace(/([A-Z])/g, ' $1').trim()}</label><p>{v || 'N/A'}</p></div>
                                                        ))}
                                                    </div>
                                                    <div className="flex gap-2 mt-3"><Button size="sm">Accept</Button><Button variant="outline" size="sm">Request Revision</Button></div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    )}

                    {/* Create Response Button for Suppliers */}
                    {shouldShowCreateResponse() && !hasSupplierResponse() && (
                        <div className="flex justify-center">
                            <Button onClick={createNewResponse} variant="primary">
                                <Plus size={16} /> Create Response
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}