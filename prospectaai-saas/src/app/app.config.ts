import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './shared/services/auth.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { ArrowRight, ArrowLeft, BarChart3, Building2, Calendar, Check, ChevronDown, ChevronUp, Chrome, CreditCard, Download, ExternalLink, Filter, Github, Globe, Key, Lock, LucideAngularModule, Mail, MapPin, Menu, Phone, RectangleGogglesIcon, Search, Settings, Star, Target, TrendingUp, User, Users, X, Zap, AlertTriangle, Info, CheckCircle, XCircle, Package, DollarSign, Clock, Loader2, CheckCircle2, Headphones, RotateCcw, Moon, Sun } from 'lucide-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(
      withFetch(),
      withInterceptors([
        (req, next) => {
          const auth = inject(AuthService);
          const url = req.url;
          const isAuthEndpoint =
            url.includes('/api/v1/auth/') ||
            url.includes('/oauth2/authorization') ||
            url.includes('/auth/login') ||
            url.includes('/auth/register') ||
            url.includes('/auth/forgot-password') ||
            url.includes('/auth/confirm-code') ||
            url.includes('/auth/validate-pre-register-id') ||
            url.includes('/auth/checkout');

          const token = auth.getToken();
          const expired = auth.isTokenExpired();

          if (!isAuthEndpoint) {
            if (!token || expired) {
              auth.logoutExpired();
              return throwError(() => new Error('Unauthorized'));
            }
          }

          if (token && !expired) {
            req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
          }

          return next(req).pipe(
            catchError(err => {
              const status = err?.status;
              if (status === 401 || status === 403) {
                auth.logoutExpired();
              }
              return throwError(() => err);
            })
          );
        }
      ])
    ),
    importProvidersFrom(
      LucideAngularModule.pick({
        Globe, Users, Zap, Target, BarChart3, Mail, TrendingUp, Check, Star, User, Lock,
        ArrowRight, MapPin, Calendar, ChevronDown, ChevronUp, Search, Building2, Filter, Menu,
        Settings, Download, Phone, ExternalLink, Github, Chrome, CreditCard, Key, X, AlertTriangle, Info,
        ArrowLeft, CheckCircle, XCircle, Package, DollarSign, Clock, Loader2, CheckCircle2, Headphones, RotateCcw,
        Moon, Sun
      })
    )
  ]
};
