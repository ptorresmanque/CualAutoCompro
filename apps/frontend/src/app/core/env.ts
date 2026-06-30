export const ENV = {
  apiBase:
    (typeof window !== 'undefined' &&
      (window as { __env?: { apiBase?: string } }).__env?.apiBase) ||
    'http://localhost:3000/api/v1',
} as const;
