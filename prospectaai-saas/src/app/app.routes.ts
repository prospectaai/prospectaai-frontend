import { Routes } from '@angular/router';
import { LandingPageComponent } from './pages/public/landing-page/landing-page.component';
import { LoginPageComponent } from './pages/auth/login/login.component';
import { DashboardPageComponent } from './pages/saas/dashboard/dashboard.component';
import { ProspeccaoComponent } from './pages/saas/prospeccao/prospeccao.component';

export const routes: Routes = [
  // Rotas de páginas publicas do app
  { path: '', component: LandingPageComponent },
  { path: 'auth', component: LoginPageComponent },
  {
    path: 'saas',
    children: [
      { path: 'dashboard', component: DashboardPageComponent },
      { path: 'prospect', component: ProspeccaoComponent }
    ]
  }
];
