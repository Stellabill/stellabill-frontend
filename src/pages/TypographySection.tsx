import { useState } from 'react';
import ThemePreview from '../components/settings/ThemePreview';
import type { ThemeTokens } from '../types/theme';
import { DEFAULT_THEME_TOKENS } from '../types/theme';

export default function TypographySection() {
  const [themeTokens, setThemeTokens] = useState<ThemeTokens>(DEFAULT_THEME_TOKENS);
  return (
<section className="space-y-8">
      <h2 className="border-b border-slate-800 pb-2 text-2xl font-semibold">Live Theme Preview</h2>
      <p className="text-sm text-slate-400">
        Edit theme tokens on the left and see real-time updates in the preview pane. Toggle between checkout, dashboard, and receipt views.
      </p>
      <ThemePreview tokens={themeTokens} onChange={setThemeTokens} />
    </section>
  );
}
