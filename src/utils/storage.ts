import type { ProtectedUrl, SavedNote } from '../type';

const PROTECTED_URLS_KEY = 'tabDebt.protectedUrls';
const SAVED_NOTES_KEY = 'tabDebt.savedNotes';

const hasChromeStorage = (): boolean =>
  typeof chrome !== 'undefined' && Boolean(chrome.storage?.local);

const isProtectedUrl = (value: unknown): value is ProtectedUrl =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as ProtectedUrl).url === 'string' &&
  typeof (value as ProtectedUrl).addedAt === 'number';

const asProtectedUrls = (value: unknown): ProtectedUrl[] =>
  Array.isArray(value) ? value.filter(isProtectedUrl) : [];

const readBrowserValue = <T>(key: string, fallback: T): T => {
  const value = window.localStorage.getItem(key);
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const writeBrowserValue = <T>(key: string, value: T): void => {
  window.localStorage.setItem(key, JSON.stringify(value));
};

export async function getProtectedUrls(): Promise<ProtectedUrl[]> {
  if (hasChromeStorage()) {
    const result = await chrome.storage.local.get(PROTECTED_URLS_KEY);
    return asProtectedUrls(result[PROTECTED_URLS_KEY]);
  }

  return asProtectedUrls(readBrowserValue<unknown>(PROTECTED_URLS_KEY, []));
}

export async function addProtectedUrl(url: string): Promise<ProtectedUrl[]> {
  const current = await getProtectedUrls();
  const next = [...current, { url: url.trim(), addedAt: Date.now() }];

  if (hasChromeStorage()) {
    await chrome.storage.local.set({ [PROTECTED_URLS_KEY]: next });
  } else {
    writeBrowserValue(PROTECTED_URLS_KEY, next);
  }

  return next;
}

export async function removeProtectedUrl(url: string): Promise<ProtectedUrl[]> {
  const next = (await getProtectedUrls()).filter((entry) => entry.url !== url);

  if (hasChromeStorage()) {
    await chrome.storage.local.set({ [PROTECTED_URLS_KEY]: next });
  } else {
    writeBrowserValue(PROTECTED_URLS_KEY, next);
  }

  return next;
}

export async function getSavedNotes(): Promise<SavedNote[]> {
  if (hasChromeStorage()) {
    const result = await chrome.storage.local.get(SAVED_NOTES_KEY);
    return (result[SAVED_NOTES_KEY] as SavedNote[] | undefined) ?? [];
  }

  return readBrowserValue<SavedNote[]>(SAVED_NOTES_KEY, []);
}

export async function addSavedNote(note: SavedNote): Promise<SavedNote[]> {
  const next = [...(await getSavedNotes()), note];

  if (hasChromeStorage()) {
    await chrome.storage.local.set({ [SAVED_NOTES_KEY]: next });
  } else {
    writeBrowserValue(SAVED_NOTES_KEY, next);
  }

  return next;
}
