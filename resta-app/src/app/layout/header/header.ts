import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';
import { LayoutService } from '../../services/layout.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class TopHeader {
  readonly themeService = inject(ThemeService);
  readonly auth = inject(AuthService);
  readonly layout = inject(LayoutService);
  readonly themes = this.themeService.getThemes();
  readonly pickerOpen = signal(false);
  readonly isFullscreen = signal(false);

  togglePicker(): void {
    this.pickerOpen.update(v => !v);
  }

  selectTheme(key: string): void {
    this.themeService.applyTheme(key);
    this.pickerOpen.set(false);
  }

  toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      this.isFullscreen.set(true);
    } else {
      document.exitFullscreen?.();
      this.isFullscreen.set(false);
    }
  }

  logout(): void {
    this.auth.logout();
  }
}
