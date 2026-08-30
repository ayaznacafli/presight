import { SORT_FIELDS, type SortField, type SortOrder } from '@/lib/api/types.ts';
import { cn } from '@/lib/utils/cn.ts';

const LABELS: Record<SortField, string> = {
  first_name: 'First name',
  last_name: 'Last name',
  age: 'Age',
  nationality: 'Nationality',
};

interface SortControlsProps {
  sort: SortField;
  order: SortOrder;
  onSortChange: (sort: SortField) => void;
  onOrderChange: (order: SortOrder) => void;
}

export function SortControls({ sort, order, onSortChange, onOrderChange }: SortControlsProps) {
  const nextOrder: SortOrder = order === 'asc' ? 'desc' : 'asc';

  return (
    <div className="flex shrink-0 items-center gap-2">
      <label htmlFor="sort-field" className="sr-only">
        Sort by
      </label>
      <div className="relative">
        <select
          id="sort-field"
          value={sort}
          onChange={(event) => onSortChange(event.target.value as SortField)}
          className="h-10 appearance-none rounded-lg border border-border bg-surface pr-8 pl-3 text-sm
                     font-medium text-text focus:border-accent focus:outline-none"
        >
          {SORT_FIELDS.map((field) => (
            <option key={field} value={field}>
              {LABELS[field]}
            </option>
          ))}
        </select>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-text-subtle"
        >
          <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <button
        type="button"
        onClick={() => onOrderChange(nextOrder)}
        aria-label={`Sort ${order === 'asc' ? 'ascending' : 'descending'} — switch to ${nextOrder === 'asc' ? 'ascending' : 'descending'}`}
        title={order === 'asc' ? 'Ascending' : 'Descending'}
        className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border
                   bg-surface text-text-muted transition-colors hover:bg-surface-muted hover:text-text"
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={cn('size-4 transition-transform', order === 'desc' && 'rotate-180')}>
          <path d="M12 19V5M12 5l-5 5M12 5l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
