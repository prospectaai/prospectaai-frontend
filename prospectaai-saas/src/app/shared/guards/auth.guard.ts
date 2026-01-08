import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const localToken = auth.getToken();
  if (localToken) {
    return auth.validateToken().pipe(
      map(valid => valid ? true : router.createUrlTree(['/auth']))
    );
  }

  const qp = route.queryParamMap;
  const token = qp.get('token') || qp.get('access_token') || qp.get('id_token');
  const expiredAt = qp.get('expiredAt') || '';

  if (token) {
    auth.handleOAuthCallback(token, expiredAt || '', false);
    return auth.validateToken().pipe(
      map(valid => valid ? true : router.createUrlTree(['/auth']))
    );
  }

  return router.createUrlTree(['/auth']);
};
