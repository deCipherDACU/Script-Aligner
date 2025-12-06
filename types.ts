export type ProcessingStatus = 'IDLE' | 'ALIGNING' | 'COMPLETED' | 'ERROR';

/** Output script format options */
export type OutputScript = 'latin' | 'devanagari' | 'mixed';

export interface AlignmentResult {
  originalSrt: string;
  correctedSrt: string;
  changesCount?: number;
}

export interface ProcessingError {
  message: string;
  details?: string;
}

/** Session storage data structure for auto-save */
export interface SessionData {
  srtContent: string;
  scriptContent: string;
  correctedSrt: string;
  originalOutput: string;
  isEdited: boolean;
  srtFileName?: string;
  lastModified: number;
}

/** Processing options for alignment/correction */
export interface ProcessingOptions {
  outputScript?: OutputScript;
  applyITN?: boolean;
  usePhonetics?: boolean;
}
