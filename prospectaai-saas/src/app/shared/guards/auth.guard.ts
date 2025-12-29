import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state): boolean | UrlTree => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Já autenticado
  if (auth.isAuthenticated()) return true;

  // Suporta token vindo por query params (ex.: backend redireciona para /saas/dashboard?token=...&expiredAt=...)
  const qp = route.queryParamMap;
  const token = qp.get('token') || qp.get('access_token') || qp.get('id_token');
  const expiredAt = qp.get('expiredAt') || '';

  if (token) {
    // Armazena token e permite acesso à rota
    auth.handleOAuthCallback(token, expiredAt || '', false);
    return true;
  }

  if (auth.isTokenExpired()) {
    try { sessionStorage.setItem('session_expired', 'true'); } catch {}
  }
  // Sem autenticação nem token na URL: enviar para /auth
  return router.createUrlTree(['/auth']);
};
