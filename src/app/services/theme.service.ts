import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly themeKey = 'theme';

  constructor() {
    const savedTheme = localStorage.getItem(this.themeKey) as 'light' | 'dark' | null;
    if (savedTheme === 'light' || savedTheme === 'dark') {
        this.applyTheme(savedTheme);
    } else {
        this.applyTheme('light');
    }
  }

  switchTheme(theme: 'light' | 'dark'): void {
    this.applyTheme(theme);
    localStorage.setItem(this.themeKey, theme);
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    const body = document.body;
    if (theme === 'dark') {
      body.classList.add('dark-theme');
      body.classList.remove('light-theme');
    } else {
      body.classList.add('light-theme');
      body.classList.remove('dark-theme');
    }
  }
  
}
