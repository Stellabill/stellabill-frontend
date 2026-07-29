export interface ThemeTokens {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  mutedTextColor: string;
  accentColor: string;
  successColor: string;
  dangerColor: string;
  fontFamily: string;
  borderRadius: string;
  headingFontFamily: string;
  borderColor: string;
  inputBg: string;
  cardBg: string;
}

export const DEFAULT_THEME_TOKENS: ThemeTokens = {
  primaryColor: '#22d3ee',
  secondaryColor: '#14b8a6',
  backgroundColor: '#020617',
  surfaceColor: '#0a0f16',
  textColor: '#f8fafc',
  mutedTextColor: '#94a3b8',
  accentColor: '#2dd4bf',
  successColor: '#34d399',
  dangerColor: '#f87171',
  fontFamily: "'DM Sans', 'Sora', sans-serif",
  borderRadius: '0.75rem',
  headingFontFamily: "'Sora', 'DM Sans', sans-serif",
  borderColor: 'rgba(148, 163, 184, 0.16)',
  inputBg: 'rgba(148, 163, 184, 0.10)',
  cardBg: '#0a0f16',
};
