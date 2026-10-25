import { useEffect, useState } from 'react';
import type { SavedNote } from '../../type';
import { getSavedNotes } from '../../utils/storage';

export function SavedNotesList() {
  const [notes, setNotes] = useState<SavedNote[]>([]);

  useEffect(() => {
    // 1. Initial load
    void getSavedNotes().then(setNotes);

    // 2. Listen for live updates from background.ts
    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      const storageListener = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
        if (areaName === 'local' && changes['tabDebt.savedNotes']) {
          setNotes((changes['tabDebt.savedNotes'].newValue as SavedNote[] | undefined) ?? []);
        }
      };
      
      chrome.storage.onChanged.addListener(storageListener);
      return () => chrome.storage.onChanged.removeListener(storageListener);
    }
  }, []);

  return (
    <section className="panel notes-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Saved context</p>
          <h2>Tab notes</h2>
        </div>
        <span className="count-badge">{notes.length}</span>
      </div>
      {notes.length === 0 ? (
        <p className="empty-message">
          AI summaries will appear here when the cleanup service is connected.
        </p>
      ) : (
        <ul className="notes-list">
          {notes.map((note) => (
            <li key={note.id} className="note-card">
              <div>
                <h3>{note.title}</h3>
                <p>{note.summary}</p>
              </div>
              <button
                className="button button-quiet"
                type="button"
                onClick={() => window.open(note.url, '_blank', 'noopener,noreferrer')}
              >
                Open
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
