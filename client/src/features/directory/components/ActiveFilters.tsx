import type { DirectoryParams } from '../hooks/useDirectoryParams.ts';

interface Token {
  key: string;
  label: string;
  group: string;
  onRemove: () => void;
}

export function ActiveFilters({ params }: { params: DirectoryParams }) {
  const { filters, toggleHobby, toggleNationality, setQuery, clearAll } = params;

  const tokens: Token[] = [
    ...(filters.q ? [{ key: `q:${filters.q}`, group: 'Search', label: filters.q, onRemove: () => setQuery('') }] : []),
    ...filters.hobbies.map((value) => ({
      key: `h:${value}`,
      group: 'Hobby',
      label: value,
      onRemove: () => toggleHobby(value),
    })),
    ...filters.nationalities.map((value) => ({
      key: `n:${value}`,
      group: 'Nationality',
      label: value,
      onRemove: () => toggleNationality(value),
    })),
  ];

  if (tokens.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 px-3 pb-3 sm:px-4">
      {tokens.map((token) => (
        <span
          key={token.key}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-surface py-1 pr-1 pl-2.5 text-xs"
        >
          <span className="text-text-subtle">{token.group}:</span>
          <span className="max-w-[12rem] truncate font-medium text-text">{token.label}</span>
          <button
            type="button"
            onClick={token.onRemove}
            aria-label={`Remove ${token.group.toLowerCase()} filter ${token.label}`}
            className="flex size-4 items-center justify-center rounded-full text-text-subtle transition-colors hover:bg-surface-muted hover:text-text"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-3">
              <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </button>
        </span>
      ))}

      {tokens.length > 1 && (
        <button type="button" onClick={clearAll} className="ml-1 text-xs font-medium text-accent hover:underline">
          Clear all
        </button>
      )}
    </div>
  );
}
