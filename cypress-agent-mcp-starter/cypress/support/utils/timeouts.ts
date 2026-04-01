export const Timeouts = {
  SHORT: 3_000,
  MEDIUM: 5_000,
  LONG: 10_000,
  PAGE_LOAD: 15_000,
} as const;

export type TimeoutValue = (typeof Timeouts)[keyof typeof Timeouts];
