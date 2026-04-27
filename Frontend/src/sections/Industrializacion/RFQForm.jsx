// sections/Compras/RFQForm.jsx
import { useState } from 'react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import UploadCard from '../../components/ui/UploadCard';

export default function RFQForm() {
    const [form, setForm] = useState({
        name: '',
        description: '',
        priority: ''
    });

    const [uploadedFiles, setUploadedFiles] = useState({
        documentation: null,
        presentation: null,
        model3d: null
    });

    const handleChange = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const handleFileUpload = (type, file) => {
        setUploadedFiles(prev => ({ ...prev, [type]: file }));
        console.log(`File uploaded for ${type}:`, file);
    };

    const handleSubmit = () => {
        const completeData = {
            ...form,
            files: uploadedFiles
        };
        console.log('RFQ DATA:', completeData);
        alert('RFQ sent successfully');
    };

    const priorityOptions = [
        { value: 'High', label: 'High' },
        { value: 'Medium', label: 'Medium' },
        { value: 'Low', label: 'Low' }
    ];

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--background-secondary)' }}>
            <div className="max-w-6xl mx-auto px-6 py-8">

                {/* HEADER */}
                <div className="mb-6">
                    <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Create RFQ
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Request for Quotation for suppliers
                    </p>
                </div>

                {/* CARD */}
                <div className="bg-surface border border-border-default p-6 mb-6">
                    <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-tertiary)' }}>
                        Project Information
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="md:col-span-2">
                            <Input
                                label="Project Name"
                                placeholder="E.g., Alpha Project 2024"
                                value={form.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                            />
                        </div>

                        <div>
                            <Input
                                label="Priority"
                                variant="select"
                                value={form.priority}
                                onChange={(e) => handleChange('priority', e.target.value)}
                                options={priorityOptions}
                            />
                        </div>
                    </div>

                    <Input
                        label="Description"
                        variant="textarea"
                        placeholder="Brief project description..."
                        value={form.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        rows={4}
                    />
                </div>

                {/* UPLOADS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <UploadCard
                        title="Documentation"
                        subtitle="PDF, DOC, DOCX"
                        acceptedFileTypes={['pdf', 'doc', 'docx']}
                        maxFileSize={10}
                        expectedFileType="document"
                        onFileUpload={(file) => handleFileUpload('documentation', file)}
                    />
                    <UploadCard
                        title="Presentation"
                        subtitle="PPT, PPTX, KEY"
                        acceptedFileTypes={['ppt', 'pptx', 'key']}
                        maxFileSize={15}
                        expectedFileType="presentation"
                        onFileUpload={(file) => handleFileUpload('presentation', file)}
                    />
                    <UploadCard
                        title="3D Model"
                        subtitle="STEP, STL, OBJ, DWG"
                        acceptedFileTypes={['step', 'stl', 'obj', 'dwg']}
                        maxFileSize={50}
                        expectedFileType="3d"
                        multiple={false}
                        onFileUpload={(file) => handleFileUpload('model3d', file)}
                    />
                </div>

                {/* ACTION */}
                <div className="flex justify-end">
                    <Button onClick={handleSubmit} variant="primary">
                        Submit Request
                    </Button>
                </div>

            </div>
        </div>
    );
}