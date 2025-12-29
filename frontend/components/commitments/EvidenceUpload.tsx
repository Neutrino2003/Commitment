'use client';

import { useState } from 'react';
import { commitmentAttachmentsApi } from '@/lib/api';
import FileUpload from '@/components/ui/FileUpload';
import AttachmentList from '@/components/ui/AttachmentList';
import { Camera, FileText, MoreHorizontal, Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Attachment {
    id: number;
    file_name: string;
    file_size: number;
    file_type: string;
    file_url: string;
    is_image: boolean;
    is_video?: boolean;
    attachment_type: 'evidence' | 'document' | 'other';
    description?: string;
    created_at: string;
    uploaded_by_username?: string;
}

interface EvidenceUploadProps {
    commitmentId: number;
    attachments: Attachment[];
    onAttachmentAdded: (attachment: Attachment) => void;
    onAttachmentDeleted: (id: number) => void;
    className?: string;
}

const ATTACHMENT_TYPES = [
    { id: 'evidence', label: 'Evidence', icon: Camera, description: 'Photo/video proof' },
    { id: 'document', label: 'Document', icon: FileText, description: 'PDF, docs, etc.' },
    { id: 'other', label: 'Other', icon: MoreHorizontal, description: 'Any other files' },
];

export default function EvidenceUpload({
    commitmentId,
    attachments,
    onAttachmentAdded,
    onAttachmentDeleted,
    className = ''
}: EvidenceUploadProps) {
    const [selectedType, setSelectedType] = useState<'evidence' | 'document' | 'other'>('evidence');
    const [description, setDescription] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleUpload = async (file: File) => {
        setIsUploading(true);
        setUploadProgress(0);

        try {
            const response = await commitmentAttachmentsApi.upload(
                commitmentId,
                file,
                selectedType,
                description,
                (progress) => setUploadProgress(progress)
            );

            onAttachmentAdded(response.data);
            setDescription('');
            toast.success('Evidence uploaded successfully!');
        } catch (error: any) {
            const message = error.response?.data?.error || 'Upload failed';
            toast.error(message);
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const handleDelete = async (attachmentId: number) => {
        if (!confirm('Delete this attachment?')) return;

        try {
            await commitmentAttachmentsApi.delete(attachmentId);
            onAttachmentDeleted(attachmentId);
            toast.success('Attachment deleted');
        } catch (error) {
            toast.error('Failed to delete attachment');
        }
    };

    // Group attachments by type
    const evidenceFiles = attachments.filter(a => a.attachment_type === 'evidence');
    const documentFiles = attachments.filter(a => a.attachment_type === 'document');
    const otherFiles = attachments.filter(a => a.attachment_type === 'other');

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Attachment Type Selector */}
            <div>
                <h4 className="font-bold text-sm text-gray-500 mb-3 uppercase">Upload Type</h4>
                <div className="grid grid-cols-3 gap-2">
                    {ATTACHMENT_TYPES.map(type => {
                        const Icon = type.icon;
                        const isSelected = selectedType === type.id;
                        return (
                            <button
                                key={type.id}
                                onClick={() => setSelectedType(type.id as typeof selectedType)}
                                className={`p-3 border-2 text-center transition-all ${isSelected
                                        ? 'border-ink-black bg-focus-yellow'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <Icon size={20} className="mx-auto mb-1" />
                                <div className="font-bold text-sm">{type.label}</div>
                                <div className="text-xs text-gray-500">{type.description}</div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Description Input */}
            <div>
                <label className="block font-bold text-sm text-gray-500 mb-2 uppercase">
                    Description (optional)
                </label>
                <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of this file..."
                    className="w-full px-3 py-2 border-2 border-gray-200 focus:border-ink-black focus:outline-none font-medium"
                />
            </div>

            {/* Upload Area */}
            <div>
                <label className="block font-bold text-sm text-gray-500 mb-2 uppercase">
                    Upload File
                </label>
                <FileUpload
                    onUpload={handleUpload}
                    label={`Upload ${selectedType}`}
                    maxSize={10 * 1024 * 1024}
                    accept={selectedType === 'evidence' ? 'image/*,video/*' : '*/*'}
                    disabled={isUploading}
                />
                {isUploading && (
                    <div className="mt-2">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-focus-yellow transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Uploading... {uploadProgress}%</p>
                    </div>
                )}
            </div>

            {/* Existing Attachments */}
            {attachments.length > 0 && (
                <div className="space-y-4">
                    {/* Evidence Files */}
                    {evidenceFiles.length > 0 && (
                        <div>
                            <h5 className="font-bold text-sm text-gray-600 mb-2 flex items-center gap-2">
                                <Camera size={14} />
                                Evidence ({evidenceFiles.length})
                            </h5>
                            <AttachmentList
                                attachments={evidenceFiles}
                                onDelete={handleDelete}
                            />
                        </div>
                    )}

                    {/* Document Files */}
                    {documentFiles.length > 0 && (
                        <div>
                            <h5 className="font-bold text-sm text-gray-600 mb-2 flex items-center gap-2">
                                <FileText size={14} />
                                Documents ({documentFiles.length})
                            </h5>
                            <AttachmentList
                                attachments={documentFiles}
                                onDelete={handleDelete}
                            />
                        </div>
                    )}

                    {/* Other Files */}
                    {otherFiles.length > 0 && (
                        <div>
                            <h5 className="font-bold text-sm text-gray-600 mb-2 flex items-center gap-2">
                                <MoreHorizontal size={14} />
                                Other Files ({otherFiles.length})
                            </h5>
                            <AttachmentList
                                attachments={otherFiles}
                                onDelete={handleDelete}
                            />
                        </div>
                    )}
                </div>
            )}

            {attachments.length === 0 && !isUploading && (
                <div className="text-center py-6 bg-gray-50 border-2 border-dashed border-gray-200">
                    <Upload size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500 text-sm">No attachments yet</p>
                    <p className="text-gray-400 text-xs">Upload evidence to prove your commitment</p>
                </div>
            )}
        </div>
    );
}
