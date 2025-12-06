import React, { useRef, useState } from 'react';
import { Upload, FileText, X, Eye, EyeOff, Pencil } from 'lucide-react';

interface DropzoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
  acceptedExtensions?: string[]; // e.g. ['.srt', '.txt', '.csv']
  onValidationError?: (message: string) => void; // Optional callback for validation errors
  onPasteContent?: (content: string) => void; // Optional callback for pasted content
  hasContent?: boolean; // Whether content has been pasted (no file)
  contentLabel?: string; // Label for pasted content display
  pastedContent?: string; // The actual pasted content for preview
  onContentChange?: (content: string) => void; // Callback when content is edited
}

export const Dropzone: React.FC<DropzoneProps> = ({
  onFileSelect,
  selectedFile,
  onClear,
  acceptedExtensions = ['.srt'],
  onValidationError,
  onPasteContent,
  hasContent = false,
  contentLabel = 'Pasted Content',
  pastedContent = '',
  onContentChange
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Format extensions for display (e.g. ".srt, .txt")
  const extensionLabel = acceptedExtensions.join(', ');
  // Format accept string for input (e.g. ".srt,.txt")
  const acceptString = acceptedExtensions.join(',');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const validateAndSelect = (file: File) => {
    const fileName = file.name.toLowerCase();
    const isValid = acceptedExtensions.some(ext => fileName.endsWith(ext.toLowerCase()));

    if (isValid) {
      onFileSelect(file);
    } else {
      const errorMsg = `Invalid file type. Please upload: ${extensionLabel}`;
      if (onValidationError) {
        onValidationError(errorMsg);
      } else {
        alert(errorMsg);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelect(e.dataTransfer.files[0]);
    }
  };

  // Handle paste event on the dropzone
  const handlePaste = (e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData('text');
    if (pastedText && onPasteContent) {
      onPasteContent(pastedText);
    }
  };

  const handleClick = () => {
    if (!selectedFile) {
      fileInputRef.current?.click();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
    // Reset value so same file can be selected again if cleared
    if (e.target.value) e.target.value = '';
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleInputChange}
        accept={acceptString}
        className="hidden"
      />

      {selectedFile ? (
        <div className="flex items-center justify-between p-3 bg-[#2d2d2d] border border-[#444] rounded">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 bg-[#3399FF] rounded-sm text-white">
              <FileText size={18} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-gray-200 truncate">{selectedFile.name}</span>
              <span className="text-xs text-gray-400">{(selectedFile.size / 1024).toFixed(1)} KB</span>
            </div>
          </div>
          <button
            onClick={onClear}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ) : hasContent ? (
        <div className="bg-[#2d2d2d] border border-[#444] rounded overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="p-2 bg-green-600 rounded-sm text-white">
                <FileText size={18} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-gray-200 truncate">{contentLabel}</span>
                <span className="text-xs text-gray-400">
                  {pastedContent.length.toLocaleString()} characters
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {onContentChange && (
                <button
                  onClick={() => {
                    setIsEditing(!isEditing);
                    if (!showPreview) setShowPreview(true);
                  }}
                  className={`p-1.5 hover:bg-[#444] rounded transition-colors ${isEditing ? 'text-green-400' : 'text-gray-400 hover:text-white'}`}
                  title={isEditing ? 'Done editing' : 'Edit content'}
                >
                  <Pencil size={14} />
                </button>
              )}
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-[#444] rounded transition-colors"
                title={showPreview ? 'Hide preview' : 'Show preview'}
              >
                {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              <button
                onClick={onClear}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-[#444] rounded transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Preview/Edit Panel */}
          {showPreview && (
            <div className="border-t border-[#444] bg-[#1e1e1e]">
              {isEditing && onContentChange ? (
                <textarea
                  value={pastedContent}
                  onChange={(e) => onContentChange(e.target.value)}
                  className="w-full h-48 p-3 text-xs text-gray-300 font-mono bg-transparent resize-none focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="Edit your content here..."
                />
              ) : (
                <div className="max-h-48 overflow-y-auto">
                  <pre className="p-3 text-xs text-gray-400 font-mono whitespace-pre-wrap break-words">
                    {pastedContent}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onPaste={handlePaste}
          tabIndex={0}
          className={`
                    cursor-pointer
                    border-2 border-dashed rounded-md p-8
                    flex flex-col items-center justify-center text-center
                    transition-colors duration-200 focus:outline-none focus:border-[#3399FF]
                    ${isDragOver ? 'border-[#3399FF] bg-[#3399FF]/10' : 'border-[#444] hover:border-[#666]'}
                `}
        >
          <Upload size={24} className="mb-3 text-gray-400" />
          <p className="text-sm font-medium text-gray-300">
            {onPasteContent ? 'Click, drag file, or paste text' : 'Click to browse or drag file'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Supports {extensionLabel}{onPasteContent ? ' or Ctrl+V' : ''}
          </p>
        </div>
      )}
    </div>
  );
};