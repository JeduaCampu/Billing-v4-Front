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

    if (savedUser && savedUser !== 'undefined' && savedUser !== 'null') {
      try {
        this.userSubject.next(JSON.parse(savedUser));
      } catch (error) {
        console.error("Error al recuperar sesión:", error);
        this.logout();
      }
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
        if (!res.mfaRequired) {
          this.saveSession(res);
        }
      })
    );
  }

  verifyMfa(userId: string, token: string, tenantId: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/auth/verify-mfa`, {
      userId,
      token,
      tenantId
    }).pipe(
      tap(res => {
        this.saveSession(res);
      })
    );
  }

  private saveSession(res: any): void {
    localStorage.setItem('access_token', res.accessToken);
    localStorage.setItem('refresh_token', res.refreshToken);
    localStorage.setItem('billing_user', JSON.stringify(res.user));
    this.userSubject.next(res.user);
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('billing_user');
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

  // --- MÉTODOS 2FA ---

  get2faSetup(): Observable<{ secret: string; qrCodeUrl: string }> {
    return this.http.post<{ secret: string; qrCodeUrl: string }>(
      `${environment.apiUrl}/auth/2fa/setup`,
      {}
    );
  }

  enable2fa(token: string): Observable<any> {
    return this.http.post<any>(
      `${environment.apiUrl}/auth/2fa/enable`,
      { token }
    );
  }

  // NUEVO: Método para desactivar el 2FA
  disable2fa(): Observable<any> {
    return this.http.post<any>(
      `${environment.apiUrl}/auth/2fa/disable`,
      {}
    );
  }

  get2faStatus(): Observable<{ enabled: boolean }> {
    return this.http.get<{ enabled: boolean }>(`${environment.apiUrl}/auth/2fa/status`);
  }

  updateUserStatus(enabled: boolean): void {
    const user = this.userSubject.value;

    if (user) {
      user.two_factor_enabled = enabled ? 1 : 0;
      localStorage.setItem('billing_user', JSON.stringify(user));
      this.userSubject.next({ ...user });
    }
  }
}