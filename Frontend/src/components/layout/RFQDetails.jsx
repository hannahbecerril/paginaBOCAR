// components/layout/RFQDetails.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, FileText, Users, Clock, Tag, AlertCircle, CheckCircle, Send, Download, Pencil, Building, Calendar, DollarSign, Package, Eye, MessageSquare, ThumbsUp, X, User, Briefcase, TrendingUp, Ruler, Hash, Layers, Calendar as CalendarIcon, Truck, Mail, Phone, FileCheck, Image } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';

export default function RFQDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [selectedResponse, setSelectedResponse] = useState(null);
    const [previewFile, setPreviewFile] = useState(null);

    // Mock data - 3 stages with complete information
    const rfqData = {
        id: id,
        title: `RFQ ${id} - High Precision Industrial Components`,
        description: 'Request for quotation for high-precision industrial components requiring CNC machining with tight tolerances. Parts will be used in automated assembly lines requiring consistent quality and reliability.',

        // Stage 1: Industrialization
        stage1: {
            name: 'Industrialization',
            role: 'Industrialization Team',
            approvedBy: {
                name: 'Maria Garcia',
                role: 'Industrialization Manager',
                approvedDate: '2024-04-03',
                comments: 'All technical specifications verified and approved for procurement'
            },
            data: {
                specifications: {
                    material: '7075 Aluminum Alloy',
                    dimensions: '150mm x 75mm x 25mm',
                    weight: '1.2 kg per unit',
                    tolerance: '±0.01mm',
                    surfaceFinish: 'Ra 0.8μm',
                    hardness: 'HRC 45-50',
                    piecesRequired: 500,
                    piecesPerMonth: 100,
                    testingRequired: 'Dimensional, Hardness, Surface Roughness'
                },
                documents: [
                    { id: 1, name: 'Technical_Specs.pdf', size: '2.4 MB', type: 'PDF', uploadedBy: 'Maria Garcia', date: '2024-04-01', is3D: false },
                    { id: 2, name: 'CAD_Model_3D.stp', size: '12.5 MB', type: 'STEP', uploadedBy: 'Carlos Lopez', date: '2024-04-02', is3D: true, previewUrl: '/api/preview/3d-model' },
                    { id: 3, name: 'Drawing_001.dwg', size: '5.1 MB', type: 'CAD', uploadedBy: 'Maria Garcia', date: '2024-04-01', is3D: false },
                    { id: 4, name: 'Material_Certificate.pdf', size: '1.8 MB', type: 'PDF', uploadedBy: 'Carlos Lopez', date: '2024-04-02', is3D: false },
                    { id: 5, name: 'Quality_Requirements.docx', size: '3.2 MB', type: 'DOCX', uploadedBy: 'Maria Garcia', date: '2024-04-03', is3D: false },
                ],
                defaultPreviewFile: 2 // ID of the 3D file to preview by default
            }
        },

        // Stage 2: Purchases
        stage2: {
            name: 'Purchases',
            role: 'Purchases Team',
            approvedBy: {
                name: 'Laura Fernandez',
                role: 'Purchases Manager',
                approvedDate: '2024-04-05',
                comments: 'Suppliers shortlisted and RFQ sent for bidding'
            },
            data: {
                suppliers: [
                    { id: 1, name: 'MetalWorks Ltd.', contact: 'John Smith', email: 'john@metalworks.com', phone: '+52 555-123-4567', status: 'Quoted', amount: '$48,500', deadline: '2024-04-20', invitedDate: '2024-04-05', deliveryDate: '2024-04-15' },
                    { id: 2, name: 'Steel Solutions Inc.', contact: 'Sarah Johnson', email: 'sarah@steelsolutions.com', phone: '+52 555-123-4568', status: 'Pending', amount: '-', deadline: '2024-04-20', invitedDate: '2024-04-05', deliveryDate: null },
                    { id: 3, name: 'Industrial Parts Co.', contact: 'Mike Brown', email: 'mike@industrialparts.com', phone: '+52 555-123-4569', status: 'Quoted', amount: '$52,000', deadline: '2024-04-19', invitedDate: '2024-04-05', deliveryDate: '2024-04-16' },
                    { id: 4, name: 'Precision Metals Ltd.', contact: 'Lisa Wilson', email: 'lisa@precisionmetals.com', phone: '+52 555-123-4570', status: 'Declined', amount: '-', deadline: '2024-04-20', invitedDate: '2024-04-06', deliveryDate: null },
                ],
                metadata: {
                    responseDeadline: '2024-04-20',
                    remindersSent: 2,
                    priority: 'High - Urgent delivery required',
                    shippingTerms: 'FOB Origin',
                    qualityRequirements: 'ISO 9001:2024 Certified'
                }
            }
        },

        // Stage 3: Suppliers Responses
        stage3: {
            name: 'Suppliers',
            role: 'Supplier Responses',
            data: {
                responses: [
                    {
                        id: 1,
                        supplier: 'MetalWorks Ltd.',
                        contact: 'John Smith',
                        email: 'john@metalworks.com',
                        phone: '+52 555-123-4567',
                        status: 'Final Quote',
                        amount: '$48,500',
                        unitPrice: '$97.00',
                        deliveryTime: '4-6 weeks',
                        submittedDate: '2024-04-15',
                        documents: ['Quote_MWL_001.pdf', 'Certification_MWL.pdf', 'Delivery_Schedule.pdf'],
                        details: {
                            productionCapacity: '1000 units/month',
                            qualityProcess: 'ISO 9001 certified with 100% inspection',
                            paymentTerms: '30% deposit, 70% against delivery',
                            warranty: '12 months against manufacturing defects',
                            shippingMethod: 'Air freight (7 days) or Sea freight (21 days)',
                            leadTime: '15 days after material receipt',
                            certifications: ['ISO 9001:2024', 'AS9100D'],
                            additionalInfo: 'Can provide sample pieces for validation. Volume discounts available for orders >1000 units.'
                        }
                    },
                    {
                        id: 2,
                        supplier: 'Industrial Parts Co.',
                        contact: 'Mike Brown',
                        email: 'mike@industrialparts.com',
                        phone: '+52 555-123-4569',
                        status: 'Final Quote',
                        amount: '$52,000',
                        unitPrice: '$104.00',
                        deliveryTime: '5-7 weeks',
                        submittedDate: '2024-04-16',
                        documents: ['Quote_IPC_001.pdf', 'Spec_Sheet_IPC.pdf', 'Quality_Cert.pdf'],
                        details: {
                            productionCapacity: '800 units/month',
                            qualityProcess: 'Six Sigma certified with SPC monitoring',
                            paymentTerms: 'Net 45 days after delivery',
                            warranty: '18 months or 10,000 cycles',
                            shippingMethod: 'Air freight included',
                            leadTime: '20 days after PO confirmation',
                            certifications: ['ISO 9001:2024', 'IATF 16949'],
                            additionalInfo: 'Includes free tooling setup and first article inspection report.'
                        }
                    },
                    {
                        id: 3,
                        supplier: 'Steel Solutions Inc.',
                        contact: 'Sarah Johnson',
                        email: 'sarah@steelsolutions.com',
                        phone: '+52 555-123-4568',
                        status: 'Draft',
                        amount: 'Pending',
                        unitPrice: 'TBD',
                        deliveryTime: 'TBD',
                        submittedDate: null,
                        documents: [],
                        details: {}
                    },
                ]
            }
        }
    };

    // Set default preview file on load
    useState(() => {
        const defaultFile = rfqData.stage1.data.documents.find(doc => doc.id === rfqData.stage1.data.defaultPreviewFile);
        if (defaultFile) setPreviewFile(defaultFile);
    }, []);

    const getPriorityStyle = () => {
        const priority = rfqData.stage2.data.metadata.priority;
        const styles = {
            'High - Urgent delivery required': { color: 'var(--priority-high)', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--priority-high)' },
            'Medium': { color: 'var(--priority-medium)', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'var(--priority-medium)' },
            'Low': { color: 'var(--priority-low)', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'var(--priority-low)' }
        };
        return styles[priority] || styles.Medium;
    };

    const priorityStyle = getPriorityStyle();

    const getStatusStyle = (status) => {
        const styles = {
            'Final Quote': { color: 'var(--status-completed)', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'var(--status-completed)' },
            'Pending': { color: 'var(--status-pending)', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'var(--status-pending)' },
            'Declined': { color: 'var(--status-cancelled)', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--status-cancelled)' },
            'Draft': { color: 'var(--text-tertiary)', backgroundColor: 'var(--surface-disabled)', borderColor: 'var(--border-default)' },
        };
        return styles[status] || { color: 'var(--text-secondary)', backgroundColor: 'var(--surface-hover)', borderColor: 'var(--border-default)' };
    };

    const handleExport = () => {
        console.log('Exporting RFQ data...');
        alert('Export functionality would be implemented here');
    };

    const handleTakeAction = () => {
        console.log('Taking action on RFQ...');
        alert('Action options would be shown here');
    };

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--background-secondary)' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 transition-colors duration-fast hover:bg-surface-hover"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                                {rfqData.title}
                            </h1>
                            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                                ID: {rfqData.id}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleExport}>
                            <Download size={16} />
                            Export Report
                        </Button>
                        <Button variant="primary" onClick={handleTakeAction}>
                            <Send size={16} />
                            Take Action
                        </Button>
                    </div>
                </div>

                {/* Description Section */}
                <Card className="mb-6">
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{rfqData.description}</p>
                </Card>

                <div className="space-y-6">
                    {/* Stage 1: Industrialization */}
                    <Card title={`1. ${rfqData.stage1.name}`}>
                        <div className="mb-4 p-3 border-l-4" style={{ borderLeftColor: 'var(--brand-accent)', backgroundColor: 'var(--background-tertiary)' }}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                        Approved by: {rfqData.stage1.approvedBy.name}
                                    </p>
                                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                        {rfqData.stage1.approvedBy.role} • Approved on {rfqData.stage1.approvedBy.approvedDate}
                                    </p>
                                </div>
                                <CheckCircle size={20} style={{ color: 'var(--status-completed)' }} />
                            </div>
                            <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
                                Comments: {rfqData.stage1.approvedBy.comments}
                            </p>
                        </div>

                        <div className="space-y-6">
                            {/* Specifications */}
                            <div>
                                <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                                    <Ruler size={14} className="inline mr-2" />
                                    Technical Specifications
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {Object.entries(rfqData.stage1.data.specifications).map(([key, value]) => (
                                        <div key={key} className="p-3 border border-border-default">
                                            <label className="text-xs uppercase tracking-wider block" style={{ color: 'var(--text-tertiary)' }}>
                                                {key.replace(/([A-Z])/g, ' $1').trim()}
                                            </label>
                                            <p className="text-sm mt-1 font-medium" style={{ color: 'var(--text-primary)' }}>{value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Documents with 3D Preview */}
                            <div>
                                <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                                    <FileText size={14} className="inline mr-2" />
                                    Documents & Technical Files
                                </h3>

                                {/* 3D Preview Window */}
                                {previewFile && previewFile.is3D && (
                                    <div className="mb-4 border border-border-default overflow-hidden">
                                        <div className="p-2 border-b border-border-default" style={{ backgroundColor: 'var(--background-tertiary)' }}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Package size={14} style={{ color: 'var(--text-tertiary)' }} />
                                                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>3D Model Preview: {previewFile.name}</span>
                                                </div>
                                                <button
                                                    onClick={() => setPreviewFile(null)}
                                                    className="text-xs"
                                                    style={{ color: 'var(--text-tertiary)' }}
                                                >
                                                    Close Preview
                                                </button>
                                            </div>
                                        </div>
                                        <div className="p-4 flex items-center justify-center" style={{ minHeight: '300px', backgroundColor: 'var(--surface-hover)' }}>
                                            <div className="text-center">
                                                <Package size={64} style={{ color: 'var(--text-tertiary)' }} />
                                                <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>3D Viewer Integration</p>
                                                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Interactive 3D model preview would be displayed here</p>
                                                <button className="mt-3 text-sm" style={{ color: 'var(--brand-accent)' }}>Open in full viewer →</button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Document List */}
                                <div className="space-y-2">
                                    {rfqData.stage1.data.documents.map((doc) => (
                                        <div key={doc.id} className="flex items-center justify-between p-3 border border-border-default hover:bg-surface-hover">
                                            <div className="flex items-center gap-2">
                                                {doc.is3D ? <Package size={14} style={{ color: 'var(--brand-accent)' }} /> : <FileText size={14} style={{ color: 'var(--text-tertiary)' }} />}
                                                <div>
                                                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{doc.name}</span>
                                                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Uploaded by {doc.uploadedBy} on {doc.date}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{doc.size}</span>
                                                {doc.is3D && (
                                                    <button
                                                        onClick={() => setPreviewFile(doc)}
                                                        className="text-xs"
                                                        style={{ color: 'var(--brand-accent)' }}
                                                    >
                                                        Preview 3D
                                                    </button>
                                                )}
                                                <button className="text-xs" style={{ color: 'var(--brand-accent)' }}>Download</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Stage 2: Purchases */}
                    <Card title={`2. ${rfqData.stage2.name}`}>
                        <div className="mb-4 p-3 border-l-4" style={{ borderLeftColor: 'var(--brand-accent)', backgroundColor: 'var(--background-tertiary)' }}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                        Approved by: {rfqData.stage2.approvedBy.name}
                                    </p>
                                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                        {rfqData.stage2.approvedBy.role} • Approved on {rfqData.stage2.approvedBy.approvedDate}
                                    </p>
                                </div>
                                <CheckCircle size={20} style={{ color: 'var(--status-completed)' }} />
                            </div>
                            <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
                                Comments: {rfqData.stage2.approvedBy.comments}
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                                    <Building size={14} className="inline mr-2" />
                                    Suppliers & Delivery Information
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y" style={{ divideColor: 'var(--border-default)' }}>
                                        <thead style={{ backgroundColor: 'var(--background-tertiary)' }}>
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Supplier</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Contact</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Status</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Invited Date</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Response Date</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Deadline</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y" style={{ divideColor: 'var(--border-light)' }}>
                                            {rfqData.stage2.data.suppliers.map((supplier) => {
                                                const statusStyle = getStatusStyle(supplier.status);
                                                return (
                                                    <tr key={supplier.id} className="hover:bg-surface-hover">
                                                        <td className="px-4 py-3">
                                                            <div>
                                                                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{supplier.name}</p>
                                                                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{supplier.email}</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{supplier.contact}</p>
                                                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{supplier.phone}</p>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="inline-flex px-2 py-0.5 text-xs font-medium border" style={statusStyle}>
                                                                {supplier.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-primary)' }}>{supplier.invitedDate}</td>
                                                        <td className="px-4 py-3 text-sm" style={{ color: supplier.deliveryDate ? 'var(--status-completed)' : 'var(--text-tertiary)' }}>
                                                            {supplier.deliveryDate || 'Pending'}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm" style={{ color: 'var(--status-pending)' }}>{supplier.deadline}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                                    <CalendarIcon size={14} className="inline mr-2" />
                                    RFQ Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-3 border border-border-default">
                                        <label className="text-xs uppercase tracking-wider block" style={{ color: 'var(--text-tertiary)' }}>
                                            Response Deadline
                                        </label>
                                        <p className="text-sm mt-1 font-medium" style={{ color: 'var(--status-pending)' }}>{rfqData.stage2.data.metadata.responseDeadline}</p>
                                    </div>
                                    <div className="p-3 border border-border-default">
                                        <label className="text-xs uppercase tracking-wider block" style={{ color: 'var(--text-tertiary)' }}>
                                            Priority
                                        </label>
                                        <span className="inline-flex mt-1 px-2 py-0.5 text-xs font-medium border" style={priorityStyle}>
                                            {rfqData.stage2.data.metadata.priority}
                                        </span>
                                    </div>
                                    <div className="p-3 border border-border-default">
                                        <label className="text-xs uppercase tracking-wider block" style={{ color: 'var(--text-tertiary)' }}>
                                            Shipping Terms
                                        </label>
                                        <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>{rfqData.stage2.data.metadata.shippingTerms}</p>
                                    </div>
                                    <div className="p-3 border border-border-default">
                                        <label className="text-xs uppercase tracking-wider block" style={{ color: 'var(--text-tertiary)' }}>
                                            Quality Requirements
                                        </label>
                                        <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>{rfqData.stage2.data.metadata.qualityRequirements}</p>
                                    </div>
                                    <div className="p-3 border border-border-default">
                                        <label className="text-xs uppercase tracking-wider block" style={{ color: 'var(--text-tertiary)' }}>
                                            Reminders Sent
                                        </label>
                                        <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>{rfqData.stage2.data.metadata.remindersSent}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Stage 3: Suppliers Responses */}
                    <Card title={`3. ${rfqData.stage3.name}`}>
                        {/* Summary Stats inline */}
                        <div className="flex flex-wrap gap-4 mb-6 pb-4 border-b border-border-default">
                            <div className="flex items-center gap-2">
                                <Users size={14} style={{ color: 'var(--text-tertiary)' }} />
                                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Responses:</span>
                                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                    {rfqData.stage3.data.responses.filter(r => r.status === 'Final Quote').length}/3
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Truck size={14} style={{ color: 'var(--text-tertiary)' }} />
                                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Quotes Received:</span>
                                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                    {rfqData.stage3.data.responses.filter(r => r.amount !== 'Pending').length}
                                </span>
                            </div>
                        </div>

                        {/* Supplier Responses Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {rfqData.stage3.data.responses.map((response) => {
                                const statusStyle = getStatusStyle(response.status);
                                return (
                                    <div
                                        key={response.id}
                                        className={`border-2 transition-all duration-200 ${selectedResponse?.id === response.id ? 'border-brand-accent' : 'border-border-default'}`}
                                        style={{ backgroundColor: 'var(--surface)' }}
                                    >
                                        <div className="p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>{response.supplier}</h4>
                                                <span className="inline-flex px-2 py-0.5 text-xs font-medium border" style={statusStyle}>
                                                    {response.status}
                                                </span>
                                            </div>

                                            <div className="space-y-2 mb-3">
                                                <div className="flex items-center gap-2">
                                                    <User size={12} style={{ color: 'var(--text-tertiary)' }} />
                                                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{response.contact}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Mail size={12} style={{ color: 'var(--text-tertiary)' }} />
                                                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{response.email}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Phone size={12} style={{ color: 'var(--text-tertiary)' }} />
                                                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{response.phone}</span>
                                                </div>
                                                <div className="flex items-center justify-between pt-2">
                                                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Total Amount</span>
                                                    <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{response.amount}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Unit Price</span>
                                                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{response.unitPrice}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Delivery Time</span>
                                                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{response.deliveryTime}</span>
                                                </div>
                                                {response.submittedDate && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Submitted</span>
                                                        <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{response.submittedDate}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <button
                                                className="w-full mt-3 py-2 text-sm transition-colors"
                                                style={{ backgroundColor: 'var(--surface-hover)', color: 'var(--text-primary)' }}
                                                onClick={() => setSelectedResponse(selectedResponse?.id === response.id ? null : response)}
                                            >
                                                {selectedResponse?.id === response.id ? 'Hide Details' : 'View Details'}
                                            </button>
                                        </div>

                                        {/* Expanded Details - Full Width inside card */}
                                        {selectedResponse?.id === response.id && response.details && Object.keys(response.details).length > 0 && (
                                            <div className="p-4 border-t" style={{ borderTopColor: 'var(--border-default)', backgroundColor: 'var(--background-tertiary)' }}>
                                                <h5 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                                    <FileCheck size={14} style={{ color: 'var(--brand-accent)' }} />
                                                    Quote Details
                                                </h5>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {Object.entries(response.details).map(([key, value]) => (
                                                        <div key={key} className="p-2">
                                                            <label className="text-xs uppercase tracking-wider block" style={{ color: 'var(--text-tertiary)' }}>
                                                                {key.replace(/([A-Z])/g, ' $1').trim()}
                                                            </label>
                                                            <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>{value || 'N/A'}</p>
                                                        </div>
                                                    ))}
                                                </div>

                                                {response.documents.length > 0 && (
                                                    <div className="mt-3">
                                                        <label className="text-xs uppercase tracking-wider block mb-2" style={{ color: 'var(--text-tertiary)' }}>
                                                            <FileText size={12} className="inline mr-1" />
                                                            Quote Documents
                                                        </label>
                                                        <div className="space-y-1">
                                                            {response.documents.map((doc, idx) => (
                                                                <div key={idx} className="flex items-center justify-between p-2 border border-border-default">
                                                                    <div className="flex items-center gap-2">
                                                                        <FileText size={12} style={{ color: 'var(--text-tertiary)' }} />
                                                                        <span className="text-xs" style={{ color: 'var(--text-primary)' }}>{doc}</span>
                                                                    </div>
                                                                    <button className="text-xs" style={{ color: 'var(--brand-accent)' }}>Download</button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex gap-3 mt-4 pt-2">
                                                    <Button variant="primary" size="sm">Accept Quote</Button>
                                                    <Button variant="outline" size="sm">Request Revision</Button>
                                                    <Button variant="outline" size="sm">Compare</Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}