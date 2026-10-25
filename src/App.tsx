import { useCallback, useState } from "react";
import { ProtectionManager } from "./popup/components/ProtectionManager";
import { SavedNotesList } from "./popup/components/SavedNotesList";
import type { ProtectedUrl } from "./type";
import "./App.css";

function App() {
  const [protectedUrls, setProtectedUrls] = useState<ProtectedUrl[]>([]);
  const [cleanupRequested, setCleanupRequested] = useState(false);
  const [metrics, setMetrics] = useState({
    totalTabsScanned: 0,
    duplicateTabsClosed: 0,
    protectedTabsSkipped: 0,
  });

  const handleProtectedUrlsChange = useCallback((urls: ProtectedUrl[]) => {
    setProtectedUrls(urls);
  }, []);

function handleCleanup() {
    setCleanupRequested(true);
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ action: 'CLEANUP_NOW' }, (response) => {
        if (response?.success && response?.metrics) {
          setMetrics(response.metrics);
          setCleanupRequested(false); // Removes the continuous loading message
        }
      });
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
        <button
          className="button button-primary cleanup-button"
          type="button"
          onClick={handleCleanup}
        >
          Clean my tabs
        </button>
      </header>

      {cleanupRequested && (
        <p className="status-message" role="status">
          Cleanup requested. Metrics will update when the background service is
          connected.
        </p>
      )}

      <section className="metrics-grid" aria-label="Cleanup metrics">
        <article className="metric-card">
          <span>Total tabs scanned</span>
          <strong>{metrics.totalTabsScanned}</strong>
        </article>
        <article className="metric-card">
          <span>Duplicate tabs closed</span>
          <strong>{metrics.duplicateTabsClosed}</strong>
        </article>
        <article className="metric-card">
          <span>Protected tabs skipped</span>
          <strong>{metrics.protectedTabsSkipped}</strong>
        </article>
      </section>

      <div className="content-grid">
        <ProtectionManager onChange={handleProtectedUrlsChange} />
        <SavedNotesList />
      </div>

      <footer className="app-footer">
        <span>
          {protectedUrls.length} protected URL
          {protectedUrls.length === 1 ? "" : "s"}
        </span>
        <span>Metrics are ready for backend integration.</span>
      </footer>
    </main>
  );
}

export default App;
