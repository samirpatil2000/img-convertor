
import React from 'react';
import { FileRecord, ConversionStatus } from '../types';

interface FileItemProps {
  file: FileRecord;
  onDownload: (file: FileRecord) => void;
}

const FileItem: React.FC<FileItemProps> = ({ file, onDownload }) => {
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="group bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between h-32">
      <div className="flex justify-between items-start mb-2">
        <div className="truncate flex-1 pr-4">
          <p className="text-sm font-medium text-slate-700 truncate" title={file.name}>
            {file.name}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">{formatSize(file.size)}</p>
        </div>
        
        {file.status === ConversionStatus.COMPLETED && (
          <button 
            onClick={() => onDownload(file)}
            className="text-blue-500 hover:text-blue-600 transition-colors"
            title="Download JPG"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        )}
      </div>

      <div className="mt-auto">
        {file.status === ConversionStatus.PENDING && (
          <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full w-0 bg-blue-500 transition-all duration-500" />
          </div>
        )}

        {file.status === ConversionStatus.PROCESSING && (
          <div className="space-y-2">
            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300 anim-pulse" 
                style={{ width: `${Math.max(10, file.progress)}%` }} 
              />
            </div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Converting...</p>
          </div>
        )}

        {file.status === ConversionStatus.COMPLETED && (
          <div className="flex items-center space-x-2 text-green-500">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-medium">Ready</span>
          </div>
        )}

        {file.status === ConversionStatus.FAILED && (
          <div className="flex flex-col">
            <div className="flex items-center space-x-2 text-rose-500">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-medium">Failed</span>
            </div>
            {file.error && <p className="text-[10px] text-rose-400 mt-1 truncate">{file.error}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileItem;
