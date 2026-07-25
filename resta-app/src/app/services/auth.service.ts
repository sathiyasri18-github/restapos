import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { apiUrl } from '../core/api-config';
import { MENU_CACHE_KEY } from './menu.service';
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export interface AuthUser {
  userId: number;
  userName: string;
  displayName: string;
  email: string | null;
  roles: string[];
}

export interface AuthResponse {
  accessToken: string;
  expiresAt: string;
  user: AuthUser;
}

export interface SignUpRequest {
  userName: string;
  displayName: string;
  email: string | null;
  password: string;
  confirmPassword: string;
}

export interface SignInRequest {
  userName: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
  resetToken?: string | null;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface MessageResponse {
  message: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = apiUrl('Auth');

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  signUp(dto: SignUpRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.api}/sign-up`, dto).pipe(
      tap(res => this.persistSession(res))
    );
  }

  signIn(dto: SignInRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.api}/sign-in`, dto).pipe(
      tap(res => this.persistSession(res))
    );
  }

  forgotPassword(dto: ForgotPasswordRequest): Observable<ForgotPasswordResponse> {
    return this.http.post<ForgotPasswordResponse>(`${this.api}/forgot-password`, dto);
  }

  resetPassword(dto: ResetPasswordRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.api}/reset-password`, dto);
  }

  changePassword(dto: ChangePasswordRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.api}/change-password`, dto);
  }

  persistSession(res: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, res.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(MENU_CACHE_KEY);
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/sign-in']);
  }
}
