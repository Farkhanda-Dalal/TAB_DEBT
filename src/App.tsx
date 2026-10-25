import { useCallback, useState } from 'react';
import { ProtectionManager } from './popup/components/ProtectionManager';
import { SavedNotesList } from './popup/components/SavedNotesList';
import type { ProtectedUrl } from './type';
import './App.css';

const zeroMetrics = [
  ['Total tabs scanned', '0'],
  ['Duplicate tabs closed', '0'],
  ['Protected tabs skipped', '0'],
] as const;

function App() {
  const [protectedUrls, setProtectedUrls] = useState<ProtectedUrl[]>([]);
  const [cleanupRequested, setCleanupRequested] = useState(false);

  const handleProtectedUrlsChange = useCallback((urls: ProtectedUrl[]) => {
    setProtectedUrls(urls);
  }, []);

  function handleCleanup() {
    setCleanupRequested(true);
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ action: 'CLEANUP_NOW' });
    }
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="brand-mark">TAB DEBT</p>
          <h1>Make room for what matters.</h1>
          <p className="hero-copy">
            Protect important pages, then let Tab Debt handle the clutter.
          </p>
        </div>
        <button className="button button-primary cleanup-button" type="button" onClick={handleCleanup}>
          Clean my tabs
        </button>
      </header>

      {cleanupRequested && (
        <p className="status-message" role="status">
          Cleanup requested. Metrics will update when the background service is connected.
        </p>
      )}

      <section className="metrics-grid" aria-label="Cleanup metrics">
        {zeroMetrics.map(([label, value]) => (
          <article className="metric-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </section>

      <div className="content-grid">
        <ProtectionManager onChange={handleProtectedUrlsChange} />
        <SavedNotesList />
      </div>

      <footer className="app-footer">
        <span>{protectedUrls.length} protected URL{protectedUrls.length === 1 ? '' : 's'}</span>
        <span>Metrics are ready for backend integration.</span>
      </footer>
    </main>
  );
}

export default App;
