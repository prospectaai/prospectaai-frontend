import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { first } from 'rxjs/operators';
import { AuthService } from '../../../shared/services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';
import { CardComponent } from "../../../components/ui/card/card.component";
import { LucideAngularModule } from "lucide-angular";
import { CardHeaderComponent } from "../../../components/ui/card-header/card-header.component";
import { CardTitleComponent } from "../../../components/ui/card-title/card-title.component";
import { CardDescriptionComponent } from "../../../components/ui/card-description/card-description.component";
import { CardContentComponent } from "../../../components/ui/card-content/card-content.component";
import { TabsComponent } from "../../../components/ui/tabs/tabs.component";
import { TabsListComponent } from "../../../components/ui/tabs-list/tabs-list.component";
import { TabsTriggerComponent } from "../../../components/ui/tabs-trigger/tabs-trigger.component";
import { TabsContentComponent } from "../../../components/ui/tabs-content/tabs-content.component";
import { LabelComponent } from "../../../components/ui/label/label.component";
import { InputComponent } from "../../../components/ui/input/input.component";
import { ButtonComponent } from "../../../components/ui/button/button.component";
import { ConfirmationModalComponent } from "../../../components/ui/confirmation-modal/confirmation-modal.component";
import { ModalComponent } from '../../../components/ui/modal/modal.component';

@Component({
  selector: 'page-login',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    CardComponent,
    LucideAngularModule,
    CardHeaderComponent,
    CardTitleComponent,
    CardDescriptionComponent,
    CardContentComponent,
    TabsComponent,
    TabsListComponent,
    TabsTriggerComponent,
    TabsContentComponent,
    LabelComponent,
    InputComponent,
    ButtonComponent,
    ConfirmationModalComponent,
    ModalComponent
],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginPageComponent implements OnInit {
  isLoading = signal(false);
  loginForm!: FormGroup;
  signupForm!: FormGroup;
  forgotForm!: FormGroup;
  errorMessage = signal('');
  goodbyeMessage = signal('');
  showConfirmationModal = signal(false);
  confirmationEmail = signal('');
  preRegisterId = signal('');
  // Forgot Password
  showForgotPasswordModal = signal(false);
  forgotEmail = signal('');

  @ViewChild(ConfirmationModalComponent)
  confirmationModal?: ConfirmationModalComponent;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });

    this.signupForm = this.fb.group({
      displayName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      passwordHash: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Forgot password form (reactive)
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
    // Detecta retorno OAuth no próprio /auth, com token em query ou fragment (somente no browser)
    if (!this.authService.isBrowser()) {
      return;
    }
    try {
      const url = new URL(window.location.href);
      const searchParams = url.searchParams;
      const fragmentParams = new URLSearchParams(url.hash.startsWith('#') ? url.hash.substring(1) : url.hash);

      const token = searchParams.get('token') || searchParams.get('access_token') || fragmentParams.get('token') || fragmentParams.get('access_token') || fragmentParams.get('id_token');
      const expiredAt = searchParams.get('expiredAt') || fragmentParams.get('expiredAt') || '';

      if (token) {
        // Se veio pelo popup, devolve o token ao opener e fecha
        if (typeof window !== 'undefined' && window.opener) {
          this.authService.handleOAuthCallback(token, new Date(expiredAt || ''), false);
          window.opener.postMessage({ type: 'oauth-result', token, expiredAt }, window.location.origin);
          window.close();
          return;
        }

        // Fluxo normal: concluir login e ir ao dashboard
        this.authService.handleOAuthCallback(token, new Date(expiredAt || ''), true);
        return;
      }
    } catch (e) {
      // Silencia erros de parsing de URL
    }

    try {
      const flag = sessionStorage.getItem('logout_goodbye');
      if (flag === 'true') {
        this.goodbyeMessage.set('Volte sempre!');
        sessionStorage.removeItem('logout_goodbye');
      }
    } catch {}

    try {
      const expired = sessionStorage.getItem('session_expired');
      if (expired === 'true') {
        this.errorMessage.set('Sua sessão expirou. Faça login novamente.');
        sessionStorage.removeItem('session_expired');
      }
    } catch {}
  }

  async handleLogin(event: Event) {
    event.preventDefault();
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    const loginData = this.loginForm.value;

    this.authService.login(loginData)
      .pipe(first())
      .subscribe({
        next: (response) => {
          console.log('Login realizado com sucesso', response);
          this.router.navigate(['/splash']);
        },
        error: (error) => {
          console.error('Erro no login', error);
          this.errorMessage.set(error.error?.message || 'Erro ao fazer login. Verifique suas credenciais.');
          this.isLoading.set(false);
        }
      });
  }

  async handleSignup(event: Event) {
    event.preventDefault();
    if (this.signupForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    const signupData = this.signupForm.value;

    this.authService.register(signupData)
      .pipe(first())
      .subscribe({
        next: (response) => {
          console.log('Cadastro realizado com sucesso', response);
          this.confirmationEmail.set(signupData.email);
          this.preRegisterId.set(response.preRegisterId);
          this.showConfirmationModal.set(true);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Erro no cadastro', error);
          this.errorMessage.set(error.error?.message || 'Erro ao criar conta. Tente novamente.');
          this.isLoading.set(false);
        }
      });
  }

  async handleOAuthLogin(provider: 'google' | 'github'): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const result = await this.authService.oauthLoginPopup(provider);
      // Novo usuário: veio com preRegisterId → vá para checkout
      if (result.preRegisterId) {
        await this.router.navigate(['/checkout'], { queryParams: { prID: result.preRegisterId } });
        return;
      }
      // Usuário existente: veio token → vá para dashboard
      if (result.token) {
        // Salve token e expiração, depois navegue ao dashboard
        this.authService.handleOAuthCallback(result.token, result.expiredAt || '', false);
        await this.router.navigate(['/splash']);
        return;
      }
      this.errorMessage.set('Não foi possível concluir a autenticação.');
    } catch (e: any) {
      this.errorMessage.set(typeof e === 'string' ? e : 'Erro ao iniciar OAuth2');
    } finally {
      this.isLoading.set(false);
    }
  }

  handleConfirmCode(code: string) {
    const preRegisterId = this.preRegisterId();

    this.authService.confirmCode({ code, preRegisterId })
      .pipe(first())
      .subscribe({
        next: (response) => {
          console.log('Código confirmado com sucesso', response);
          this.confirmationModal?.setLoading(false);
          this.showConfirmationModal.set(false);
          this.toastService.success('Sucesso!', 'Código confirmado com sucesso!');

          // Redirecionar para o checkout após confirmação bem-sucedida
          this.router.navigate(['/checkout'], {
            queryParams: { prID: preRegisterId }
          });
        },
        error: (error) => {
          console.error('Erro ao confirmar código', error);
          this.toastService.error('Erro', error.error?.message || 'Código inválido ou expirado. Tente novamente.');
          this.confirmationModal?.setLoading(false);
        }
      });
  }

  handleResendCode() {
    const preRegisterId = this.preRegisterId() || this.authService.getPreRegisterId() || '';
    if (!preRegisterId) {
      this.toastService.warning('Atenção', 'Identificador não encontrado. Faça o cadastro novamente.');
      return;
    }

    this.authService.resendCode({ preRegisterId })
      .pipe(first())
      .subscribe({
        next: () => {
          this.toastService.success('Código reenviado!', 'Um novo código foi enviado para seu email.');
        },
        error: (error) => {
          console.error('Erro ao reenviar código', error);
          this.toastService.error('Erro', error.error?.message || 'Erro ao reenviar código. Tente novamente.');
        }
      });
  }

  handleCloseConfirmationModal() {
    this.showConfirmationModal.set(false);
    this.isLoading.set(false);
    this.confirmationModal?.setLoading(false);
  }

  openForgotPassword() {
    this.forgotForm.reset();
    this.showForgotPasswordModal.set(true);
  }

  closeForgotPassword() {
    this.showForgotPasswordModal.set(false);
  }

  async submitForgotPassword(event: Event) {
    this.isLoading.set(true);
    event.preventDefault();
    if (this.forgotForm.invalid) {
      this.toastService.warning('Atenção', 'Por favor, informe seu e-mail.');
      this.isLoading.set(false);
      return;
    }
    const email = this.forgotForm.value.email;
    try {
      await this.authService.forgotPassword(email);
      this.toastService.success('Sucesso!', 'Se o e-mail existir, enviaremos instruções de reset.');
      this.closeForgotPassword();
    } catch (err: any) {
      this.toastService.error('Erro na operação', 'Não foi possível iniciar o reset de senha.');
    }
    this.isLoading.set(false);
  }
}
