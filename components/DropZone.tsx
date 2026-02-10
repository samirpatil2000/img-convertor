
import React, { useRef } from 'react';
import { AppTab } from '../types';

interface DropZoneProps {
  onFilesAdded: (files: FileList) => void;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
  hasFiles: boolean;
  currentTab: AppTab;
}

const DropZone: React.FC<DropZoneProps> = ({ onFilesAdded, isDragging, setIsDragging, hasFiles, currentTab }) => {
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

  const isConvert = currentTab === AppTab.CONVERT;
  const accept = isConvert ? ".heic,.heif" : "image/*";

  if (hasFiles) {
    return (
      <div 
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`fixed inset-0 pointer-events-none transition-colors duration-300 z-50 ${isDragging ? 'bg-blue-50/50 ring-4 ring-blue-400 ring-inset pointer-events-auto backdrop-blur-sm' : ''}`}
      >
        {isDragging && (
          <div className="h-full flex items-center justify-center">
            <div className="bg-white/80 backdrop-blur px-8 py-4 rounded-2xl shadow-2xl">
              <p className="text-blue-600 font-semibold text-xl">Drop to add more files</p>
            </div>
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
        min-h-[45vh] flex flex-col items-center justify-center cursor-pointer transition-all duration-300
        border border-dashed rounded-[2.5rem]
        ${isDragging 
          ? 'bg-blue-50 border-blue-400 scale-[0.98]' 
          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-white/80'
        }
        apple-shadow
      `}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleInputChange}
        multiple
        accept={accept}
        className="hidden"
      />
      
      <div className="text-center space-y-6">
        <div className="flex justify-center">
           <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
             <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
             </svg>
           </div>
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">
            {isConvert ? 'Add HEIC files' : 'Add images to compress'}
          </h2>
          <p className="text-slate-500 text-base font-normal">Drag and drop or browse from your device</p>
        </div>
        <button className="bg-[#0071e3] text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-[#0077ed] transition-colors">
          Select Files
        </button>
      </div>
    </div>
  );
};

export default DropZone;
