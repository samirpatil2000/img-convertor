
import React, { useRef } from 'react';

interface DropZoneProps {
  onFilesAdded: (files: FileList) => void;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
  hasFiles: boolean;
}

const DropZone: React.FC<DropZoneProps> = ({ onFilesAdded, isDragging, setIsDragging, hasFiles }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      onFilesAdded(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFilesAdded(e.target.files);
    }
  };

  const triggerPicker = () => {
    fileInputRef.current?.click();
  };

  if (hasFiles) {
    return (
      <div 
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`fixed inset-0 pointer-events-none transition-colors duration-300 ${isDragging ? 'bg-blue-50/50 ring-4 ring-blue-400 ring-inset pointer-events-auto' : ''}`}
      >
        {isDragging && (
          <div className="h-full flex items-center justify-center">
            <p className="text-blue-600 font-medium text-xl">Drop to add more files</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={triggerPicker}
      className={`
        min-h-[60vh] flex flex-col items-center justify-center cursor-pointer transition-all duration-300
        border-2 border-dashed rounded-2xl
        ${isDragging 
          ? 'bg-blue-50 border-blue-400' 
          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
        }
      `}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleInputChange}
        multiple
        accept=".heic,.heif"
        className="hidden"
      />
      
      <div className="text-center space-y-4">
        <div className="flex justify-center mb-2">
           <svg className="w-12 h-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
           </svg>
        </div>
        <h2 className="text-2xl font-light text-slate-800 tracking-tight">Drop HEIC files here</h2>
        <p className="text-slate-400 text-sm font-light">or click to browse your photos</p>
      </div>
    </div>
  );
};

export default DropZone;
