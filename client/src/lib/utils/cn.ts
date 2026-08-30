type ClassValue = string | number | false | null | undefined;

/** Minimal class joiner — no runtime dependency needed for this surface area. */
export function cn(...values: ClassValue[]): string {
  return values.filter((value): value is string | number => Boolean(value)).join(' ');
}
