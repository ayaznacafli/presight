import { useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { User } from '@/lib/api/types.ts';
import { UserCard } from './UserCard.tsx';
import { UserCardSkeleton } from './UserCardSkeleton.tsx';
import { useResponsiveColumns } from '../hooks/useResponsiveColumns.ts';

/** Cards are uniform, so a fixed row size keeps the virtualiser exact. */
const ROW_HEIGHT = 128;
const GAP = 12;

interface UserListProps {
  users: User[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}

export function UserList({ users, hasNextPage, isFetchingNextPage, fetchNextPage }: UserListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const columns = useResponsiveColumns(scrollRef);

  // One skeleton row per lane while the next page is in flight, so the grid
  // keeps its shape and the scrollbar does not jump.
  const placeholderCount = hasNextPage ? columns : 0;
  const itemCount = users.length + placeholderCount;

  const virtualizer = useVirtualizer({
    count: itemCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 6,
    lanes: columns,
  });

  const virtualItems = virtualizer.getVirtualItems();

  useEffect(() => {
    const last = virtualItems.at(-1);
    if (!last || !hasNextPage || isFetchingNextPage) return;
    // Start loading a page ahead of the viewport edge so scrolling stays smooth.
    if (last.index >= users.length - columns * 2) fetchNextPage();
  }, [virtualItems, hasNextPage, isFetchingNextPage, users.length, columns, fetchNextPage]);

  return (
    <div
      ref={scrollRef}
      className="scrollbar-slim h-full overflow-y-auto overscroll-contain px-3 pb-6 sm:px-4"
      style={{ contain: 'strict' }}
    >
      <div className="relative w-full" style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualItems.map((virtualRow) => {
          const user = users[virtualRow.index];
          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              className="absolute top-0"
              style={{
                left: `${(virtualRow.lane / columns) * 100}%`,
                width: `${100 / columns}%`,
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
                padding: `0 ${GAP / 2}px ${GAP}px`,
              }}
            >
              {user ? <UserCard user={user} /> : <UserCardSkeleton />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
