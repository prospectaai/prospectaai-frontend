import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = (route, state): boolean | UrlTree | Promise<boolean | UrlTree> => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // No SSR, permite prosseguir (a validação real ocorre no browser)
  if (!auth.isBrowser()) return true;

  // Retornamos uma Promise para dar tempo de carregar o token do localStorage se necessário
  return new Promise((resolve) => {
    // Pequeno delay para garantir que o AuthService inicializou o estado do localStorage
    setTimeout(() => {
      const isAuth = auth.isAuthenticated();
      const isCheckout = route.routeConfig?.path === 'checkout';
      const hasPrId = !!route.queryParamMap.get('prID');

      // Se estiver no checkout com um prID, permite sempre (fluxo de confirmação/pagamento)
      if (isCheckout && hasPrId) {
        resolve(true);
        return;
      }

      // Se autenticado, redireciona para o dashboard
      if (isAuth) {
        resolve(router.createUrlTree(['/saas/dashboard']));
      } else {
        resolve(true);
      }
    }, 100);
  });
};
