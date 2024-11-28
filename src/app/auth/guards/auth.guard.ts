import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../service/auth.service';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    if (this.authService.isLoggedIn) {
      const allowedRoles = route.data['roles'];
      const role = sessionStorage.getItem('role');
      if (allowedRoles && allowedRoles.length > 0) {
        // user has the required role
        if (allowedRoles.includes(role)) {
          return true;
        } else {
          // user does not have the required role
          this.router.navigate(['not-authorize']);
          return false;
        }
      } else {
        // no roles are required
        return true;
      }
    } else {
      // user is not logged in
      this.router.navigate(['/']);
      return false;
    }
  
  }
}
