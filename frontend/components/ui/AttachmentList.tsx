'use client';

import { useState } from 'react';

interface Attachment {
    id: number;
    file_name: string;
    file_size: number;
    file_type: string;
    file_url: string;
    is_image: boolean;
    created_at: string;
    uploaded_by_username?: string;
}

interface AttachmentListProps {
    attachments: Attachment[];
    onDelete?: (id: number) => Promise<void>;
    showDelete?: boolean;
    className?: string;
}

const FILE_ICONS: Record<string, string> = {
    // Images
    'image': '🖼️',
    // Documents
    'application/pdf': '📄',
    'application/msword': '📝',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
    'application/vnd.ms-excel': '📊',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
    'application/vnd.ms-powerpoint': '📊',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': '📊',
    // Text
    'text/plain': '📃',
    'text/markdown': '📃',
    'text/csv': '📊',
    // Archives
    'application/zip': '📦',
    'application/x-rar-compressed': '📦',
    // Videos
    'video': '🎬',
    // Audio
    'audio': '🎵',
    // Default
    'default': '📎'
};

function getFileIcon(fileType: string): string {
    if (fileType.startsWith('image/')) return FILE_ICONS['image'];
    if (fileType.startsWith('video/')) return FILE_ICONS['video'];
    if (fileType.startsWith('audio/')) return FILE_ICONS['audio'];
    return FILE_ICONS[fileType] || FILE_ICONS['default'];
}

function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

export default function AttachmentList({
    attachments,
    onDelete,
    showDelete = true,
    className = ''
}: AttachmentListProps) {
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const handleDelete = async (id: number) => {
        if (!onDelete) return;

        setDeletingId(id);
        try {
            await onDelete(id);
        } finally {
            setDeletingId(null);
        }
    };

    const handleDownload = (attachment: Attachment) => {
        const link = document.createElement('a');
        link.href = attachment.file_url;
        link.download = attachment.file_name;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (attachments.length === 0) {
        return (
            <div className={`text-gray-500 dark:text-gray-400 text-sm ${className}`}>
                No attachments
            </div>
        );
    }

    return (
        <div className={className}>
            <div className="space-y-2">
                {attachments.map((attachment) => (
                    <div
                        key={attachment.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        {/* File Icon or Image Preview */}
                        <div className="flex-shrink-0">
                            {attachment.is_image ? (
                                <img
                                    src={attachment.file_url}
                                    alt={attachment.file_name}
                                    className="w-10 h-10 object-cover rounded cursor-pointer"
                                    onClick={() => setPreviewImage(attachment.file_url)}
                                />
                            ) : (
                                <span className="text-2xl">
                                    {getFileIcon(attachment.file_type)}
                                </span>
                            )}
                        </div>

                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {attachment.file_name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatFileSize(attachment.file_size)}
                                {attachment.uploaded_by_username && (
                                    <> • by {attachment.uploaded_by_username}</>
                                )}
                                <> • {formatDate(attachment.created_at)}</>
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex-shrink-0 flex items-center gap-2">
                            <button
                                onClick={() => handleDownload(attachment)}
                                className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                                title="Download"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                            </button>

                            {showDelete && onDelete && (
                                <button
                                    onClick={() => handleDelete(attachment.id)}
                                    disabled={deletingId === attachment.id}
                                    className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                                    title="Delete"
                                >
                                    {deletingId === attachment.id ? (
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Image Preview Modal */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/75"
                    onClick={() => setPreviewImage(null)}
                >
                    <div className="max-w-4xl max-h-[90vh] p-2">
                        <img
                            src={previewImage}
                            alt="Preview"
                            className="max-w-full max-h-full object-contain rounded-lg"
                        />
                    </div>
                    <button
                        onClick={() => setPreviewImage(null)}
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
}
