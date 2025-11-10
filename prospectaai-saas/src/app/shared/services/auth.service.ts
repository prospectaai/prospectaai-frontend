import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
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
  accessToken: string;
  user: any;
  message: string;
}

export interface ResendCodeRequest {
  preRegisterId: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://127.0.0.1:8080';
  private readonly TOKEN_KEY = 'access_token';
  private readonly USER_KEY = 'user_data';
  private readonly PRE_REGISTER_ID_KEY = 'preRegisterId';

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.isBrowser() ? this.hasToken() : false);
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
          this.setToken(response.accessToken);
          this.setUserData(response.user);
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

  confirmCode(request: ConfirmCodeRequest): Observable<ConfirmCodeResponse> {
    return this.http.post<ConfirmCodeResponse>(`${this.API_URL}/api/v1/auth/confirm-code`, request)
      .pipe(
        tap(response => {
          this.setToken(response.accessToken);
          this.setUserData(response.user);
          this.isAuthenticatedSubject.next(true);
          this.clearPreRegisterId();
        })
      );
  }

  resendCode(request: ResendCodeRequest): Observable<any> {
    return this.http.post(`${this.API_URL}/api/v1/auth/resend-code`, request);
  }

  oauthLogin(provider: 'google' | 'github'): void {
    if (!this.isBrowser()) return;
    window.location.href = `${this.API_URL}/api/v1/auth/oauth2/authorization/${provider}`;
  }

  handleOAuthCallback(token: string, user: any): void {
    this.setToken(token);
    this.setUserData(user);
    this.isAuthenticatedSubject.next(true);
    this.router.navigate(['/saas/dashboard']);
  }

  logout(): void {
    this.removeToken();
    this.removeUserData();
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/auth']);
  }

  getToken(): string | null {
    if (!this.isBrowser()) return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getUserData(): any {
    if (!this.isBrowser()) return null;
    const userData = localStorage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
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

  private setUserData(userData: any): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(this.USER_KEY, JSON.stringify(userData));
  }

  private removeToken(): void {
    if (!this.isBrowser()) return;
    localStorage.removeItem(this.TOKEN_KEY);
  }

  private removeUserData(): void {
    if (!this.isBrowser()) return;
    localStorage.removeItem(this.USER_KEY);
  }

  private hasToken(): boolean {
    if (!this.isBrowser()) return false;
    return !!localStorage.getItem(this.TOKEN_KEY);
  }
}
