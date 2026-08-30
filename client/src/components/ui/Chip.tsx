import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn.ts';

interface ChipProps {
  children: ReactNode;
  className?: string;
}

/** Read-only tag, used for the hobbies on a user card. */
export function Chip({ children, className }: ChipProps) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center truncate rounded-full border border-border',
        'bg-surface-muted px-2.5 py-1 text-xs font-medium text-text-muted',
        className,
      )}
    >
      {children}
    </span>
  );
}
