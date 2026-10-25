import { useEffect, useState } from 'react';
import type { SavedNote } from '../../type';
import { getSavedNotes } from '../../utils/storage';

export function SavedNotesList() {
  const [notes, setNotes] = useState<SavedNote[]>([]);

  useEffect(() => {
    void getSavedNotes().then(setNotes);
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
