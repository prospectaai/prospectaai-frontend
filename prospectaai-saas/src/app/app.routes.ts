import { Routes } from '@angular/router';
import { LandingPageComponent } from './pages/public/landing-page/landing-page.component';
import { LoginPageComponent } from './pages/auth/login/login.component';
import { CheckoutComponent } from './pages/public/checkout/checkout.component';
import { guestGuard } from './shared/guards/guest.guard';
import { DashboardPageComponent } from './pages/saas/dashboard/dashboard.component';
import { authGuard } from './shared/guards/auth.guard';
import { ProspeccaoComponent } from './pages/saas/prospeccao/prospeccao.component';
import { ResultadosComponent } from './pages/saas/resultados/resultados.component';
import { ConfiguracoesComponent } from './pages/saas/configuracoes/configuracoes.component';
import { GerenciamentoAssinaturaComponent } from './pages/saas/gerenciamento-assinatura/gerenciamento-assinatura.component';
import { OAuthCallbackComponent } from './pages/auth/oauth-callback/oauth-callback.component';
import { SplashComponent } from './pages/auth/splash/splash.component';
import { ErrorPageComponent } from './pages/public/error/error.component';
import { NotificationsPageComponent } from './pages/saas/notifications/notifications.component';
import { ProspeccaoDetalheComponent } from './pages/saas/prospeccao-detalhe/prospeccao-detalhe.component';

export const routes: Routes = [
  // Rotas de páginas publicas do app
  { path: '', component: LandingPageComponent },
  { path: 'auth', component: LoginPageComponent, canActivate: [guestGuard] },
  { path: 'auth/callback', component: OAuthCallbackComponent },
  { path: 'auth/reset-password', loadComponent: () => import('./pages/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent) },
  { path: 'checkout', component: CheckoutComponent, canActivate: [guestGuard] },
  { path: 'splash', component: SplashComponent, canActivate: [authGuard] },
  { path: 'error', component: ErrorPageComponent },
  { path: 'saas/dashboard', component: DashboardPageComponent, canActivate: [authGuard] },
  { path: 'saas/prospect', component: ProspeccaoComponent, canActivate: [authGuard] },
  { path: 'saas/results', component: ResultadosComponent, canActivate: [authGuard] },
  { path: 'saas/result/:taskId', component: ProspeccaoDetalheComponent, canActivate: [authGuard] },
  { path: 'saas/settings', component: ConfiguracoesComponent, canActivate: [authGuard] },
  { path: 'saas/subscription', component: GerenciamentoAssinaturaComponent, canActivate: [authGuard] },
  { path: 'saas/notifications', component: NotificationsPageComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
