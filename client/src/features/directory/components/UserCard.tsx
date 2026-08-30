import { memo } from 'react';
import { Avatar } from '@/components/ui/Avatar.tsx';
import { Chip } from '@/components/ui/Chip.tsx';
import type { User } from '@/lib/api/types.ts';

const VISIBLE_HOBBIES = 2;

/**
 * Card layout required by the brief:
 *
 *   |----------------------------------|
 *   | avatar      first_name+last_name |
 *   |             nationality      age |
 *   |                                  |
 *   |             (2 hobbies) (+n)     |
 *   |----------------------------------|
 */
export const UserCard = memo(function UserCard({ user }: { user: User }) {
  const shown = user.hobbies.slice(0, VISIBLE_HOBBIES);
  const remaining = user.hobbies.length - shown.length;

  return (
    <article
      className="flex h-full gap-3 rounded-xl border border-border bg-surface p-3.5 shadow-card
                 transition-colors hover:border-border-strong sm:gap-4 sm:p-4"
    >
      <Avatar src={user.avatar} firstName={user.first_name} lastName={user.last_name} />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="truncate text-sm font-semibold text-text sm:text-[0.9375rem]">
            {user.first_name} {user.last_name}
          </h3>
        </div>

        <div className="mt-0.5 flex items-baseline justify-between gap-3">
          <p className="truncate text-xs text-text-muted sm:text-[0.8125rem]">{user.nationality}</p>
          <p className="shrink-0 text-xs tabular-nums text-text-subtle sm:text-[0.8125rem]">
            <span className="sr-only">Age </span>
            {user.age}
          </p>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2.5">
          {shown.map((hobby) => (
            <Chip key={hobby}>{hobby}</Chip>
          ))}
          {remaining > 0 && (
            <Chip className="border-dashed" >
              <span title={user.hobbies.slice(VISIBLE_HOBBIES).join(', ')}>+{remaining}</span>
            </Chip>
          )}
          {user.hobbies.length === 0 && (
            <span className="text-xs text-text-subtle italic">No hobbies listed</span>
          )}
        </div>
      </div>
    </article>
  );
});
