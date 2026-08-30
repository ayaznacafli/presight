import type { Facets } from '@/lib/api/types.ts';
import { FACET_LIMIT } from '@/lib/api/directory.api.ts';
import { FacetSection } from './FacetSection.tsx';
import type { DirectoryParams } from '../hooks/useDirectoryParams.ts';

interface FilterSidebarProps {
  facets: Facets | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  params: DirectoryParams;
}

export function FilterSidebar({ facets, isLoading, isError, onRetry, params }: FilterSidebarProps) {
  const { filters, toggleHobby, toggleNationality, clearFacetFilters, setNationalities } = params;
  const selectedCount = filters.hobbies.length + filters.nationalities.length;

  return (
    <div className="flex h-full flex-col bg-surface">
      <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-text">Filters</h2>
        {selectedCount > 0 && (
          <button
            type="button"
            onClick={clearFacetFilters}
            className="text-xs font-medium text-accent hover:underline"
          >
            Clear ({selectedCount})
          </button>
        )}
      </header>

      {isError ? (
        <div className="px-4 py-6 text-center">
          <p className="text-sm text-text-muted">Filters could not be loaded.</p>
          <button type="button" onClick={onRetry} className="mt-2 text-xs font-medium text-accent hover:underline">
            Retry
          </button>
        </div>
      ) : (
        <div className="scrollbar-slim min-h-0 flex-1 overflow-y-auto">
          <FacetSection
            title="Hobbies"
            hint={`top ${FACET_LIMIT} · all must match`}
            values={facets?.hobbies ?? []}
            selected={filters.hobbies}
            isLoading={isLoading}
            onToggle={toggleHobby}
          />
          <FacetSection
            title="Nationalities"
            hint={`top ${FACET_LIMIT} · any match`}
            values={facets?.nationalities ?? []}
            selected={filters.nationalities}
            isLoading={isLoading}
            onToggle={toggleNationality}
            onClearSelection={() => setNationalities([])}
          />
        </div>
      )}
    </div>
  );
}
