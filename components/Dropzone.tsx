import React, { useRef, useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';

interface DropzoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
  acceptedExtensions?: string[]; // e.g. ['.srt', '.txt', '.csv']
}

export const Dropzone: React.FC<DropzoneProps> = ({ 
  onFileSelect, 
  selectedFile, 
  onClear,
  acceptedExtensions = ['.srt']
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
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
      alert(`Invalid file type. Please upload: ${extensionLabel}`);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelect(e.dataTransfer.files[0]);
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
        ) : (
            <div 
                onClick={handleClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                    cursor-pointer
                    border-2 border-dashed rounded-md p-8
                    flex flex-col items-center justify-center text-center
                    transition-colors duration-200
                    ${isDragOver ? 'border-[#3399FF] bg-[#3399FF]/10' : 'border-[#444] hover:border-[#666]'}
                `}
            >
                <Upload size={24} className="mb-3 text-gray-400" />
                <p className="text-sm font-medium text-gray-300">
                    Click to browse or drag file
                </p>
                <p className="text-xs text-gray-500 mt-1">
                    Supports {extensionLabel}
                </p>
            </div>
        )}
    </div>
  );
};