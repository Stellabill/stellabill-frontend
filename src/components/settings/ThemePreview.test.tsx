import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ThemePreview from './ThemePreview';
import { DEFAULT_THEME_TOKENS, type ThemeTokens } from '../../types/theme';

describe('ThemePreview', () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  let createObjectURLMock: ReturnType<typeof vi.fn>;
  let revokeObjectURLMock: ReturnType<typeof vi.fn>;
  let blobCounter: number;

  beforeEach(() => {
    blobCounter = 0;
    createObjectURLMock = vi.fn(() => 'blob:http://localhost/preview-' + String(++blobCounter));
    revokeObjectURLMock = vi.fn();
    URL.createObjectURL = createObjectURLMock;
    URL.revokeObjectURL = revokeObjectURLMock;
  });

  afterEach(() => {
    cleanup();
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    vi.restoreAllMocks();
  });

  function mockIframePostMessage() {
    const iframe = screen.getByTitle('White-label theme preview') as HTMLIFrameElement;
    const postMessage = vi.fn();
    Object.defineProperty(iframe, 'contentWindow', {
      value: { postMessage },
      configurable: true,
    });
    return { iframe, postMessage };
  }

  it('creates a blob URL on mount and revokes it on unmount', () => {
    const onChange = vi.fn();
    const { unmount } = render(
      <ThemePreview tokens={DEFAULT_THEME_TOKENS} onChange={onChange} />,
    );

    expect(createObjectURLMock).toHaveBeenCalledTimes(1);
    const createdBlob = createObjectURLMock.mock.calls[0][0];
    expect(createdBlob).toBeInstanceOf(Blob);
    expect((createdBlob as Blob).type).toBe('text/html');

    const iframe = screen.getByTitle('White-label theme preview');
    expect(iframe).toHaveAttribute('src', 'blob:http://localhost/preview-1');
    expect(revokeObjectURLMock).not.toHaveBeenCalled();

    unmount();

    expect(revokeObjectURLMock).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:http://localhost/preview-1');
  });

  it('sets ready on preview-ready message and posts current tokens and active view', () => {
    const onChange = vi.fn();
    render(<ThemePreview tokens={DEFAULT_THEME_TOKENS} onChange={onChange} />);

    const { postMessage } = mockIframePostMessage();

    // Unrelated messages should not trigger token posting
    act(() => {
      window.dispatchEvent(new MessageEvent('message', { data: { type: 'unrelated' } }));
    });
    expect(postMessage).not.toHaveBeenCalled();

    // preview-ready message should mark ready and post tokens + current view
    act(() => {
      window.dispatchEvent(new MessageEvent('message', { data: { type: 'preview-ready' } }));
    });

    expect(postMessage).toHaveBeenCalledWith(
      { type: 'theme-tokens', tokens: DEFAULT_THEME_TOKENS },
      '*',
    );
    expect(postMessage).toHaveBeenCalledWith(
      { type: 'switch-view', view: 'checkout' },
      '*',
    );
  });

  it('switches activeView across all three VIEW_LABELS tabs and posts switch-view messages', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ThemePreview tokens={DEFAULT_THEME_TOKENS} onChange={onChange} />);

    const { postMessage } = mockIframePostMessage();

    const checkoutTab = screen.getByRole('tab', { name: 'Checkout' });
    const dashboardTab = screen.getByRole('tab', { name: 'Dashboard' });
    const receiptTab = screen.getByRole('tab', { name: 'Receipt' });

    expect(checkoutTab).toHaveAttribute('aria-selected', 'true');
    expect(dashboardTab).toHaveAttribute('aria-selected', 'false');
    expect(receiptTab).toHaveAttribute('aria-selected', 'false');

    // Mark iframe as ready so switch-view messages are posted
    act(() => {
      window.dispatchEvent(new MessageEvent('message', { data: { type: 'preview-ready' } }));
    });
    postMessage.mockClear();

    await user.click(dashboardTab);
    expect(dashboardTab).toHaveAttribute('aria-selected', 'true');
    expect(checkoutTab).toHaveAttribute('aria-selected', 'false');
    expect(postMessage).toHaveBeenCalledWith({ type: 'switch-view', view: 'dashboard' }, '*');

    await user.click(receiptTab);
    expect(receiptTab).toHaveAttribute('aria-selected', 'true');
    expect(dashboardTab).toHaveAttribute('aria-selected', 'false');
    expect(postMessage).toHaveBeenCalledWith({ type: 'switch-view', view: 'receipt' }, '*');

    await user.click(checkoutTab);
    expect(checkoutTab).toHaveAttribute('aria-selected', 'true');
    expect(receiptTab).toHaveAttribute('aria-selected', 'false');
    expect(postMessage).toHaveBeenCalledWith({ type: 'switch-view', view: 'checkout' }, '*');
  });

  it('calls onChange with updated ThemeTokens when editing a TOKEN_FIELDS input', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const tokens: ThemeTokens = { ...DEFAULT_THEME_TOKENS };

    render(<ThemePreview tokens={tokens} onChange={onChange} />);

    // Edit a text field (Border Radius)
    const borderRadiusInput = screen.getByLabelText('Border Radius');
    await user.type(borderRadiusInput, '!');

    expect(onChange).toHaveBeenCalledWith({
      ...tokens,
      borderRadius: tokens.borderRadius + '!',
    });

    onChange.mockClear();

    // Edit a color field's swatch input (Primary)
    const primaryColorInput = screen.getByLabelText('Primary');
    fireEvent.change(primaryColorInput, { target: { value: '#ff0000' } });

    expect(onChange).toHaveBeenCalledWith({
      ...tokens,
      primaryColor: '#ff0000',
    });

    onChange.mockClear();

    // Edit a color field's text input (Primary value)
    const primaryValueInput = screen.getByLabelText('Primary value');
    fireEvent.change(primaryValueInput, { target: { value: '#00ff00' } });

    expect(onChange).toHaveBeenCalledWith({
      ...tokens,
      primaryColor: '#00ff00',
    });
  });

  it('resets tokens to DEFAULT_THEME_TOKENS when Reset is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const customTokens: ThemeTokens = {
      ...DEFAULT_THEME_TOKENS,
      primaryColor: '#123456',
    };

    render(<ThemePreview tokens={customTokens} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /reset/i }));
    expect(onChange).toHaveBeenCalledWith(DEFAULT_THEME_TOKENS);
  });

  it('refreshes the preview by revoking the old blob URL and creating a new one', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<ThemePreview tokens={DEFAULT_THEME_TOKENS} onChange={onChange} />);

    const iframe = screen.getByTitle('White-label theme preview');
    expect(iframe).toHaveAttribute('src', 'blob:http://localhost/preview-1');

    await user.click(screen.getByRole('button', { name: 'Refresh preview' }));

    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:http://localhost/preview-1');
    expect(createObjectURLMock).toHaveBeenCalledTimes(2);
    expect(iframe).toHaveAttribute('src', 'blob:http://localhost/preview-2');
  });

  it('downloads tokens as a JSON file when Download is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(<ThemePreview tokens={DEFAULT_THEME_TOKENS} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /download/i }));

    expect(createObjectURLMock).toHaveBeenCalledTimes(2);
    const downloadedBlob = createObjectURLMock.mock.calls[1][0] as Blob;
    expect(downloadedBlob.type).toBe('application/json');
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:http://localhost/preview-2');
  });
});
