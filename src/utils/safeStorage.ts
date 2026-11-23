/**
 * Error-swallowing helpers around `localStorage`.
 *
 * Every operation is safe to call in environments where `localStorage` is
 * unavailable (SSR, restricted browser contexts, private browsing, quota
 * errors, ...). Storage failures never throw: reads fall back to the supplied
 * default and writes/removals are silently ignored.
 */

/**
 * Returns the `localStorage` instance, or `null` when it is unavailable.
 * Accessing the property itself can throw in some locked-down contexts, so the
 * lookup is guarded as well.
 */
function getStorage(): Storage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Reads and JSON-parses a value from `localStorage`.
 *
 * Returns `fallback` when:
 * - storage is unavailable,
 * - the key is missing (`null`),
 * - `getItem` throws,
 * - `JSON.parse` throws, or
 * - `validate` is supplied and rejects the parsed value.
 *
 * `validate` may be a type guard (`(value): value is T`) or a plain boolean
 * predicate (`(value) => boolean`).
 */
export function readJson<T>(
  key: string,
  fallback: T,
  validate?: (value: unknown) => boolean
): T {
  try {
    const storage = getStorage();
    if (!storage) {
      return fallback;
    }

    const raw = storage.getItem(key);
    if (raw === null) {
      return fallback;
    }

    const parsed: unknown = JSON.parse(raw);
    if (validate && !validate(parsed)) {
      return fallback;
    }

    return parsed as T;
  } catch {
    return fallback;
  }
}

/**
 * JSON-serializes `value` and writes it to `localStorage`.
 *
 * @returns `true` when the value was persisted, `false` when storage is
 * unavailable or the write throws.
 */
export function writeJson(key: string, value: unknown): boolean {
  try {
    const storage = getStorage();
    if (!storage) {
      return false;
    }

    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * Removes a key from `localStorage`.
 *
 * @returns `true` when the key was removed, `false` when storage is unavailable
 * or the removal throws.
 */
export function remove(key: string): boolean {
  try {
    const storage = getStorage();
    if (!storage) {
      return false;
    }

    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
