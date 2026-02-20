
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import DropZone from './components/DropZone.tsx';
import FileItem from './components/FileItem.tsx';
import { AppTab, CompressionMode, CompressionSettings, ConversionStatus, FileRecord } from './types.ts';

// Declare globals for libraries loaded via CDN
declare const heic2any: any;
declare const JSZip: any;
declare const imageCompression: any;

const MAX_CONCURRENT = 3;

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.CONVERT);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
  // Compression Settings
  const [compressionSettings, setCompressionSettings] = useState<CompressionSettings>({
    mode: CompressionMode.MB,
    maxSizeMB: 1,
    maxSizePercent: 50,
    maxWidthOrHeight: 1920,
    keepOriginalDimensions: false,
    useWebWorker: true,
    fileType: 'image/jpeg'
  });

  const processingRef = useRef<number>(0);

  // Clean up Object URLs
  useEffect(() => {
    return () => {
      files.forEach(f => {
        if (f.resultUrl) URL.revokeObjectURL(f.resultUrl);
      });
    };
  }, [files]);

  const handleFilesAdded = useCallback((fileList: FileList) => {
    const isConvert = activeTab === AppTab.CONVERT;
    
    const newFiles: FileRecord[] = Array.from(fileList)
      .filter(f => {
        if (isConvert) return f.name.toLowerCase().endsWith('.heic') || f.name.toLowerCase().endsWith('.heif');
        return f.type.startsWith('image/');
      })
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
  }, [activeTab]);

  const processFile = async (fileRecord: FileRecord) => {
    try {
      setFiles(prev => prev.map(f => 
        f.id === fileRecord.id ? { ...f, status: ConversionStatus.PROCESSING, progress: 10 } : f
      ));

      let resultBlob: Blob;

      if (activeTab === AppTab.CONVERT) {
        // HEIC TO JPG
        const blob = await heic2any({
          blob: fileRecord.originalFile,
          toType: 'image/jpeg',
          quality: 0.9,
        });
        resultBlob = Array.isArray(blob) ? blob[0] : blob;
      } else {
        // COMPRESS
        let targetMB = compressionSettings.maxSizeMB;
        if (compressionSettings.mode === CompressionMode.PERCENTAGE) {
          // Calculate MB from percentage of original file size
          const originalMB = fileRecord.size / (1024 * 1024);
          targetMB = originalMB * (compressionSettings.maxSizePercent / 100);
          // Ensure at least a tiny bit of data is allowed
          targetMB = Math.max(0.01, targetMB);
        }

        const options: any = {
          maxSizeMB: targetMB,
          useWebWorker: compressionSettings.useWebWorker,
          fileType: compressionSettings.fileType,
          onProgress: (p: number) => {
             setFiles(prev => prev.map(f => f.id === fileRecord.id ? { ...f, progress: p } : f));
          }
        };

        if (!compressionSettings.keepOriginalDimensions) {
          options.maxWidthOrHeight = compressionSettings.maxWidthOrHeight;
        }

        resultBlob = await imageCompression(fileRecord.originalFile, options);
      }

      const url = URL.createObjectURL(resultBlob);

      setFiles(prev => prev.map(f => 
        f.id === fileRecord.id ? { 
          ...f, 
          status: ConversionStatus.COMPLETED, 
          progress: 100, 
          resultUrl: url,
          resultBlob: resultBlob,
          resultSize: resultBlob.size
        } : f
      ));
    } catch (err: any) {
      console.error('Task failed:', err);
      setFiles(prev => prev.map(f => 
        f.id === fileRecord.id ? { 
          ...f, 
          status: ConversionStatus.FAILED, 
          error: err.message || 'Task failed' 
        } : f
      ));
    } finally {
      processingRef.current -= 1;
    }
  };

  useEffect(() => {
    const pending = files.filter(f => f.status === ConversionStatus.PENDING);
    if (pending.length > 0 && processingRef.current < MAX_CONCURRENT) {
      const toProcess = pending.slice(0, MAX_CONCURRENT - processingRef.current);
      toProcess.forEach(file => {
        processingRef.current += 1;
        processFile(file);
      });
    }
  }, [files, activeTab, compressionSettings]);

  const handleDownloadSingle = (file: FileRecord) => {
    if (!file.resultUrl) return;
    const link = document.createElement('a');
    link.href = file.resultUrl;
    const isConvert = activeTab === AppTab.CONVERT;
    link.download = isConvert 
      ? file.name.replace(/\.(heic|heif)$/i, '.jpg')
      : file.name.replace(/(\.[\w\d]+)$/, '_compressed$1');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = async () => {
    const completedFiles = files.filter(f => f.status === ConversionStatus.COMPLETED && f.resultBlob);
    if (completedFiles.length === 0) return;

    if (completedFiles.length === 1) {
      handleDownloadSingle(completedFiles[0]);
      return;
    }

    const zip = new JSZip();
    completedFiles.forEach(f => {
      const isConvert = activeTab === AppTab.CONVERT;
      const fileName = isConvert 
        ? f.name.replace(/\.(heic|heif)$/i, '.jpg')
        : f.name.replace(/(\.[\w\d]+)$/, '_compressed$1');
      zip.file(fileName, f.resultBlob!);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeTab.toLowerCase()}_results_${new Date().getTime()}.zip`;
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
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="sticky top-0 z-40 glass border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Pixel Utility</h1>
            </div>

            <div className="bg-slate-200/50 p-1 rounded-xl flex">
              <button 
                onClick={() => { setActiveTab(AppTab.CONVERT); clearAll(); }}
                className={`px-6 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === AppTab.CONVERT ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
              >
                HEIC Convert
              </button>
              <button 
                onClick={() => { setActiveTab(AppTab.COMPRESS); clearAll(); }}
                className={`px-6 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === AppTab.COMPRESS ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Compressor
              </button>
            </div>

            <div className="flex items-center space-x-3">
               {files.length > 0 && (
                <>
                  <button onClick={clearAll} className="text-slate-500 hover:text-slate-800 text-sm font-medium">Clear</button>
                  <button 
                    onClick={handleDownloadAll}
                    disabled={stats.completed === 0}
                    className={`px-5 py-2 rounded-lg text-sm font-bold transition-all shadow-sm ${stats.completed > 0 ? 'bg-[#0071e3] text-white hover:bg-[#0077ed]' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                  >
                    Export {stats.completed > 0 ? `(${stats.completed})` : ''}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="mb-12 text-center sm:text-left">
          <h2 className="text-4xl font-bold tracking-tight text-slate-900 mb-2">
            {activeTab === AppTab.CONVERT ? 'HEIC to JPG' : 'Image Compressor'}
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl">
            {activeTab === AppTab.CONVERT 
              ? 'Convert high-efficiency images to universal formats without losing details.' 
              : 'Reduce image file size while maintaining excellent visual quality.'}
          </p>
        </div>

        {activeTab === AppTab.COMPRESS && (
          <div className="mb-10 bg-white p-6 rounded-[2rem] apple-shadow border border-slate-100 flex flex-wrap gap-8 items-center">
            <div className="flex-1 min-w-[280px]">
              <div className="flex justify-between items-center mb-3">
                <div className="flex flex-col">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Target Size</label>
                  <span className="text-sm font-bold text-[#0071e3]">
                    {compressionSettings.mode === CompressionMode.MB 
                      ? `${compressionSettings.maxSizeMB} MB` 
                      : `${compressionSettings.maxSizePercent}% of original`}
                  </span>
                </div>
                {/* MB/Percentage Segmented Toggle */}
                <div className="bg-slate-100 p-1 rounded-lg flex scale-90">
                  <button 
                    onClick={() => setCompressionSettings(prev => ({ ...prev, mode: CompressionMode.MB }))}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${compressionSettings.mode === CompressionMode.MB ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
                  >
                    MB
                  </button>
                  <button 
                    onClick={() => setCompressionSettings(prev => ({ ...prev, mode: CompressionMode.PERCENTAGE }))}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${compressionSettings.mode === CompressionMode.PERCENTAGE ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
                  >
                    %
                  </button>
                </div>
              </div>
              
              {compressionSettings.mode === CompressionMode.MB ? (
                <input 
                  type="range" min="0.1" max="50" step="0.1" 
                  value={compressionSettings.maxSizeMB}
                  onChange={(e) => setCompressionSettings(prev => ({ ...prev, maxSizeMB: parseFloat(e.target.value) }))}
                />
              ) : (
                <input 
                  type="range" min="1" max="100" step="1" 
                  value={compressionSettings.maxSizePercent}
                  onChange={(e) => setCompressionSettings(prev => ({ ...prev, maxSizePercent: parseInt(e.target.value) }))}
                />
              )}
            </div>
            
            <div className="flex-1 min-w-[280px]">
              <div className="flex justify-between items-center mb-3">
                <div className="flex flex-col">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Max Dimension</label>
                  <span className={`text-sm font-bold ${compressionSettings.keepOriginalDimensions ? 'text-slate-400' : 'text-[#0071e3]'}`}>
                    {compressionSettings.keepOriginalDimensions ? 'Original' : `${compressionSettings.maxWidthOrHeight} px`}
                  </span>
                </div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-slate-300 text-[#0071e3] focus:ring-[#0071e3]"
                    checked={compressionSettings.keepOriginalDimensions}
                    onChange={(e) => setCompressionSettings(prev => ({ ...prev, keepOriginalDimensions: e.target.checked }))}
                  />
                  <span className="text-xs font-bold text-slate-500">Original</span>
                </label>
              </div>
              <input 
                type="range" min="400" max="8000" step="100" 
                value={compressionSettings.maxWidthOrHeight}
                disabled={compressionSettings.keepOriginalDimensions}
                className={compressionSettings.keepOriginalDimensions ? 'opacity-50 cursor-not-allowed' : ''}
                onChange={(e) => setCompressionSettings(prev => ({ ...prev, maxWidthOrHeight: parseInt(e.target.value) }))}
              />
            </div>
          </div>
        )}

        <DropZone 
          onFilesAdded={handleFilesAdded} 
          isDragging={isDragging} 
          setIsDragging={setIsDragging} 
          hasFiles={files.length > 0} 
          currentTab={activeTab}
        />

        {files.length > 0 && (
          <div className="mt-12">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Queue</h3>
              {stats.processing > 0 && (
                <div className="flex items-center space-x-2 text-blue-500">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full anim-pulse" />
                  <span className="text-xs font-bold">Optimizing...</span>
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
      </div>

      <footer className="mt-24 py-12 border-t border-slate-200 flex flex-col items-center justify-center space-y-4">
          <div className="bg-slate-100 px-4 py-2 rounded-full flex items-center space-x-2">
            <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">End-to-End Local Processing</span>
          </div>
          <p className="text-sm text-slate-400">Privacy first. Your images never leave your browser.</p>
      </footer>
    </div>
  );
};

export default App;
