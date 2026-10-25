export interface SavedNote {
  id: string;
  url: string;
  title: string;
  summary: string;
  savedAt: number;
}

export interface ProtectedDomain {
  domain: string;
  addedAt: number;
}

export interface ExtensionMessage {
  action: "CLEANUP_NOW" | "GET_METRICS" | "GET_PROTECTED";
  payload?: unknown;
}
