import type { ReactNode } from 'react';
import { ApiError } from '@/lib/api/client.ts';
import { UserCardSkeleton } from './UserCardSkeleton.tsx';

function Panel({ icon, title, body, action }: { icon: ReactNode; title: string; body: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center px-6 py-16">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-surface-muted text-text-subtle">
          {icon}
        </div>
        <h2 className="text-base font-semibold text-text">{title}</h2>
        <p className="mt-1.5 text-sm text-text-muted">{body}</p>
        {action && <div className="mt-5">{action}</div>}
      </div>
    </div>
  );
}

export function LoadingState({ count = 9 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-1 gap-3 px-3 pb-6 sm:px-4 min-[700px]:grid-cols-2 min-[1180px]:grid-cols-3"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading people…</span>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="h-[116px]">
          <UserCardSkeleton />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <Panel
      icon={
        <svg viewBox="0 0 24 24" fill="none" className="size-6" aria-hidden="true">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
          <path d="m20 20-3.6-3.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      }
      title="No people match these filters"
      body={
        hasFilters
          ? 'Try removing a hobby or nationality — selected hobbies must all be present on the same person.'
          : 'The directory is empty. Seed the database with `npm run db:seed`.'
      }
      action={
        hasFilters ? (
          <button
            type="button"
            onClick={onClear}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover"
          >
            Clear all filters
          </button>
        ) : undefined
      }
    />
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const isApiError = error instanceof ApiError;
  const message = isApiError ? error.message : 'Something went wrong while loading the directory.';

  return (
    <Panel
      icon={
        <svg viewBox="0 0 24 24" fill="none" className="size-6 text-danger" aria-hidden="true">
          <path d="M12 8v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="12" cy="16.5" r="1.1" fill="currentColor" />
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      }
      title={isApiError && error.status === 0 ? 'Cannot reach the server' : 'Could not load people'}
      body={
        <>
          {message}
          {isApiError && error.status > 0 && (
            <span className="mt-1 block text-xs text-text-subtle">
              {error.code} · HTTP {error.status}
            </span>
          )}
        </>
      }
      action={
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover"
        >
          Try again
        </button>
      }
    />
  );
}
