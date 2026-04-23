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

        // Check expected file type first
        switch (expectedType) {
            case 'excel':
                return <FileSpreadsheet size={20} className="text-green-600" />;
            case 'pdf':
                return <FileText size={20} className="text-red-600" />;
            case '3d':
                return <Box size={20} className="text-purple-600" />;
            case 'image':
                return <FileImage size={20} className="text-blue-600" />;
            case 'presentation':
                return <FileCode size={20} className="text-orange-600" />;
            default:
                // Dynamic icon based on actual file
                if (extension.includes('pdf')) return <FileText size={20} className="text-red-600" />;
                if (extension.includes('xls') || extension.includes('csv')) return <FileSpreadsheet size={20} className="text-green-600" />;
                if (extension.includes('ppt') || extension.includes('key')) return <FileCode size={20} className="text-orange-600" />;
                if (extension.includes('stl') || extension.includes('step') || extension.includes('obj') || extension.includes('dwg')) return <Box size={20} className="text-purple-600" />;
                if (extension.includes('jpg') || extension.includes('png') || extension.includes('gif')) return <FileImage size={20} className="text-blue-600" />;
                if (extension.includes('zip') || extension.includes('rar')) return <FileArchive size={20} className="text-yellow-600" />;
                if (extension.includes('json') || extension.includes('xml')) return <FileJson size={20} className="text-gray-600" />;
                return <File size={20} className="text-gray-600" />;
        }
    };

    // Validate file
    const validateFile = (file) => {
        const errors = [];

        // Check file size
        if (file.size > maxFileSize * 1024 * 1024) {
            errors.push(`El archivo ${file.name} excede el tamaño máximo de ${maxFileSize}MB`);
        }

        // Check file type if specified
        if (acceptedFileTypes.length > 0) {
            const fileExtension = file.name.split('.').pop().toLowerCase();
            const isValidType = acceptedFileTypes.some(type =>
                file.type.includes(type) || fileExtension === type.toLowerCase()
            );

            if (!isValidType) {
                errors.push(`El archivo ${file.name} no es un tipo válido. Formatos permitidos: ${acceptedFileTypes.join(', ')}`);
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

            // Simulate upload progress
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

                // Callback with uploaded file
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
        e.target.value = ''; // Reset input
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
        <div className="bg-white border border-gray-200">
            {/* Header */}
            <div className="flex items-center gap-2 p-5 pb-0">
                <div className="text-gray-500">
                    <Upload size={16} />
                </div>
                <p className="text-sm font-medium text-gray-900">{title}</p>
            </div>

            <p className="text-xs text-gray-400 px-5 pt-1 pb-4">{subtitle}</p>

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
            text-gray-400 transition cursor-pointer
            min-h-[160px]
            ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          `}
                    onClick={() => document.getElementById(`file-input-${title}`).click()}
                >
                    <Upload size={24} className={`mb-3 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
                    <p className="text-sm text-gray-600 mb-1">
                        {isDragging ? 'Suelta los archivos aquí' : 'Arrastra o haz clic'}
                    </p>
                    <p className="text-xs text-gray-400">
                        Tamaño máximo: {maxFileSize}MB
                    </p>
                    {acceptedFileTypes.length > 0 && (
                        <p className="text-xs text-gray-400 mt-1">
                            Formatos: {acceptedFileTypes.join(', ')}
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
                            <div key={index} className="flex items-center gap-2 text-xs text-red-600">
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
                            <div key={file.id} className="bg-gray-50 border border-gray-200 p-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3 flex-1">
                                        {getFileIcon(file.type, expectedFileType)}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {file.name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {formatFileSize(file.size)}
                                            </p>
                                            {file.status === 'uploading' && (
                                                <div className="mt-2 h-1 bg-gray-200 overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-600 transition-all duration-300"
                                                        style={{ width: `${file.progress}%` }}
                                                    />
                                                </div>
                                            )}
                                            {file.status === 'completed' && (
                                                <div className="mt-1 flex items-center gap-1">
                                                    <CheckCircle size={12} className="text-green-600" />
                                                    <span className="text-xs text-green-600">Completado</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeFile(file.id)}
                                        className="ml-2 p-1 text-gray-400 hover:text-red-600 transition-colors"
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