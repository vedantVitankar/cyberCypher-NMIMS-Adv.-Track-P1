// ============================================
// DATABASE UTILITIES
// ============================================

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get current ISO timestamp
 */
export function now(): string {
  return new Date().toISOString();
}

/**
 * Parse JSON safely, returning null on error
 */
export function parseJSON<T>(json: string | null | undefined): T | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/**
 * Stringify JSON safely
 */
export function toJSON(value: unknown): string {
  return JSON.stringify(value);
}

/**
 * Convert boolean to SQLite integer
 */
export function boolToInt(value: boolean | undefined | null): number {
  return value ? 1 : 0;
}

/**
 * Convert SQLite integer to boolean
 */
export function intToBool(value: number | undefined | null): boolean {
  return value === 1;
}

/**
 * Escape SQL LIKE wildcards
 */
export function escapeLike(value: string): string {
  return value.replace(/[%_]/g, (char) => `\\${char}`);
}
