import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'page-oauth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen flex items-center justify-center p-6 bg-background">
      <div class="rounded-lg border bg-card text-card-foreground shadow-sm p-8 w-full max-w-md">
        <div class="flex items-center gap-3 mb-4">
          <span class="inline-block w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin"></span>
          <h2 class="text-lg font-semibold">Finalizando seu login OAuth...</h2>
        </div>
        <p class="text-sm text-muted-foreground">Por favor, aguarde enquanto confirmamos suas credenciais.</p>
      </div>
    </div>
  `,
})
export class OAuthCallbackComponent implements OnInit {
  constructor(
    private auth: AuthService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Evita acessar window durante SSR
    if (!this.auth.isBrowser()) {
      return;
    }
    try {
      const url = new URL(window.location.href);

      // Suporta token via query ou fragmento
      const searchParams = url.searchParams;
      const fragmentParams = new URLSearchParams(url.hash.startsWith('#') ? url.hash.substring(1) : url.hash);

      const token = searchParams.get('token') || fragmentParams.get('token') || fragmentParams.get('access_token') || fragmentParams.get('id_token');
      const expiredAt = searchParams.get('expiredAt') || fragmentParams.get('expiredAt');

      const rawUser = searchParams.get('user') || fragmentParams.get('user');
      let userData: any = null;
      if (rawUser) {
        try {
          userData = JSON.parse(decodeURIComponent(rawUser));
        } catch {
          userData = null;
        }
      }

      if (!token) {
        this.toast.error('Erro no OAuth', 'Token não encontrado na resposta.');
        this.router.navigate(['/auth']);
        return;
      }

      // Se aberto em popup, devolve ao opener e fecha
      if (typeof window !== 'undefined' && window.opener) {
        this.auth.handleOAuthCallback(token, new Date(expiredAt || ''), false);
        window.opener.postMessage({ type: 'oauth-result', token, expiredAt }, window.location.origin);
        window.close();
        return;
      }

      // Fluxo padrão: navegar para dashboard
      this.auth.handleOAuthCallback(token, new Date(expiredAt || ''), true);
    } catch (err) {
      console.error('Erro ao processar callback OAuth', err);
      this.toast.error('Erro no OAuth', 'Não foi possível concluir o login.');
      this.router.navigate(['/auth']);
    }
  }
}
