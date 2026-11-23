import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly STORAGE_KEY = 'ph_dark_mode';

  // Default: Dark Mode (organic sage)
  readonly isDark = signal<boolean>(this.loadInitialTheme());

  constructor() {
    effect(() => {
      const isDark = this.isDark();
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(isDark));
      } catch {
        // ignore storage errors
      }
    });
  }

  toggleTheme(): void {
    this.isDark.update((d) => !d);
  }

  setTheme(isDark: boolean): void {
    this.isDark.set(isDark);
  }

  private loadInitialTheme(): boolean {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved !== null) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return true; // Default dark
  }
}
