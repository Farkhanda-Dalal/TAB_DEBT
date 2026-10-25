export interface SavedNote {
  id: string;
  url: string;
  title: string;
  summary: string;
  savedAt: number;
}

export interface ProtectedUrl {
  url: string;
  addedAt: number;
}

export type ProtectedDomain = ProtectedUrl;

export interface CleanupMetrics {
  totalTabsScanned: number;
  duplicateTabsClosed: number;
  protectedTabsSkipped: number;
}

export interface ExtensionMessage {
  action: 'CLEANUP_NOW' | 'GET_METRICS' | 'GET_PROTECTED';
  payload?: unknown;
}
