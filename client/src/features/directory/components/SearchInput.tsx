import { useEffect, useRef, useState } from 'react';
import { useDebouncedValue } from '../hooks/useDebouncedValue.ts';

const DEBOUNCE_MS = 250;

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Keeps the input responsive while the URL (and therefore the network) only
 * updates once typing settles. The URL stays the source of truth: an external
 * change — back/forward, a shared link — is pulled back into the field.
 */
export function SearchInput({ value, onChange }: SearchInputProps) {
  const [draft, setDraft] = useState(value);
  const debounced = useDebouncedValue(draft, DEBOUNCE_MS);
  const lastPushed = useRef(value);

  useEffect(() => {
    if (debounced === lastPushed.current) return;
    lastPushed.current = debounced;
    onChange(debounced);
  }, [debounced, onChange]);

  useEffect(() => {
    if (value === lastPushed.current) return;
    lastPushed.current = value;
    setDraft(value);
  }, [value]);

  return (
    <div className="relative min-w-0 flex-1">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-subtle"
      >
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
        <path d="m20 20-3.6-3.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>

      <input
        type="search"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Search by first or last name…"
        aria-label="Search people by first or last name"
        autoComplete="off"
        spellCheck={false}
        className="h-10 w-full rounded-lg border border-border bg-surface pr-9 pl-9 text-sm text-text
                   placeholder:text-text-subtle focus:border-accent focus:outline-none
                   [&::-webkit-search-cancel-button]:hidden"
      />

      {draft && (
        <button
          type="button"
          onClick={() => setDraft('')}
          aria-label="Clear search"
          className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center
                     rounded-md text-text-subtle transition-colors hover:bg-surface-muted hover:text-text"
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-4">
            <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}
