
export enum ConversionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export enum AppTab {
  CONVERT = 'CONVERT',
  COMPRESS = 'COMPRESS'
}

export interface FileRecord {
  id: string;
  originalFile: File;
  name: string;
  size: number;
  status: ConversionStatus;
  progress: number;
  resultUrl?: string;
  resultBlob?: Blob;
  resultSize?: number;
  error?: string;
}

export interface CompressionSettings {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  useWebWorker: boolean;
  fileType: string;
}
