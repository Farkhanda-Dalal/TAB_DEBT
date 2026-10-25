import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { ProtectedUrl } from '../../type';
import {
  addProtectedUrl,
  getProtectedUrls,
  removeProtectedUrl,
} from '../../utils/storage';

interface ProtectionManagerProps {
  onChange?: (urls: ProtectedUrl[]) => void;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function ProtectionManager({ onChange }: ProtectionManagerProps) {
  const [url, setUrl] = useState('');
  const [protectedUrls, setProtectedUrls] = useState<ProtectedUrl[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void getProtectedUrls()
      .then((urls) => {
        setProtectedUrls(urls);
        onChange?.(urls);
      })
      .catch(() => setError('Unable to load protected URLs. Please try again.'))
      .finally(() => setIsLoading(false));
  }, [onChange]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedUrl = url.trim();

    if (!isValidHttpUrl(normalizedUrl)) {
      setError('Enter a complete http:// or https:// URL.');
      return;
    }

    if (protectedUrls.some((entry) => entry.url === normalizedUrl)) {
      setError('That exact URL is already protected.');
      return;
    }

    setIsSaving(true);
    try {
      const next = await addProtectedUrl(normalizedUrl);
      setProtectedUrls(next);
      onChange?.(next);
      setUrl('');
      setError('');
    } catch {
      setError('Unable to save this URL. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRemove(urlToRemove: string) {
    try {
      const next = await removeProtectedUrl(urlToRemove);
      setProtectedUrls(next);
      onChange?.(next);
      setError('');
    } catch {
      setError('Unable to remove this URL. Please try again.');
    }
  }

  return (
    <section className="panel protection-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Untouchable list</p>
          <h2>Protect important pages</h2>
        </div>
        <span className="count-badge">{protectedUrls.length}</span>
      </div>
      <p className="section-description">
        Add a complete URL to keep that exact page out of future cleanup.
      </p>
      <form className="url-form" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="protected-url">
          Full URL to protect
        </label>
        <input
          id="protected-url"
          type="url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://example.com/important-page"
          aria-describedby={error ? 'url-error' : undefined}
        />
        <button className="button button-primary" type="submit">
          {isSaving ? 'Saving...' : 'Add URL'}
        </button>
      </form>
      {error && (
        <p className="form-error" id="url-error" role="alert">
          {error}
        </p>
      )}
      {isLoading ? (
        <p className="empty-message">Loading protected URLs...</p>
      ) : protectedUrls.length === 0 ? (
        <p className="empty-message">No protected URLs yet.</p>
      ) : (
        <ul className="protected-list">
          {protectedUrls.map((entry) => (
            <li key={entry.url}>
              <span className="url-label">{entry.url}</span>
              <button
                className="button button-quiet"
                type="button"
                onClick={() => void handleRemove(entry.url)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
