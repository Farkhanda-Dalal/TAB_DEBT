# Tab Debt frontend implementation

## Purpose

This document is the handover contract between the Tab Debt frontend and backend. The frontend is being built first for a Manifest V3 Chrome extension using React, TypeScript, and Vite.

## Current frontend behavior

- The main interface is a Chrome Options page opened in a browser tab.
- The manifest uses `options_ui.page = "index.html"` and `open_in_tab = true`.
- The toolbar icon has no popup; the extension settings page can be opened from Chrome's extension details/settings UI.
- The UI lets users save complete HTTP(S) URLs as untouchable rules.
- Version one uses exact URL matching. Path-prefix and regex matching are intentionally deferred.
- The active tab and the Tab Debt options page must be excluded by the future cleanup worker.
- Cleanup age/inactivity rules and close-versus-discard behavior are not finalized.
- Dashboard metrics currently render zero values until the backend supplies real values.
- RAM/memory-saved reporting is deferred.

## Storage contract

The frontend storage utility is [`src/utils/storage.ts`](./src/utils/storage.ts). It uses `chrome.storage.local` in the extension and `window.localStorage` while running in a normal browser.

Storage keys:

| Key | Value |
| --- | --- |
| `tabDebt.protectedUrls` | `ProtectedUrl[]` |
| `tabDebt.savedNotes` | `SavedNote[]` |

Types are defined in [`src/type.ts`](./src/type.ts):

```ts
interface ProtectedUrl {
  url: string;
  addedAt: number;
}

interface SavedNote {
  id: string;
  url: string;
  title: string;
  summary: string;
  savedAt: number;
}
```

The UI stores one protected entry per exact full URL. For example, protecting `https://twitter.com/home` does not protect another Twitter URL.

## Message contract

The dashboard's **Clean my tabs** button sends:

```ts
chrome.runtime.sendMessage({ action: 'CLEANUP_NOW' });
```

The backend service worker should listen for this message. The frontend currently does not require a response, but a future response can provide cleanup metrics and an error state.

The shared message type currently reserves:

```ts
type ExtensionMessageAction =
  | 'CLEANUP_NOW'
  | 'GET_METRICS'
  | 'GET_PROTECTED';
```

## Metrics contract

The first dashboard metrics are:

```ts
interface CleanupMetrics {
  totalTabsScanned: number;
  duplicateTabsClosed: number;
  protectedTabsSkipped: number;
}
```

The intended meaning of `protectedTabsSkipped` is the number of tabs excluded during the latest cleanup because they matched a protected rule. It is not the number of saved rules.

Until the backend integration is implemented, all three values display `0`. No mock database or mock metric source is used.

## Backend integration notes

The backend should:

1. Read `tabDebt.protectedUrls` from `chrome.storage.local`.
2. Compare candidate tabs against the saved `url` values using exact matching for the first version.
3. Exclude the currently active tab.
4. Exclude the Tab Debt options page itself.
5. Handle the not-yet-finalized age/inactivity and close/discard policies.
6. Save AI-generated notes in the `tabDebt.savedNotes` shape.
7. Respond to `CLEANUP_NOW` with `CleanupMetrics` once the response contract is finalized.

No backend/service-worker cleanup behavior is implemented in this frontend work.

## Validation

The project uses:

```bash
npm install
npm run lint
npm run build
```
