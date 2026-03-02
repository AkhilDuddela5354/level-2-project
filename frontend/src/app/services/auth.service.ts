import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';

export interface AuthResponse {
  token: string;
  username: string;
  message: string;
}

export interface User {
  username: string;
  email: string;
  fullName: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USERNAME_KEY = 'username';
  private loggedIn = new BehaviorSubject<boolean>(this.hasToken());
  
  isLoggedIn$ = this.loggedIn.asObservable();

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/login', { username, password })
      .pipe(
        tap(response => {
          this.setToken(response.token);
          this.setUsername(response.username);
          this.loggedIn.next(true);
        })
      );
  }

  signup(username: string, password: string, email: string, fullName: string, role?: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/signup', { username, password, email, fullName, role: role || 'USER' })
      .pipe(
        tap(response => {
          this.setToken(response.token);
          this.setUsername(response.username);
          this.loggedIn.next(true);
        })
      );
  }

  logout(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post('/api/auth/logout', {}, { headers })
      .pipe(
        tap(() => {
          this.clearAuth();
        })
      );
  }

  getCurrentUser(): Observable<User> {
    const headers = this.getAuthHeaders();
    return this.http.get<User>('/api/auth/me', { headers });
  }

  getUserRole(): Observable<string> {
    return this.getCurrentUser().pipe(
      map(user => user.role)
    );
  }

  isAdmin(): Observable<boolean> {
    return this.getCurrentUser().pipe(
      map(user => user.role === 'ADMIN')
    );
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getUsername(): string | null {
    return localStorage.getItem(this.USERNAME_KEY);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private setUsername(username: string): void {
    localStorage.setItem(this.USERNAME_KEY, username);
  }

  private hasToken(): boolean {
    return !!this.getToken();
  }

  private clearAuth(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USERNAME_KEY);
    this.loggedIn.next(false);
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  isLoggedIn(): boolean {
    return this.hasToken();
  }
}
