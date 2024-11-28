import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { Router } from '@angular/router';

interface User {
  id: number;
  username: string;
  password: string;
  role: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/users';
  private currentUser: User | null = null;
  private userSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.userSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
  
  register(newUser: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, newUser);
  }

  setUser(user: User): void {
    this.currentUser = user;
    this.userSubject.next(user);
  }

  getUser(): User | null {
    return this.currentUser;
  }

  logout(): void {
    this.currentUser = null;
    sessionStorage.removeItem('role')
    this.router.navigate(['/']);
  }

  get isLoggedIn(): boolean {
    return sessionStorage.getItem('role') !== null;
  }
  
}
