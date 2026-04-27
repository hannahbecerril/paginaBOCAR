// components/ui/UploadCard.jsx
import { useState, useCallback } from 'react';
import {
    Upload,
    FileText,
    FileImage,
    File,
    X,
    CheckCircle,
    AlertCircle,
    FileSpreadsheet,
    FileCode,
    Box,
    FileJson,
    FileArchive
} from 'lucide-react';

export default function UploadCard({
    title,
    subtitle,
    acceptedFileTypes = [],
    maxFileSize = 5, // MB
    onFileUpload,
    multiple = false,
    expectedFileType = 'document' // 'document', 'excel', 'pdf', '3d', 'image', 'presentation'
}) {
    const [files, setFiles] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [errors, setErrors] = useState([]);

    // Get icon based on file type and expected file type
    const getFileIcon = (fileType, expectedType) => {
        const extension = fileType?.split('/').pop()?.toLowerCase() || '';

        switch (expectedType) {
            case 'excel':
                return <FileSpreadsheet size={20} className="text-brand-success" />;
            case 'pdf':
                return <FileText size={20} className="text-brand-danger" />;
            case '3d':
                return <Box size={20} className="text-brand-accent" />;
            case 'image':
                return <FileImage size={20} className="text-brand-info" />;
            case 'presentation':
                return <FileCode size={20} className="text-brand-warning" />;
            default:
                if (extension.includes('pdf')) return <FileText size={20} className="text-brand-danger" />;
                if (extension.includes('xls') || extension.includes('csv')) return <FileSpreadsheet size={20} className="text-brand-success" />;
                if (extension.includes('ppt') || extension.includes('key')) return <FileCode size={20} className="text-brand-warning" />;
                if (extension.includes('stl') || extension.includes('step') || extension.includes('obj') || extension.includes('dwg')) return <Box size={20} className="text-brand-accent" />;
                if (extension.includes('jpg') || extension.includes('png') || extension.includes('gif')) return <FileImage size={20} className="text-brand-info" />;
                if (extension.includes('zip') || extension.includes('rar')) return <FileArchive size={20} className="text-brand-warning" />;
                if (extension.includes('json') || extension.includes('xml')) return <FileJson size={20} className="text-text-secondary" />;
                return <File size={20} className="text-text-secondary" />;
        }
    };

    // Validate file
    const validateFile = (file) => {
        const errors = [];

        if (file.size > maxFileSize * 1024 * 1024) {
            errors.push(`File ${file.name} exceeds maximum size of ${maxFileSize}MB`);
        }

        if (acceptedFileTypes.length > 0) {
            const fileExtension = file.name.split('.').pop().toLowerCase();
            const isValidType = acceptedFileTypes.some(type =>
                file.type.includes(type) || fileExtension === type.toLowerCase()
            );

            if (!isValidType) {
                errors.push(`File ${file.name} is not a valid type. Allowed formats: ${acceptedFileTypes.join(', ')}`);
            }
        }

        return errors;
    };

    // Process files
    const processFiles = (fileList) => {
        const newFiles = [];
        const newErrors = [];

        Array.from(fileList).forEach(file => {
            const validationErrors = validateFile(file);
            if (validationErrors.length > 0) {
                newErrors.push(...validationErrors);
            } else {
                newFiles.push({
                    id: Date.now() + Math.random(),
                    file: file,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    status: 'uploading',
                    progress: 0
                });
            }
        });

        if (newErrors.length > 0) {
            setErrors(prev => [...prev, ...newErrors]);
            setTimeout(() => {
                setErrors(prev => prev.filter(e => !newErrors.includes(e)));
            }, 5000);
        }

        if (newFiles.length > 0) {
            setFiles(prev => multiple ? [...prev, ...newFiles] : newFiles);

            newFiles.forEach(uploadFile => {
                simulateUpload(uploadFile.id);
            });
        }
    };

    // Simulate file upload
    const simulateUpload = (fileId) => {
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            setFiles(prev => prev.map(f =>
                f.id === fileId ? { ...f, progress: Math.min(progress, 100) } : f
            ));

            if (progress >= 100) {
                clearInterval(interval);
                setFiles(prev => prev.map(f =>
                    f.id === fileId ? { ...f, status: 'completed' } : f
                ));

                const completedFile = files.find(f => f.id === fileId);
                if (completedFile && onFileUpload) {
                    onFileUpload(completedFile);
                }
            }
        }, 200);
    };

    // Remove file
    const removeFile = (fileId) => {
        setFiles(prev => prev.filter(f => f.id !== fileId));
    };

    // Handle drop
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFiles = e.dataTransfer.files;
        processFiles(droppedFiles);
    }, [acceptedFileTypes, maxFileSize, multiple]);

    // Handle file input
    const handleFileInput = (e) => {
        const selectedFiles = e.target.files;
        processFiles(selectedFiles);
        e.target.value = '';
    };

    // Drag events
    const handleDragEnter = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    // Format file size
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Get accepted file extensions string
    const getAcceptedExtensions = () => {
        if (acceptedFileTypes.length === 0) return '*';
        return acceptedFileTypes.map(type => `.${type}`).join(',');
    };

    return (
        <div className="bg-surface border border-border-default">
            {/* Header */}
            <div className="flex items-center gap-2 p-5 pb-0">
                <div style={{ color: 'var(--text-tertiary)' }}>
                    <Upload size={16} />
                </div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{title}</p>
            </div>

            <p className="text-xs px-5 pt-1 pb-4" style={{ color: 'var(--text-tertiary)' }}>{subtitle}</p>

            {/* Dropzone */}
            <div className="px-5 pb-5">
                <div
                    onDrop={handleDrop}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    className={`
                        border-2 border-dashed p-8
                        flex flex-col items-center justify-center
                        transition cursor-pointer
                        min-h-[160px]
                        ${isDragging ? 'border-brand-accent bg-brand-accent/10' : 'border-border-default'}
                    `}
                    onClick={() => document.getElementById(`file-input-${title}`).click()}
                >
                    <Upload size={24} className={`mb-3 ${isDragging ? 'text-brand-accent' : 'text-text-tertiary'}`} />
                    <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                        {isDragging ? 'Drop files here' : 'Drag or click'}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        Max size: {maxFileSize}MB
                    </p>
                    {acceptedFileTypes.length > 0 && (
                        <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                            Formats: {acceptedFileTypes.join(', ')}
                        </p>
                    )}
                    <input
                        id={`file-input-${title}`}
                        type="file"
                        multiple={multiple}
                        accept={getAcceptedExtensions()}
                        onChange={handleFileInput}
                        className="hidden"
                    />
                </div>

                {/* Error messages */}
                {errors.length > 0 && (
                    <div className="mt-3 space-y-1">
                        {errors.map((error, index) => (
                            <div key={index} className="flex items-center gap-2 text-xs" style={{ color: 'var(--brand-danger)' }}>
                                <AlertCircle size={12} />
                                <span>{error}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* File list */}
                {files.length > 0 && (
                    <div className="mt-4 space-y-2">
                        {files.map(file => (
                            <div key={file.id} className="bg-surface-hover border border-border-default p-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3 flex-1">
                                        {getFileIcon(file.type, expectedFileType)}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                                                {file.name}
                                            </p>
                                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                                {formatFileSize(file.size)}
                                            </p>
                                            {file.status === 'uploading' && (
                                                <div className="mt-2 h-1 bg-border-default overflow-hidden">
                                                    <div
                                                        className="h-full bg-brand-accent transition-all duration-300"
                                                        style={{ width: `${file.progress}%` }}
                                                    />
                                                </div>
                                            )}
                                            {file.status === 'completed' && (
                                                <div className="mt-1 flex items-center gap-1">
                                                    <CheckCircle size={12} className="text-brand-success" />
                                                    <span className="text-xs" style={{ color: 'var(--brand-success)' }}>Completed</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeFile(file.id)}
                                        className="ml-2 p-1 transition-colors"
                                        style={{ color: 'var(--text-tertiary)' }}
                                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--brand-danger)'}
                                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}