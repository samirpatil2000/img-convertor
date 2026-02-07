
export enum ConversionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
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
  error?: string;
}

export interface AppState {
  files: FileRecord[];
  isDragging: boolean;
}
