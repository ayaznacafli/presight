export function UserCardSkeleton() {
  return (
    <div
      className="flex h-full animate-pulse gap-3 rounded-xl border border-border bg-surface p-3.5 sm:gap-4 sm:p-4"
      aria-hidden="true"
    >
      <div className="size-12 shrink-0 rounded-full bg-surface-muted" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="h-3.5 w-2/5 rounded bg-surface-muted" />
        <div className="h-3 w-1/3 rounded bg-surface-muted" />
        <div className="mt-auto flex gap-1.5">
          <div className="h-6 w-20 rounded-full bg-surface-muted" />
          <div className="h-6 w-16 rounded-full bg-surface-muted" />
        </div>
      </div>
    </div>
  );
}
