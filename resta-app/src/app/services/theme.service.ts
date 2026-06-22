import { Injectable, signal } from '@angular/core';

export interface AppTheme {
  name: string;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primaryMuted: string;
  sidebarBg: string;
  sidebarText: string;
  sidebarActiveBg: string;
  sidebarActiveText: string;
  headerBg: string;
  headerText: string;
  bgPage: string;
  textLabel: string;
  inputBorder: string;
}

export const THEMES: Record<string, AppTheme> = {
  salepro: {
    name: 'SalePro Light',
    primary:         '#6941c6',
    primaryDark:     '#5534a8',
    primaryLight:    '#7c3aed',
    primaryMuted:    'rgba(105, 65, 198, 0.12)',
    sidebarBg:       '#ffffff',
    sidebarText:     '#475569',
    sidebarActiveBg: '#ede9fe',
    sidebarActiveText: '#6941c6',
    headerBg:        '#ffffff',
    headerText:      '#334155',
    bgPage:          '#f4f6f9',
    textLabel:       '#6941c6',
    inputBorder:     '#e2e8f0',
  },
  navy: {
    name: 'Navy Blue',
    primary:         '#0a2472',
    primaryDark:     '#071b5a',
    primaryLight:    '#1e40af',
    primaryMuted:    'rgba(10, 36, 114, 0.14)',
    sidebarBg:       '#ffffff',
    sidebarText:     '#475569',
    sidebarActiveBg: '#dbeafe',
    sidebarActiveText: '#1d4ed8',
    headerBg:        '#ffffff',
    headerText:      '#334155',
    bgPage:          '#f0f4ff',
    textLabel:       '#1d4ed8',
    inputBorder:     '#e2e8f0',
  },
  teal: {
    name: 'Teal',
    primary:         '#0f766e',
    primaryDark:     '#0d5d57',
    primaryLight:    '#14b8a6',
    primaryMuted:    'rgba(15, 118, 110, 0.14)',
    sidebarBg:       '#ffffff',
    sidebarText:     '#475569',
    sidebarActiveBg: '#ccfbf1',
    sidebarActiveText: '#0f766e',
    headerBg:        '#ffffff',
    headerText:      '#334155',
    bgPage:          '#f0fdf4',
    textLabel:       '#0d9488',
    inputBorder:     '#e2e8f0',
  },
  slate: {
    name: 'Slate Dark',
    primary:         '#334155',
    primaryDark:     '#1e293b',
    primaryLight:    '#475569',
    primaryMuted:    'rgba(51, 65, 85, 0.14)',
    sidebarBg:       '#1e293b',
    sidebarText:     '#cbd5e1',
    sidebarActiveBg: '#334155',
    sidebarActiveText: '#ffffff',
    headerBg:        '#1e293b',
    headerText:      '#ffffff',
    bgPage:          '#f8fafc',
    textLabel:       '#475569',
    inputBorder:     '#94a3b8',
  },
};

const STORAGE_KEY = 'app-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly activeTheme = signal<string>('salepro');

  constructor() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && THEMES[saved]) {
      this.applyTheme(saved);
    } else {
      this.applyTheme('salepro');
    }
  }

  applyTheme(key: string): void {
    const theme = THEMES[key];
    if (!theme) return;

    const root = document.documentElement;
    root.style.setProperty('--color-primary',         theme.primary);
    root.style.setProperty('--color-primary-dark',    theme.primaryDark);
    root.style.setProperty('--color-primary-light',   theme.primaryLight);
    root.style.setProperty('--color-primary-muted',   theme.primaryMuted);
    root.style.setProperty('--sidebar-bg',            theme.sidebarBg);
    root.style.setProperty('--sidebar-text',          theme.sidebarText);
    root.style.setProperty('--sidebar-active-bg',     theme.sidebarActiveBg);
    root.style.setProperty('--sidebar-active-text',    theme.sidebarActiveText);
    root.style.setProperty('--header-bg',             theme.headerBg);
    root.style.setProperty('--header-text',           theme.headerText);
    root.style.setProperty('--bg-page',               theme.bgPage);
    root.style.setProperty('--text-label',            theme.textLabel);
    root.style.setProperty('--input-border',          theme.inputBorder);
    root.style.setProperty('--toolbar-bg',            theme.primary);
    root.style.setProperty('--table-header-bg',       theme.primary);

    this.activeTheme.set(key);
    localStorage.setItem(STORAGE_KEY, key);
  }

  getThemes(): { key: string; name: string }[] {
    return Object.entries(THEMES).map(([key, t]) => ({ key, name: t.name }));
  }
}
