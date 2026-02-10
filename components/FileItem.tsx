
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

  const getCompressionInfo = () => {
    if (file.status === ConversionStatus.COMPLETED && file.resultSize) {
      const saved = ((file.size - file.resultSize) / file.size) * 100;
      if (saved > 0) {
        return {
          saved: saved.toFixed(0),
          size: formatSize(file.resultSize)
        };
      }
    }
    return null;
  };

  const info = getCompressionInfo();

  return (
    <div className="group bg-white rounded-2xl p-5 apple-shadow transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between border border-white/40">
      <div className="flex justify-between items-start">
        <div className="truncate flex-1 pr-2">
          <p className="text-sm font-semibold text-slate-800 truncate" title={file.name}>
            {file.name}
          </p>
          <div className="flex items-center space-x-2 mt-1">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tight ${file.name.toLowerCase().endsWith('.heic') ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
              {file.name.split('.').pop()}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">{formatSize(file.size)}</span>
          </div>
        </div>
        
        {file.status === ConversionStatus.COMPLETED && (
          <button 
            onClick={() => onDownload(file)}
            className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:bg-[#0071e3] hover:text-white transition-all duration-200"
            title="Download Result"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        )}
      </div>

      <div className="mt-4">
        {file.status === ConversionStatus.PENDING && (
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full w-0 bg-[#0071e3] transition-all duration-500" />
          </div>
        )}

        {file.status === ConversionStatus.PROCESSING && (
          <div className="space-y-2">
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#0071e3] transition-all duration-300 anim-pulse" 
                style={{ width: `${Math.max(10, file.progress)}%` }} 
              />
            </div>
            <p className="text-[10px] uppercase tracking-widest text-[#0071e3] font-bold">Processing...</p>
          </div>
        )}

        {file.status === ConversionStatus.COMPLETED && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-emerald-500">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-bold">Ready</span>
            </div>
            {info && (
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                Saved {info.saved}%
              </span>
            )}
          </div>
        )}

        {file.status === ConversionStatus.FAILED && (
          <div className="flex flex-col">
            <div className="flex items-center space-x-1.5 text-rose-500">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-bold uppercase tracking-tight">Error</span>
            </div>
            {file.error && <p className="text-[10px] text-rose-400 mt-1 truncate italic">{file.error}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileItem;
