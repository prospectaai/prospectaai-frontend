import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, map, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { LoginRequest } from '../dtos/login-request.dto';
import { LoginResponse } from '../dtos/login-response.dto';
import { RegisterRequest } from '../dtos/register-request.dto';
import { RegisterResponse } from '../dtos/register-response.dto';

export interface ConfirmCodeRequest {
  code: string;
  preRegisterId: string;
}

export interface ConfirmCodeResponse {
  preRegisterId: string;
  token: string;
  expiredAt: Date;
  message: string;
}

export interface ResendCodeRequest {
  preRegisterId: string;
}

export interface CheckoutRequest {
  cardNumber: string;
  cardName: string;
  cardExpiry: string; // MM/YY
  cardCvv: string;
  plan: 'MONTHLY' | 'ANNUAL';
  preRegisterId: string; // UUID string
}

export interface UserProfileResponse {
  email: string;
  displayName: string;
  avatarUrl: string;
  active: boolean;
  role: string;
  accountCreatedAt: string;
  subscriptionActive: boolean;
  subscriptionPlan: 'MONTHLY' | 'ANNUAL' | null;
  subscriptionNextBillingDate: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://127.0.0.1:8080';
  private readonly TOKEN_KEY = 'access_token';
  private readonly TOKEN_EXPIRED_AT_KEY = 'token_expired_at';
  private readonly PRE_REGISTER_ID_KEY = 'preRegisterId';
  private readonly USER_PROFILE_KEY = 'user_profile';

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.isBrowser() ? this.hasToken() && !this.isTokenExpired() : false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/api/v1/auth/login`, request)
      .pipe(
        tap(response => {
          this.setToken(response.token);
          this.setTokenExpiredAt(response.expiredAt);
          this.isAuthenticatedSubject.next(true);
        })
      );
  }

  register(request: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.API_URL}/api/v1/auth/register`, request)
      .pipe(
        tap(response => {
          this.setPreRegisterId(response.preRegisterId);
        })
      );
  }

  // Forgot Password flow
  forgotPassword(email: string): Promise<void> {
    return this.http.post<void>(`${this.API_URL}/api/v1/auth/forgot-password`, { email }).toPromise();
  }

  validateResetToken(token: string): Promise<boolean | undefined> {
    return this.http
      .get<{ value: boolean }>(`${this.API_URL}/api/v1/auth/reset-password/validate`, { params: { token } })
      .pipe(map(resp => resp.value))
      .toPromise();
  }

  resetPassword(token: string, newPassword: string): Promise<void> {
    return this.http.post<void>(`${this.API_URL}/api/v1/auth/reset-password`, { token, newPassword }).toPromise();
  }

  confirmCode(request: ConfirmCodeRequest): Observable<ConfirmCodeResponse> {
    return this.http.post<ConfirmCodeResponse>(`${this.API_URL}/api/v1/auth/confirm-code`, request)
      .pipe(
        tap(response => {
          this.setToken(response.token);
          this.setTokenExpiredAt(response.expiredAt);
          this.isAuthenticatedSubject.next(true);
          this.clearPreRegisterId();
        })
      );
  }

  resendCode(request: ResendCodeRequest): Observable<any> {
    return this.http.post(`${this.API_URL}/api/v1/auth/resend-code`, request);
  }

  validatePreRegisterId(preRegisterId: string): Observable<boolean> {
    return this.http.get<{ value: boolean }>(`${this.API_URL}/api/v1/auth/validate-pre-register-id`, {
      params: { preRegisterId }
    }).pipe(map(resp => resp.value));
  }

  checkout(request: CheckoutRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/api/v1/auth/checkout`, request)
      .pipe(
        tap(response => {
          this.setToken(response.token);
          this.setTokenExpiredAt(response.expiredAt);
          this.isAuthenticatedSubject.next(true);
          this.clearPreRegisterId();
        })
      );
  }

  fetchUserProfile(): Observable<UserProfileResponse> {
    const token = this.getToken();
    if (!token || this.isTokenExpired()) {
      this.logout();
      return throwError(() => new Error('Unauthorized'));
    }
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.get<UserProfileResponse>(`${this.API_URL}/api/v1/users/me`, { headers })
      .pipe(
        tap(profile => this.setUserProfile(profile)),
        catchError(err => {
          if (err?.status !== 200) {
            this.logout();
          }
          return throwError(() => err);
        })
      );
  }

  oauthLogin(provider: 'google' | 'github'): void {
    if (!this.isBrowser()) return;
    const callback = `${this.API_URL}/api/v1/auth/login/oauth2/code/${provider}`;
    window.location.href = `${this.API_URL}/api/v1/auth/oauth2/authorization/${provider}?redirect_uri=${encodeURIComponent(callback)}`;
  }


  // Redireciona a aba atual (mais simples)
  oauthLoginRedirect(provider: 'google' | 'github'): void {
    if (!this.isBrowser()) return;
    const callback = `${this.API_URL}/api/v1/auth/login/oauth2/code/${provider}`;
    window.location.href = `${this.API_URL}/api/v1/auth/oauth2/authorization/${provider}?redirect_uri=${encodeURIComponent(callback)}`;
  }

  // Abre popup e aguarda resultado via postMessage
  oauthLoginPopup(provider: 'google' | 'github'): Promise<{ preRegisterId?: string; token?: string; expiredAt?: string }> {
    if (!this.isBrowser()) return Promise.reject('Not a browser');

    const width = 600;
    const height = 700;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    const features = `width=${width},height=${height},left=${left},top=${top},resizable=no,scrollbars=yes`;

    const callback = `${this.API_URL}/api/v1/auth/login/oauth2/code/${provider}`;
    const url = `${this.API_URL}/api/v1/auth/oauth2/authorization/${provider}?redirect_uri=${encodeURIComponent(callback)}`;
    const popup = window.open(url, 'oauth-login', features);

    if (!popup) return Promise.reject('Popup bloqueado pelo navegador');

    return new Promise((resolve, reject) => {
      // Ouça o retorno do checkout/dashboard
      const onMessage = (event: MessageEvent) => {
        // Opcional: valide event.origin === this.OAUTH_TARGET_ORIGIN
        const data = event.data || {};
        if (data?.type === 'oauth-result') {
          window.removeEventListener('message', onMessage);
          resolve({ preRegisterId: data.preRegisterId, token: data.token, expiredAt: data.expiredAt });
        }
      };
      window.addEventListener('message', onMessage);

      // Fallback: detectar fechamento sem mensagem
      const interval = setInterval(() => {
        if (popup.closed) {
          clearInterval(interval);
          window.removeEventListener('message', onMessage);
          reject('Popup fechado sem concluir login');
        }
      }, 500);
    });
  }

  handleOAuthCallback(token: string, expiredAt: string | Date, navigate: boolean = true): void {
    this.setToken(token);
    this.setTokenExpiredAt(expiredAt);
    this.isAuthenticatedSubject.next(true);
    if (navigate) {
      this.router.navigate(['/splash']);
    }
  }

  logout(): void {
    this.removeToken();
    this.removeTokenExpiredAt();
    this.clearUserProfile();
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/auth']);
  }

  getToken(): string | null {
    if (!this.isBrowser()) return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  private setPreRegisterId(preRegisterId: string): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(this.PRE_REGISTER_ID_KEY, preRegisterId);
  }

  getPreRegisterId(): string | null {
    if (!this.isBrowser()) return null;
    return localStorage.getItem(this.PRE_REGISTER_ID_KEY);
  }

  private clearPreRegisterId(): void {
    if (!this.isBrowser()) return;
    localStorage.removeItem(this.PRE_REGISTER_ID_KEY);
  }

  private setToken(token: string): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private setUserProfile(profile: UserProfileResponse): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(this.USER_PROFILE_KEY, JSON.stringify(profile));
  }

  getUserProfile(): UserProfileResponse | null {
    if (!this.isBrowser()) return null;
    const raw = localStorage.getItem(this.USER_PROFILE_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw) as UserProfileResponse; } catch { return null; }
  }

  private clearUserProfile(): void {
    if (!this.isBrowser()) return;
    localStorage.removeItem(this.USER_PROFILE_KEY);
  }

  private removeToken(): void {
    if (!this.isBrowser()) return;
    localStorage.removeItem(this.TOKEN_KEY);
  }

  private setTokenExpiredAt(expiredAt: string | Date): void {
    if (!this.isBrowser()) return;
    const iso = this.normalizeExpiredAt(expiredAt);
    localStorage.setItem(this.TOKEN_EXPIRED_AT_KEY, iso);
  }

  private isTokenExpired(): boolean {
    if (!this.isBrowser()) return true;
    const expiredAt = localStorage.getItem(this.TOKEN_EXPIRED_AT_KEY);
    if (!expiredAt) return true;
    const d = new Date(expiredAt);
    if (isNaN(d.getTime())) {
      // Tenta interpretar como UTC adicionando 'Z'
      const dz = new Date(expiredAt.endsWith('Z') ? expiredAt : expiredAt + 'Z');
      if (!isNaN(dz.getTime())) {
        return dz < new Date();
      }
      // Se ainda inválido, trata como expirado por segurança
      return true;
    }
    return d < new Date();
  }

  private removeTokenExpiredAt(): void {
    if (!this.isBrowser()) return;
    localStorage.removeItem(this.TOKEN_EXPIRED_AT_KEY);
  }

  private hasToken(): boolean {
    if (!this.isBrowser()) return false;
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  private getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private normalizeExpiredAt(expiredAt: string | Date): string {
    try {
      if (expiredAt instanceof Date) {
        return expiredAt.toISOString();
      }
      if (typeof expiredAt === 'string') {
        const d = new Date(expiredAt);
        if (!isNaN(d.getTime())) return d.toISOString();
        const dz = new Date(expiredAt.endsWith('Z') ? expiredAt : expiredAt + 'Z');
        if (!isNaN(dz.getTime())) return dz.toISOString();
        // Último recurso: armazenar bruto (será tratado como expirado se inválido)
        return expiredAt;
      }
      // fallback: agora
      return new Date().toISOString();
    } catch {
      return new Date().toISOString();
    }
  }
}
