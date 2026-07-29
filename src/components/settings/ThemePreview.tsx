import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, RotateCcw } from 'lucide-react';
import type { ThemeTokens } from '../../types/theme';
import { DEFAULT_THEME_TOKENS } from '../../types/theme';
import { PREVIEW_HTML } from './previewTemplate';
import Button from '../common/Button';
import './ThemePreview.css';

type PreviewView = 'checkout' | 'dashboard' | 'receipt';

interface ThemePreviewProps {
  tokens: ThemeTokens;
  onChange: (tokens: ThemeTokens) => void;
}

const TOKEN_FIELDS: { key: keyof ThemeTokens; label: string; type: 'color' | 'text' }[] = [
  { key: 'primaryColor', label: 'Primary', type: 'color' },
  { key: 'secondaryColor', label: 'Secondary', type: 'color' },
  { key: 'backgroundColor', label: 'Background', type: 'color' },
  { key: 'surfaceColor', label: 'Surface', type: 'color' },
  { key: 'textColor', label: 'Text', type: 'color' },
  { key: 'mutedTextColor', label: 'Muted Text', type: 'color' },
  { key: 'accentColor', label: 'Accent', type: 'color' },
  { key: 'successColor', label: 'Success', type: 'color' },
  { key: 'dangerColor', label: 'Danger', type: 'color' },
  { key: 'borderColor', label: 'Border', type: 'color' },
  { key: 'inputBg', label: 'Input BG', type: 'color' },
  { key: 'cardBg', label: 'Card BG', type: 'color' },
  { key: 'fontFamily', label: 'Body Font', type: 'text' },
  { key: 'headingFontFamily', label: 'Heading Font', type: 'text' },
  { key: 'borderRadius', label: 'Border Radius', type: 'text' },
];

const VIEW_LABELS: Record<PreviewView, string> = {
  checkout: 'Checkout',
  dashboard: 'Dashboard',
  receipt: 'Receipt',
};

function createPreviewBlob(): string {
  return URL.createObjectURL(new Blob([PREVIEW_HTML], { type: 'text/html' }));
}

export default function ThemePreview({ tokens, onChange }: ThemePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(() => createPreviewBlob());
  const [activeView, setActiveView] = useState<PreviewView>('checkout');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const postToIframe = useCallback((data: unknown) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(data, '*');
    }
  }, []);

  const handleMessage = useCallback((event: MessageEvent) => {
    if (event.data?.type === 'preview-ready') {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  useEffect(() => {
    if (ready) {
      postToIframe({ type: 'theme-tokens', tokens });
    }
  }, [ready, tokens, postToIframe]);

  useEffect(() => {
    if (ready) {
      postToIframe({ type: 'switch-view', view: activeView });
    }
  }, [ready, activeView, postToIframe]);

  const handleTokenChange = useCallback(
    (key: keyof ThemeTokens, value: string) => {
      onChange({ ...tokens, [key]: value });
    },
    [tokens, onChange],
  );

  const handleReset = useCallback(() => {
    onChange(DEFAULT_THEME_TOKENS);
  }, [onChange]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([JSON.stringify(tokens, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'theme-tokens.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [tokens]);

  const handleRefreshPreview = useCallback(() => {
    URL.revokeObjectURL(previewUrl);
    const newUrl = createPreviewBlob();
    setPreviewUrl(newUrl);
    setReady(false);
  }, [previewUrl]);

  return (
    <div className="theme-preview">
      <div className="theme-preview__layout">
        <div className="theme-preview__editor">
          <div className="theme-preview__editor-header">
            <h3 className="theme-preview__editor-title">Theme Tokens</h3>
            <div className="theme-preview__editor-actions">
              <Button variant="ghost" onClick={handleReset} leftIcon={<RotateCcw size={14} />}>
                Reset
              </Button>
              <Button variant="outline" onClick={handleDownload} leftIcon={<Download size={14} />}>
                Download
              </Button>
            </div>
          </div>

          <div className="theme-preview__fields">
            {TOKEN_FIELDS.map((field) => (
              <div key={field.key} className="theme-preview__field">
                <label className="theme-preview__field-label">{field.label}</label>
                {field.type === 'color' ? (
                  <div className="theme-preview__color-input-wrap">
                    <input
                      type="color"
                      className="theme-preview__color-swatch"
                      value={tokens[field.key]}
                      onChange={(e) => handleTokenChange(field.key, e.target.value)}
                      aria-label={field.label}
                    />
                    <input
                      type="text"
                      className="theme-preview__text-input"
                      value={tokens[field.key]}
                      onChange={(e) => handleTokenChange(field.key, e.target.value)}
                      aria-label={`${field.label} value`}
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    className="theme-preview__text-input"
                    value={tokens[field.key]}
                    onChange={(e) => handleTokenChange(field.key, e.target.value)}
                    aria-label={field.label}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="theme-preview__viewport">
          <div className="theme-preview__viewport-header">
            <div className="theme-preview__view-tabs" role="tablist">
              {(Object.keys(VIEW_LABELS) as PreviewView[]).map((view) => (
                <button
                  key={view}
                  type="button"
                  role="tab"
                  aria-selected={activeView === view}
                  className={`theme-preview__view-tab${activeView === view ? ' theme-preview__view-tab--active' : ''}`}
                  onClick={() => setActiveView(view)}
                >
                  {VIEW_LABELS[view]}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="theme-preview__refresh-btn"
              onClick={handleRefreshPreview}
              aria-label="Refresh preview"
              title="Refresh preview"
            >
              <RotateCcw size={14} />
            </button>
          </div>

          <div className="theme-preview__iframe-wrap">
            <iframe
              ref={iframeRef}
              src={previewUrl}
              className="theme-preview__iframe"
              title="White-label theme preview"
              sandbox="allow-scripts allow-same-origin"
              tabIndex={-1}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
