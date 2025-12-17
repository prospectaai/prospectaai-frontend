import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = (route, state): boolean | UrlTree => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const isAuth = auth.isAuthenticated();

  // Permite acesso a /checkout mesmo autenticado SE houver prID na URL
  const isCheckout = route.routeConfig?.path === 'checkout';
  const hasPrId = !!route.queryParamMap.get('prID');
  if (isCheckout && hasPrId) return true;

  // Demais rotas de guest: bloquear se autenticado
  return !isAuth ? true : router.createUrlTree(['/']);
};