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
  { path: '', component: LandingPageComponent, title: 'ProspectaAI - Prospecção Automatizada' },
  { path: 'auth', component: LoginPageComponent, canActivate: [guestGuard], title: 'ProspectaAI - Entrar' },
  { path: 'auth/callback', component: OAuthCallbackComponent, title: 'ProspectaAI - Autenticando...' },
  { path: 'auth/reset-password', loadComponent: () => import('./pages/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent), title: 'ProspectaAI - Recuperar Senha' },
  { path: 'checkout', component: CheckoutComponent, canActivate: [guestGuard], title: 'ProspectaAI - Checkout' },
  { path: 'splash', component: SplashComponent, canActivate: [authGuard], title: 'ProspectaAI - Bem-vindo' },
  { path: 'error', component: ErrorPageComponent, title: 'ProspectaAI - Erro' },
  { path: 'saas/dashboard', component: DashboardPageComponent, canActivate: [authGuard], title: 'ProspectaAI - Dashboard' },
  { path: 'saas/prospect', component: ProspeccaoComponent, canActivate: [authGuard], title: 'ProspectaAI - Nova Prospecção' },
  { path: 'saas/results', component: ResultadosComponent, canActivate: [authGuard], title: 'ProspectaAI - Meus Resultados' },
  { path: 'saas/result/:taskId', component: ProspeccaoDetalheComponent, canActivate: [authGuard], title: 'ProspectaAI - Detalhes da Prospecção' },
  { path: 'saas/settings', component: ConfiguracoesComponent, canActivate: [authGuard], title: 'ProspectaAI - Configurações' },
  { path: 'saas/subscription', component: GerenciamentoAssinaturaComponent, canActivate: [authGuard], title: 'ProspectaAI - Assinatura' },
  { path: 'saas/notifications', component: NotificationsPageComponent, canActivate: [authGuard], title: 'ProspectaAI - Notificações' },
  { path: '**', redirectTo: '' }
];
