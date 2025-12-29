'use client';

import { useState, useRef, useCallback } from 'react';

interface FileUploadProps {
    onUpload: (file: File) => Promise<void>;
    accept?: string;
    maxSize?: number; // in bytes
    className?: string;
    label?: string;
    disabled?: boolean;
}

export default function FileUpload({
    onUpload,
    accept = '*/*',
    maxSize = 10 * 1024 * 1024, // 10MB default
    className = '',
    label = 'Upload a file',
    disabled = false
}: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const validateFile = (file: File): string | null => {
        if (file.size > maxSize) {
            return `File size must be under ${formatFileSize(maxSize)}`;
        }
        return null;
    };

    const handleFile = async (file: File) => {
        setError(null);

        const validationError = validateFile(file);
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsUploading(true);
        setProgress(0);

        try {
            await onUpload(file);
            setProgress(100);
        } catch (err: any) {
            setError(err.message || 'Upload failed');
        } finally {
            setIsUploading(false);
            setProgress(0);
        }
    };

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        if (!disabled) {
            setIsDragging(true);
        }
    }, [disabled]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (disabled) return;

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    }, [disabled]);

    const handleClick = () => {
        if (!disabled) {
            fileInputRef.current?.click();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFile(files[0]);
        }
        // Reset input so the same file can be selected again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className={className}>
            <div
                onClick={handleClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                    relative cursor-pointer
                    border-2 border-dashed rounded-lg p-6
                    transition-all duration-200
                    ${disabled
                        ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 cursor-not-allowed'
                        : isDragging
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }
                `}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={accept}
                    onChange={handleInputChange}
                    className="hidden"
                    disabled={disabled || isUploading}
                />

                <div className="text-center">
                    {isUploading ? (
                        <>
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
                            <p className="text-gray-600 dark:text-gray-400">
                                Uploading... {progress}%
                            </p>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-200"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <svg
                                className="mx-auto h-10 w-10 text-gray-400 dark:text-gray-500 mb-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                />
                            </svg>
                            <p className="text-gray-700 dark:text-gray-300 font-medium">
                                {label}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Drag and drop or click to browse
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                Max file size: {formatFileSize(maxSize)}
                            </p>
                        </>
                    )}
                </div>
            </div>

            {error && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {error}
                </p>
            )}
        </div>
    );
}
