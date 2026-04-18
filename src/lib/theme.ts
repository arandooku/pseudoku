export type ThemeId = 'midnight' | 'sunset' | 'neon' | 'paper';

export interface Theme {
  id: ThemeId;
  label: string;
  emoji: string;
  bg: string;
  accent: string;
  accentGlow: string;
  textMuted: string;
  cellBg: string;
  cellBgPeer: string;
  cellBgSelected: string;
  danger: string;
  success: string;
  glassRgb: string;
  overlayTint: string;
  scheme: 'dark' | 'light';
}

export const THEMES: Record<ThemeId, Theme> = {
  midnight: {
    id: 'midnight',
    label: 'Midnight',
    emoji: '🌙',
    bg: 'radial-gradient(circle at 20% 10%, rgba(139,92,246,0.22), transparent 55%), radial-gradient(circle at 80% 90%, rgba(16,185,129,0.15), transparent 55%), linear-gradient(180deg, #020617 0%, #0f172a 100%)',
    accent: '#8b5cf6',
    accentGlow: '#a78bfa',
    textMuted: '#94a3b8',
    cellBg: 'rgba(15,23,42,0.7)',
    cellBgPeer: 'rgba(30,41,59,0.85)',
    cellBgSelected: 'rgba(139,92,246,0.35)',
    danger: '#ef4444',
    success: '#10b981',
    glassRgb: '15,23,42',
    overlayTint: 'rgba(2,6,23,0.8)',
    scheme: 'dark',
  },
  sunset: {
    id: 'sunset',
    label: 'Sunset',
    emoji: '🌅',
    bg: 'radial-gradient(circle at 10% 20%, rgba(251,146,60,0.3), transparent 55%), radial-gradient(circle at 90% 80%, rgba(236,72,153,0.25), transparent 55%), linear-gradient(180deg, #1c1917 0%, #292524 100%)',
    accent: '#fb923c',
    accentGlow: '#fdba74',
    textMuted: '#a8a29e',
    cellBg: 'rgba(41,37,36,0.7)',
    cellBgPeer: 'rgba(68,64,60,0.85)',
    cellBgSelected: 'rgba(251,146,60,0.4)',
    danger: '#ef4444',
    success: '#fbbf24',
    glassRgb: '41,37,36',
    overlayTint: 'rgba(28,25,23,0.85)',
    scheme: 'dark',
  },
  neon: {
    id: 'neon',
    label: 'Neon',
    emoji: '⚡',
    bg: 'radial-gradient(circle at 30% 20%, rgba(56,189,248,0.28), transparent 50%), radial-gradient(circle at 70% 80%, rgba(232,121,249,0.28), transparent 50%), linear-gradient(180deg, #030712 0%, #111827 100%)',
    accent: '#38bdf8',
    accentGlow: '#7dd3fc',
    textMuted: '#94a3b8',
    cellBg: 'rgba(17,24,39,0.75)',
    cellBgPeer: 'rgba(31,41,55,0.85)',
    cellBgSelected: 'rgba(56,189,248,0.4)',
    danger: '#f43f5e',
    success: '#34d399',
    glassRgb: '17,24,39',
    overlayTint: 'rgba(3,7,18,0.85)',
    scheme: 'dark',
  },
  paper: {
    id: 'paper',
    label: 'Paper',
    emoji: '📜',
    bg: 'radial-gradient(circle at 20% 10%, rgba(139,92,246,0.08), transparent 55%), radial-gradient(circle at 80% 90%, rgba(59,130,246,0.08), transparent 55%), linear-gradient(180deg, #fafaf9 0%, #f5f5f4 100%)',
    accent: '#6d28d9',
    accentGlow: '#8b5cf6',
    textMuted: '#57534e',
    cellBg: 'rgba(255,255,255,0.9)',
    cellBgPeer: 'rgba(231,229,228,0.9)',
    cellBgSelected: 'rgba(139,92,246,0.2)',
    danger: '#dc2626',
    success: '#16a34a',
    glassRgb: '255,255,255',
    overlayTint: 'rgba(245,245,244,0.9)',
    scheme: 'light',
  },
};

export const THEME_KEY = 'pseudoku:theme';

export function loadTheme(): ThemeId {
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v && v in THEMES) return v as ThemeId;
  } catch { /* ignore */ }
  return 'midnight';
}

export function saveTheme(id: ThemeId) {
  try { localStorage.setItem(THEME_KEY, id); } catch { /* quota */ }
}

export function applyTheme(id: ThemeId) {
  const t = THEMES[id];
  const root = document.documentElement;
  root.setAttribute('data-theme', id);
  root.style.colorScheme = t.scheme;
  const vars: Record<string, string> = {
    '--bg': t.bg,
    '--accent': t.accent,
    '--accent-glow': t.accentGlow,
    '--text-muted': t.textMuted,
    '--cell-bg': t.cellBg,
    '--cell-bg-peer': t.cellBgPeer,
    '--cell-bg-selected': t.cellBgSelected,
    '--danger-c': t.danger,
    '--success-c': t.success,
    '--glass-rgb': t.glassRgb,
    '--overlay-tint': t.overlayTint,
    '--text-color': t.scheme === 'dark' ? '#f8fafc' : '#0c0a09',
  };
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
}
