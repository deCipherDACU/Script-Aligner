export type ProcessingStatus = 'IDLE' | 'READING_FILE' | 'ALIGNING' | 'COMPLETED' | 'ERROR';

export interface AlignmentResult {
  originalSrt: string;
  correctedSrt: string;
  changesCount?: number;
}

export interface ProcessingError {
  message: string;
  details?: string;
}
