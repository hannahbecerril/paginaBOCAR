// sections/Compras/RFQForm.jsx
import { useState } from 'react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import UploadCard from '../../components/ui/UploadCard';

export default function RFQForm() {
    const [form, setForm] = useState({
        nombre: '',
        descripcion: '',
        prioridad: ''
    });

    const [uploadedFiles, setUploadedFiles] = useState({
        documentacion: null,
        presentacion: null,
        modelo3d: null
    });

    const handleChange = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const handleFileUpload = (type, file) => {
        setUploadedFiles(prev => ({ ...prev, [type]: file }));
        console.log(`Archivo subido para ${type}:`, file);
    };

    const handleSubmit = () => {
        const completeData = {
            ...form,
            files: uploadedFiles
        };
        console.log('RFQ DATA:', completeData);
        alert('RFQ enviado correctamente');
    };

    const priorityOptions = [
        { value: 'Alta', label: 'Alta' },
        { value: 'Media', label: 'Media' },
        { value: 'Baja', label: 'Baja' }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-6 py-8">

                {/* HEADER */}
                <div className="mb-6">
                    <h1 className="text-xl font-semibold text-gray-900">
                        Crear RFQ
                    </h1>
                    <p className="text-sm text-gray-500">
                        Solicitud de cotización para proveedores
                    </p>
                </div>

                {/* CARD */}
                <div className="bg-white border border-gray-200 p-6 mb-6">

                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                        Información del proyecto
                    </h2>

                    {/* Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        {/* Nombre */}
                        <div className="md:col-span-2">
                            <Input
                                label="Nombre del Proyecto"
                                placeholder="Ej: Proyecto Alpha 2024"
                                value={form.nombre}
                                onChange={(e) => handleChange('nombre', e.target.value)}
                            />
                        </div>

                        {/* Prioridad */}
                        <div>
                            <Input
                                label="Prioridad"
                                variant="select"
                                value={form.prioridad}
                                onChange={(e) => handleChange('prioridad', e.target.value)}
                                options={priorityOptions}
                            />
                        </div>
                    </div>

                    {/* Descripción */}
                    <Input
                        label="Descripción"
                        variant="textarea"
                        placeholder="Descripción breve del proyecto..."
                        value={form.descripcion}
                        onChange={(e) => handleChange('descripcion', e.target.value)}
                        rows={4}
                    />
                </div>

                {/* UPLOADS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <UploadCard
                        title="Documentación"
                        subtitle="PDF, DOC, DOCX"
                        acceptedFileTypes={['pdf', 'doc', 'docx']}
                        maxFileSize={10}
                        expectedFileType="document"
                        onFileUpload={(file) => handleFileUpload('documentacion', file)}
                    />
                    <UploadCard
                        title="Presentación"
                        subtitle="PPT, PPTX, KEY"
                        acceptedFileTypes={['ppt', 'pptx', 'key']}
                        maxFileSize={15}
                        expectedFileType="presentation"
                        onFileUpload={(file) => handleFileUpload('presentacion', file)}
                    />
                    <UploadCard
                        title="Modelo 3D"
                        subtitle="STEP, STL, OBJ, DWG"
                        acceptedFileTypes={['step', 'stl', 'obj', 'dwg']}
                        maxFileSize={50}
                        expectedFileType="3d"
                        multiple={false}
                        onFileUpload={(file) => handleFileUpload('modelo3d', file)}
                    />
                </div>

                {/* ACTION */}
                <div className="flex justify-end">
                    <Button onClick={handleSubmit} variant="primary">
                        Enviar Solicitud
                    </Button>
                </div>

            </div>
        </div>
    );
}