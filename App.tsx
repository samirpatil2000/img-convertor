
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import DropZone from './components/DropZone';
import FileItem from './components/FileItem';
import { FileRecord, ConversionStatus } from './types';

// Declare globals for libraries loaded via CDN
declare const heic2any: any;
declare const JSZip: any;

const MAX_CONCURRENT = 3; // Batch size to keep UI responsive and memory stable

const App: React.FC = () => {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const processingRef = useRef<number>(0);

  // Clean up Object URLs when files are removed or component unmounts
  useEffect(() => {
    return () => {
      files.forEach(f => {
        if (f.resultUrl) URL.revokeObjectURL(f.resultUrl);
      });
    };
  }, [files]);

  const handleFilesAdded = useCallback((fileList: FileList) => {
    const newFiles: FileRecord[] = Array.from(fileList)
      .filter(f => f.name.toLowerCase().endsWith('.heic') || f.name.toLowerCase().endsWith('.heif'))
      .map(f => ({
        id: uuidv4(),
        originalFile: f,
        name: f.name,
        size: f.size,
        status: ConversionStatus.PENDING,
        progress: 0,
      }));

    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles]);
    }
  }, []);

  const convertFile = async (fileRecord: FileRecord) => {
    try {
      setFiles(prev => prev.map(f => 
        f.id === fileRecord.id ? { ...f, status: ConversionStatus.PROCESSING, progress: 10 } : f
      ));

      // Small delay to ensure UI updates before heavy work
      await new Promise(r => setTimeout(r, 50));

      const blob = await heic2any({
        blob: fileRecord.originalFile,
        toType: 'image/jpeg',
        quality: 0.9,
      });

      // Handle both array and single blob return from heic2any
      const finalBlob = Array.isArray(blob) ? blob[0] : blob;
      const url = URL.createObjectURL(finalBlob);

      setFiles(prev => prev.map(f => 
        f.id === fileRecord.id ? { 
          ...f, 
          status: ConversionStatus.COMPLETED, 
          progress: 100, 
          resultUrl: url,
          resultBlob: finalBlob
        } : f
      ));
    } catch (err: any) {
      console.error('Conversion failed:', err);
      setFiles(prev => prev.map(f => 
        f.id === fileRecord.id ? { 
          ...f, 
          status: ConversionStatus.FAILED, 
          error: err.message || 'Unknown error' 
        } : f
      ));
    } finally {
      processingRef.current -= 1;
    }
  };

  // Queue Manager: Start processing files when available
  useEffect(() => {
    const pending = files.filter(f => f.status === ConversionStatus.PENDING);
    if (pending.length > 0 && processingRef.current < MAX_CONCURRENT) {
      const toProcess = pending.slice(0, MAX_CONCURRENT - processingRef.current);
      toProcess.forEach(file => {
        processingRef.current += 1;
        convertFile(file);
      });
    }
  }, [files]);

  const handleDownloadSingle = (file: FileRecord) => {
    if (!file.resultUrl) return;
    const link = document.createElement('a');
    link.href = file.resultUrl;
    link.download = file.name.replace(/\.(heic|heif)$/i, '.jpg');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = async () => {
    const completedFiles = files.filter(f => f.status === ConversionStatus.COMPLETED && f.resultBlob);
    if (completedFiles.length === 0) return;

    const zip = new JSZip();
    completedFiles.forEach(f => {
      zip.file(f.name.replace(/\.(heic|heif)$/i, '.jpg'), f.resultBlob!);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `converted_images_${new Date().getTime()}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const clearAll = () => {
    files.forEach(f => {
      if (f.resultUrl) URL.revokeObjectURL(f.resultUrl);
    });
    setFiles([]);
  };

  const stats = {
    total: files.length,
    completed: files.filter(f => f.status === ConversionStatus.COMPLETED).length,
    processing: files.filter(f => f.status === ConversionStatus.PROCESSING).length,
    failed: files.filter(f => f.status === ConversionStatus.FAILED).length,
    pending: files.filter(f => f.status === ConversionStatus.PENDING).length,
  };

  const isWorking = stats.processing > 0 || stats.pending > 0;

  return (
    <div className="min-h-screen flex flex-col max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-800">HEIC Convert</h1>
          <p className="text-slate-400 text-sm font-light mt-0.5">Local. Fast. Private.</p>
        </div>

        {files.length > 0 && (
          <div className="flex items-center space-x-4 animate-in fade-in slide-in-from-top-2 duration-300">
             <button 
              onClick={clearAll}
              className="text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors"
            >
              Clear All
            </button>
            <button 
              onClick={handleDownloadAll}
              disabled={stats.completed === 0}
              className={`
                px-5 py-2.5 rounded-full text-sm font-medium transition-all shadow-sm
                ${stats.completed > 0 
                  ? 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-md' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'}
              `}
            >
              Download {stats.completed > 0 ? `All (${stats.completed})` : 'All'}
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <DropZone 
          onFilesAdded={handleFilesAdded} 
          isDragging={isDragging} 
          setIsDragging={setIsDragging} 
          hasFiles={files.length > 0} 
        />

        {files.length > 0 && (
          <div className="mt-8">
            <div className="flex justify-between items-baseline mb-6">
              <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                Files
              </h2>
              {isWorking && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-blue-500 font-medium anim-pulse">
                    Processing {stats.processing} of {stats.total}...
                  </span>
                </div>
              )}
            </div>

            <div className="file-grid">
              {files.map(file => (
                <FileItem 
                  key={file.id} 
                  file={file} 
                  onDownload={handleDownloadSingle} 
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer / Trust signal */}
      <footer className="mt-20 py-8 border-t border-slate-100 flex flex-col items-center text-slate-300 space-y-2">
         <div className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-xs font-light">Files stay on your device</span>
         </div>
      </footer>
    </div>
  );
};

export default App;
