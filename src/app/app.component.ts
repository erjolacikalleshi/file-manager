import { Component } from '@angular/core';
import { ThemeService } from './services/theme.service';
import { NavigationEnd, Router } from '@angular/router';
import { AuthService } from './auth/service/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'file-manager';
  currentUrl: string = '';
  message = null;
  loginUrls = ['/', '/register'];

  constructor(private themeService: ThemeService,
    private router: Router,
    private authService: AuthService,
  ) {
    this.router.events.subscribe((e) => {
      if (e instanceof NavigationEnd) {
        this.currentUrl = e.url;
      }
    });
  }

  isLoggedIn() {
    if (!this.currentUrl) {
      return false;
    }
    const index = this.loginUrls.indexOf(this.currentUrl);
    if (index >= 0) {
      return true;
    } else {
      return false;
    }
  }

  logout() {
    this.authService.logout()
  }

  toggleTheme() {
    const currentTheme = localStorage.getItem('theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    this.themeService.switchTheme(newTheme);
  }
  
}
