import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils/cn.ts';

interface AvatarProps {
  src: string;
  firstName: string;
  lastName: string;
  className?: string;
}

const initials = (first: string, last: string) =>
  `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();

/**
 * Avatars are remote URLs, so a broken image is a normal condition rather than
 * an exception — fall back to initials instead of a broken-image icon.
 */
export function Avatar({ src, firstName, lastName, className }: AvatarProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

  return (
    <div
      className={cn(
        'relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full',
        'border border-border bg-surface-muted text-sm font-semibold text-text-muted select-none',
        className,
      )}
      aria-hidden="true"
    >
      {failed ? (
        initials(firstName, lastName)
      ) : (
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      )}
    </div>
  );
}
