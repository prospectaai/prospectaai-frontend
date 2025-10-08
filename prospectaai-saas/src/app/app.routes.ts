import { Routes } from '@angular/router';
import { LandingPageComponent } from './pages/public/landing-page/landing-page.component';
import { LoginPageComponent } from './pages/auth/login/login.component';

export const routes: Routes = [
  // Rotas de páginas publicas do app
  { path: '', component: LandingPageComponent },
  { path: 'auth', component: LoginPageComponent }
  // Rotas privadas do saas
  // { path: '/saas/' }
];
