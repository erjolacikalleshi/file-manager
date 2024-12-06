import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

export interface User {
  id: number;
  email: string;
  password?: string;
  role?: string;
  accessToken: string;
}

export interface AuthResponse {
  accessToken: string;
  user: Pick<User, 'email' | 'id'>;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/users';
  private userSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.userSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.userSubject.next(JSON.parse(storedUser));
    }
  }

  register(user: AuthResponse): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, user).pipe(
      tap(response => {
        this.setCurrentUser(response);
      })
    );
  }  

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`http://localhost:3000/login`, { email, password });
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.userSubject.next(null);
    this.router.navigate(['/']);
  }

  public setCurrentUser(response: AuthResponse): void {
    const user: User = {
      id: response.user.id,
      email: response.user.email,
      password: '',
      role: '',
      accessToken: response.accessToken
    };
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.userSubject.next(user);
  }

  get isLoggedIn(): boolean {
    return !!this.userSubject.value;
  }

  get token(): string {
    const user = this.userSubject.value;
    return user ? user.accessToken : '';
  }
  
}
