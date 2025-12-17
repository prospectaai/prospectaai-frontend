import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ToggleButtonComponent } from '../toggle-button/toggle-button.component';

type Theme = 'light' | 'dark';

@Component({
  selector: 'ui-theme-toggle',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, ToggleButtonComponent],
  templateUrl: './theme-toggle.component.html',
  styleUrl: './theme-toggle.component.css'
})
export class ThemeToggleComponent implements OnInit {
  current = signal<Theme>('light');

  ngOnInit(): void {
    if (!this.isBrowser()) return;
    const stored = this.getStoredTheme();
    const preferred = stored ?? (this.prefersDark() ? 'dark' : 'light');
    this.applyTheme(preferred);
  }

  toggle(): void {
    const next: Theme = this.current() === 'dark' ? 'light' : 'dark';
    this.applyTheme(next);
  }

  private applyTheme(theme: Theme): void {
    this.current.set(theme);
    if (!this.isBrowser()) return;
    try {
      sessionStorage.setItem('app_theme', theme);
    } catch {}
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }

  private getStoredTheme(): Theme | null {
    try {
      const t = sessionStorage.getItem('app_theme');
      return t === 'dark' || t === 'light' ? (t as Theme) : null;
    } catch {
      return null;
    }
  }

  private prefersDark(): boolean {
    return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private isBrowser(): boolean {
    return typeof document !== 'undefined' && typeof window !== 'undefined';
  }
}
