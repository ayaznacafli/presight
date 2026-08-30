import { useEffect, useState, type RefObject } from 'react';

/** Width thresholds (px) at which the virtualised grid gains another lane. */
const BREAKPOINTS: Array<{ minWidth: number; columns: number }> = [
  { minWidth: 1040, columns: 3 },
  { minWidth: 660, columns: 2 },
  { minWidth: 0, columns: 1 },
];

const columnsFor = (width: number) =>
  BREAKPOINTS.find((breakpoint) => width >= breakpoint.minWidth)?.columns ?? 1;

/**
 * Observes the scroll container rather than the viewport, so the grid reacts to
 * the sidebar opening/closing as well as to window resizes.
 */
export function useResponsiveColumns(ref: RefObject<HTMLElement | null>): number {
  const [columns, setColumns] = useState(1);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      if (entry) setColumns(columnsFor(entry.contentRect.width));
    });
    observer.observe(element);
    setColumns(columnsFor(element.clientWidth));

    return () => observer.disconnect();
  }, [ref]);

  return columns;
}
