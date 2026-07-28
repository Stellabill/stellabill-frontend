import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { copyToClipboard } from './clipboard';

describe('copyToClipboard', () => {
  const originalClipboard = navigator.clipboard;
  const originalIsSecureContext = window.isSecureContext;

  afterEach(() => {
    Object.defineProperty(window, 'isSecureContext', {
      value: originalIsSecureContext,
      configurable: true,
    });
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  it('uses navigator.clipboard.writeText when available in a secure context', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true });

    const result = await copyToClipboard('hello world');

    expect(writeText).toHaveBeenCalledWith('hello world');
    expect(result).toBe(true);
  });

  it('falls back to execCommand when the Clipboard API is unavailable', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    Object.defineProperty(window, 'isSecureContext', { value: false, configurable: true });
    const execCommandSpy = vi.spyOn(document, 'execCommand').mockReturnValue(true);

    const result = await copyToClipboard('fallback text');

    expect(execCommandSpy).toHaveBeenCalledWith('copy');
    expect(result).toBe(true);
    // The temporary textarea must not leak into the DOM.
    expect(document.querySelectorAll('textarea').length).toBe(0);
  });

  it('falls back to execCommand when writeText rejects', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true });
    const execCommandSpy = vi.spyOn(document, 'execCommand').mockReturnValue(true);

    const result = await copyToClipboard('retry text');

    expect(writeText).toHaveBeenCalled();
    expect(execCommandSpy).toHaveBeenCalledWith('copy');
    expect(result).toBe(true);
  });

  it('returns false when both the Clipboard API and execCommand fail', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    Object.defineProperty(window, 'isSecureContext', { value: false, configurable: true });
    vi.spyOn(document, 'execCommand').mockImplementation(() => {
      throw new Error('not supported');
    });

    const result = await copyToClipboard('will fail');

    expect(result).toBe(false);
    expect(document.querySelectorAll('textarea').length).toBe(0);
  });
});
