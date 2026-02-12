
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

export enum CompressionMode {
  MB = 'MB',
  PERCENTAGE = 'PERCENTAGE'
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
  mode: CompressionMode;
  maxSizeMB: number;
  maxSizePercent: number;
  maxWidthOrHeight: number;
  useWebWorker: boolean;
  fileType: string;
}
