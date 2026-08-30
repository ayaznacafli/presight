import { useEffect, useState } from 'react';
import { useDirectoryParams } from '../hooks/useDirectoryParams.ts';
import { useFacetsQuery, useUsersQuery } from '../hooks/useDirectoryData.ts';
import { ActiveFilters } from './ActiveFilters.tsx';
import { FilterSidebar } from './FilterSidebar.tsx';
import { SearchInput } from './SearchInput.tsx';
import { SortControls } from './SortControls.tsx';
import { EmptyState, ErrorState, LoadingState } from './StateViews.tsx';
import { UserList } from './UserList.tsx';

const numberFormat = new Intl.NumberFormat();

export function DirectoryPage() {
  const params = useDirectoryParams();
  const { filters } = params;

  const usersQuery = useUsersQuery(filters);
  const facetsQuery = useFacetsQuery(filters);

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const selectedFacetCount = filters.hobbies.length + filters.nationalities.length;

  // Close the mobile drawer on Escape, and lock body scroll while it is open.
  useEffect(() => {
    if (!isSidebarOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSidebarOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isSidebarOpen]);

  const isRefreshing =
    (usersQuery.isFetching && !usersQuery.isFetchingNextPage) || facetsQuery.isFetching;

  return (
    <div className="flex h-full flex-col overflow-x-hidden bg-canvas">
      {/* ---------------------------------------------------------------- header */}
      <header className="relative z-20 shrink-0 border-b border-border bg-surface">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-3 px-3 py-3 sm:px-4 lg:flex-row lg:items-center lg:gap-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-fg">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-4.5">
                <circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" />
                <path d="M3.5 19a5.5 5.5 0 0 1 11 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M16 6.2a3 3 0 0 1 0 5.6M17.5 19a5.6 5.6 0 0 0-2-4.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
            <h1 className="text-base font-semibold whitespace-nowrap text-text">People Directory</h1>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <SearchInput value={filters.q} onChange={params.setQuery} />

            <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="relative flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-border
                         bg-surface px-3 text-sm font-medium text-text transition-colors hover:bg-surface-muted lg:hidden"
              aria-label="Open filters"
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-4">
                <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              Filters
              {selectedFacetCount > 0 && (
                <span className="ml-0.5 rounded-full bg-accent px-1.5 text-[0.6875rem] leading-5 font-semibold text-accent-fg">
                  {selectedFacetCount}
                </span>
              )}
            </button>

            <SortControls
              sort={filters.sort}
              order={filters.order}
              onSortChange={params.setSort}
              onOrderChange={params.setOrder}
            />
            </div>
          </div>
        </div>

        {/* Indeterminate bar: the previous results stay on screen while a new
            filter loads, so this is the signal that something is in flight. */}
        <div className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden" aria-hidden="true">
          {isRefreshing && <div className="h-full w-1/3 animate-[slide_1.1s_ease-in-out_infinite] bg-accent" />}
        </div>
      </header>

      {/* ------------------------------------------------------------------ body */}
      <div className="mx-auto flex w-full max-w-[1600px] min-h-0 flex-1">
        <aside className="hidden w-72 shrink-0 border-r border-border lg:block xl:w-80">
          <FilterSidebar
            facets={facetsQuery.data}
            isLoading={facetsQuery.isPending}
            isError={facetsQuery.isError}
            onRetry={() => void facetsQuery.refetch()}
            params={params}
          />
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center justify-between gap-3 px-3 pt-3 pb-2 sm:px-4">
            <p className="text-sm text-text-muted" aria-live="polite">
              {usersQuery.isPending ? (
                'Loading…'
              ) : (
                <>
                  <span className="font-semibold text-text">{numberFormat.format(usersQuery.total)}</span>{' '}
                  {usersQuery.total === 1 ? 'person' : 'people'}
                </>
              )}
            </p>
          </div>

          <ActiveFilters params={params} />

          <div className="min-h-0 flex-1">
            {usersQuery.isError ? (
              <ErrorState error={usersQuery.error} onRetry={() => void usersQuery.refetch()} />
            ) : usersQuery.isPending ? (
              <LoadingState />
            ) : usersQuery.users.length === 0 ? (
              <EmptyState hasFilters={params.hasActiveFilters} onClear={params.clearAll} />
            ) : (
              <UserList
                users={usersQuery.users}
                hasNextPage={usersQuery.hasNextPage}
                isFetchingNextPage={usersQuery.isFetchingNextPage}
                fetchNextPage={() => void usersQuery.fetchNextPage()}
              />
            )}
          </div>
        </main>
      </div>

      {/* -------------------------------------------------------- mobile drawer */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setSidebarOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            className="absolute inset-y-0 right-0 flex w-[min(20rem,85vw)] flex-col border-l border-border bg-surface shadow-pop"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
              <span className="text-sm font-semibold text-text">Filters</span>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close filters"
                className="flex size-8 items-center justify-center rounded-lg text-text-muted hover:bg-surface-muted"
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-4">
                  <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <FilterSidebar
                facets={facetsQuery.data}
                isLoading={facetsQuery.isPending}
                isError={facetsQuery.isError}
                onRetry={() => void facetsQuery.refetch()}
                params={params}
              />
            </div>
            <div className="shrink-0 border-t border-border p-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-accent-fg"
              >
                Show {numberFormat.format(usersQuery.total)} results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
