import { useMemo, useState } from 'react';
import type { FacetValue } from '@/lib/api/types.ts';
import { cn } from '@/lib/utils/cn.ts';

interface FacetSectionProps {
  title: string;
  hint: string;
  values: FacetValue[];
  selected: string[];
  isLoading: boolean;
  onToggle: (value: string) => void;
  /** Rendered when the facet can no longer surface anything new (see below). */
  onClearSelection?: () => void;
}

const COLLAPSED_COUNT = 8;
const numberFormat = new Intl.NumberFormat();

export function FacetSection({ title, hint, values, selected, isLoading, onToggle, onClearSelection }: FacetSectionProps) {
  const [expanded, setExpanded] = useState(false);

  /**
   * A selected value can fall out of the server's top 20 once other filters
   * narrow the set. Pinning it keeps the control that removes it on screen —
   * otherwise the filter becomes impossible to undo from the sidebar.
   */
  const rows = useMemo<FacetValue[]>(() => {
    const present = new Set(values.map((facet) => facet.value));
    const orphans = selected
      .filter((value) => !present.has(value))
      .map((value) => ({ value, count: 0 }));
    return [...orphans, ...values];
  }, [values, selected]);

  const visible = expanded ? rows : rows.slice(0, COLLAPSED_COUNT);
  const maxCount = rows[0]?.count ?? 0;

  /**
   * Counts describe the current result set (as required), so an OR-style facet
   * collapses to exactly what is selected once anything is picked — there is
   * nothing left to discover here until the selection is cleared. Say so, and
   * offer the way out, instead of leaving a dead end.
   */
  const isExhausted =
    onClearSelection !== undefined &&
    selected.length > 0 &&
    rows.length > 0 &&
    rows.every((facet) => selected.includes(facet.value));

  return (
    <section className="border-b border-border px-4 py-4 last:border-b-0">
      <div className="mb-2.5 flex items-baseline justify-between gap-2">
        <h3 className="text-xs font-semibold tracking-wide text-text uppercase">{title}</h3>
        <span className="text-[0.6875rem] text-text-subtle">{hint}</span>
      </div>

      {isLoading && rows.length === 0 ? (
        <ul className="space-y-1.5" aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => (
            <li key={index} className="h-8 animate-pulse rounded-lg bg-surface-muted" />
          ))}
        </ul>
      ) : rows.length === 0 ? (
        <p className="py-1 text-xs text-text-subtle">No values for the current filters.</p>
      ) : (
        <>
          <ul className="space-y-0.5">
            {visible.map((facet) => {
              const isSelected = selected.includes(facet.value);
              const share = maxCount > 0 ? (facet.count / maxCount) * 100 : 0;

              return (
                <li key={facet.value}>
                  <button
                    type="button"
                    onClick={() => onToggle(facet.value)}
                    aria-pressed={isSelected}
                    className={cn(
                      'group relative flex w-full items-center gap-2 overflow-hidden rounded-lg px-2 py-1.5',
                      'text-left text-[0.8125rem] transition-colors',
                      isSelected ? 'bg-accent-soft text-text' : 'text-text-muted hover:bg-surface-muted hover:text-text',
                    )}
                  >
                    {/* Count bar — makes the distribution readable at a glance. */}
                    <span
                      aria-hidden="true"
                      className={cn(
                        'absolute inset-y-0 left-0 -z-10 rounded-lg transition-[width]',
                        isSelected ? 'bg-accent/10' : 'bg-surface-muted/60 group-hover:bg-transparent',
                      )}
                      style={{ width: `${share}%` }}
                    />
                    <span
                      className={cn(
                        'flex size-4 shrink-0 items-center justify-center rounded border transition-colors',
                        isSelected ? 'border-accent bg-accent text-accent-fg' : 'border-border-strong',
                      )}
                    >
                      {isSelected && (
                        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-3">
                          <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    <span className="flex-1 truncate">{facet.value}</span>
                    <span className="shrink-0 text-xs tabular-nums text-text-subtle">
                      {numberFormat.format(facet.count)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {isExhausted && (
            <p className="mt-2 px-2 text-[0.6875rem] leading-relaxed text-text-subtle">
              Counts reflect the current results.{' '}
              <button type="button" onClick={onClearSelection} className="font-medium text-accent hover:underline">
                Clear
              </button>{' '}
              to browse all {title.toLowerCase()} again.
            </p>
          )}

          {rows.length > COLLAPSED_COUNT && (
            <button
              type="button"
              onClick={() => setExpanded((previous) => !previous)}
              className="mt-1.5 px-2 text-xs font-medium text-accent hover:underline"
            >
              {expanded ? 'Show less' : `Show all ${rows.length}`}
            </button>
          )}
        </>
      )}
    </section>
  );
}
