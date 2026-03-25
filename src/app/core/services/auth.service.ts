import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private userSubject = new BehaviorSubject<any>(null);
  public user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {
    const savedUser = localStorage.getItem('billing_user');
    if (savedUser) {
      this.userSubject.next(JSON.parse(savedUser));
    }
  }

  login(email: string, password: string): Observable<any> {
    const body = {
      email,
      password,
      tenantId: (environment as any).tenantId
    };

    return this.http.post<any>(`${environment.apiUrl}/auth/token`, body).pipe(
      tap(res => {
        localStorage.setItem('access_token', res.accessToken);
        localStorage.setItem('refresh_token', res.refreshToken);
        localStorage.setItem('billing_user', JSON.stringify(res.user));

        this.userSubject.next(res.user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.userSubject.next(null);
  }

  get token(): string | null {
    return localStorage.getItem('access_token');
  }

  hasRole(role: string): boolean {
    const user = this.userSubject.value;
    return user?.roles?.includes(role) || false;
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('access_token');
    return !!token;
  }

}