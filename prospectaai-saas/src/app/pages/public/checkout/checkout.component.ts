import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../shared/services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ButtonComponent } from '../../../components/ui/button/button.component';
import { ThemeToggleComponent } from '../../../components/ui/theme-toggle/theme-toggle.component';
import { InputComponent } from '../../../components/ui/input/input.component';
import { LabelComponent } from '../../../components/ui/label/label.component';
import { TabsComponent } from '../../../components/ui/tabs/tabs.component';
import { TabsListComponent } from '../../../components/ui/tabs-list/tabs-list.component';
import { TabsTriggerComponent } from '../../../components/ui/tabs-trigger/tabs-trigger.component';
import { TabsContentComponent } from '../../../components/ui/tabs-content/tabs-content.component';
import { LoginRequest } from '../../../shared/dtos/login-request.dto';
import { RegisterRequest } from '../../../shared/dtos/register-request.dto';
import { throwError } from 'rxjs';
import { ConfirmationModalComponent } from '../../../components/ui/confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'page-checkout',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    LucideAngularModule,
    ButtonComponent,
    ThemeToggleComponent,
    InputComponent,
    LabelComponent,
    TabsComponent,
    TabsListComponent,
    TabsTriggerComponent,
    TabsContentComponent,
    ConfirmationModalComponent
  ],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit {
  isLoading = signal(false);
  checkoutForm!: FormGroup;
  loginForm!: FormGroup;
  signupForm!: FormGroup;
  checkoutStep = signal<'plan' | 'payment'>('plan');

  selectedPlan = signal<'monthly' | 'annual'>('monthly');
  userId = signal<string>('');
  preRegisterId = signal<string>('');
  isValidPrId = signal<boolean>(false);
  serverError = signal<boolean>(false);
  errorMessage = signal<string>('');
  isCheckingPrId = signal<boolean>(true);
  authenticatedUserLabel = signal<string>('Usuário');
  isAuthenticated = signal<boolean>(false);
  paymentSuccess = signal<boolean>(false);

  // Confirmation Modal
  showConfirmationModal = signal(false);
  confirmationEmail = signal('');
  confirmedPreRegisterId = signal<string>(''); // guarda o ID retornado na confirmação

  plans = {
    monthly: {
      name: 'Plano Mensal',
      price: 97,
      description: 'Cobrança mensal - Cancele quando quiser',
      features: [
        'Acesso completo à plataforma',
        '10.000 créditos de prospecção/mês',
        'Suporte via email',
        'Atualizações gratuitas'
      ]
    },
    annual: {
      name: 'Plano Anual',
      price: 970,
      description: 'Cobrança anual - Economize 2 meses',
      features: [
        'Acesso completo à plataforma',
        '120.000 créditos de prospecção/ano',
        'Suporte prioritário 24/7',
        'Atualizações gratuitas',
        'Relatórios avançados',
        'API de integração'
      ]
    }
  };

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    // Initialize forms
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });

    this.signupForm = this.fb.group({
      displayName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      passwordHash: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/)
        ]
      ]
    });

    this.userId.set(this.route.snapshot.queryParams['userId'] || '');
    const prID = this.route.snapshot.queryParams['prID'];
    const token = this.route.snapshot.queryParams['token'];
    const expiredAt = this.route.snapshot.queryParams['expiredAt'];

    // Se o token vier direto na URL (redirecionamento direto, não popup)
    if (token) {
      this.authService.handleOAuthCallback(token, new Date(expiredAt || ''), true);
      return;
    }

    // Se foi aberto no popup, devolve o preRegisterId ou token ao opener e fecha (apenas no browser)
    if (typeof window !== 'undefined' && window.opener) {
      if (prID) {
        window.opener.postMessage({ type: 'oauth-result', preRegisterId: prID }, window.location.origin);
        window.close();
        return;
      } else if (token) {
        window.opener.postMessage({ type: 'oauth-result', token, expiredAt }, window.location.origin);
        window.close();
        return;
      }
    }

    const isAuth = this.authService.isBrowser()
      ? !!this.authService.getToken() && !this.authService.isTokenExpired()
      : false;
    this.isAuthenticated.set(isAuth);

    if (!prID) {
      if (isAuth) {
        const profile = this.authService.getUserProfile();
        this.isValidPrId.set(true);
        this.authenticatedUserLabel.set(profile?.displayName || profile?.email || 'Usuário');
      } else {
        this.isValidPrId.set(false);
      }
      this.isCheckingPrId.set(false);
    } else {
      this.preRegisterId.set(prID);
      this.authService.validatePreRegisterId(prID).subscribe({
        next: (isValid) => {
          this.isValidPrId.set(isValid);
          if (isValid) {
            this.confirmedPreRegisterId.set(prID);
          } else {
            this.errorMessage.set('O link de confirmação é inválido ou expirado.');
            this.toast.error('Link inválido', 'O link de confirmação é inválido ou expirado.');
          }
          this.isCheckingPrId.set(false);
        },
        error: (err) => {
          console.error('Erro ao validar preRegisterId', err);
          this.serverError.set(true);
          this.errorMessage.set('Não foi possível conectar ao servidor. Tente novamente mais tarde.');
          this.toast.error('Falha de conexão', 'Não foi possível conectar ao servidor. Tente novamente mais tarde.');
          this.isCheckingPrId.set(false);
        }
      });
    }

    this.checkoutForm = this.fb.group({
      cardNumber: ['', [Validators.required, Validators.pattern(/^\d{16}$/)]],
      cardName: ['', [Validators.required]],
      cardExpiry: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]],
      cardCvv: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
      plan: [this.selectedPlan(), [Validators.required]]
    });
  }

  handleLogin(event: Event) {
    event.preventDefault();
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.toast.error('Dados inválidos', 'Por favor, verifique os campos e tente novamente.');
      return;
    }

    this.isLoading.set(true);
    const request: LoginRequest = this.loginForm.value;

    this.authService.login(request).subscribe({
      next: () => {
        // Logged in successfully, now enable checkout
        this.isLoading.set(false);
        this.isValidPrId.set(true);
        this.isAuthenticated.set(true);
        this.authenticatedUserLabel.set(request.email);
        this.toast.success('Bem-vindo de volta', 'Complete sua assinatura.');
      },
      error: (err) => {
        this.isLoading.set(false);
        this.toast.error('Erro no login', 'Verifique suas credenciais.');
      }
    });
  }

  handleSignup(event: Event) {
    event.preventDefault();
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      this.toast.error(
        'Dados inválidos',
        'A senha deve ter no mínimo 8 caracteres, com 1 letra maiúscula, 1 número e 1 caractere especial.'
      );
      return;
    }

    this.isLoading.set(true);
    const request: RegisterRequest = this.signupForm.value;

    this.authService.register(request).subscribe({
      next: (resp) => {
        this.isLoading.set(false);
        this.preRegisterId.set(resp.preRegisterId);
        this.confirmationEmail.set(request.email);
        this.showConfirmationModal.set(true);
        // Não valida ainda, espera confirmação do código
        // this.isValidPrId.set(true);
        // this.authenticatedUserLabel.set(request.displayName);
        // this.toast.success('Conta criada', 'Agora você pode finalizar sua assinatura.');
      },
      error: (err) => {
        this.isLoading.set(false);
        this.toast.error('Erro no cadastro', 'Tente novamente.');
      }
    });
  }

  loginWithGoogle(): void {
    this.handleGoogleReservation();
  }

  handleConfirmCode(code: string) {
    const preRegisterId = this.preRegisterId();

    this.authService.confirmCode({ code, preRegisterId }).subscribe({
      next: (response) => {
        this.confirmedPreRegisterId.set(response.preRegisterId); // guarda para o pagamento
        this.showConfirmationModal.set(false);
        this.toast.success('Sucesso!', 'Conta verificada com sucesso! Checkout liberado.');

        this.isValidPrId.set(true);
        this.isAuthenticated.set(true);
        this.authenticatedUserLabel.set(this.signupForm.value.displayName || 'Usuário');
        this.checkoutStep.set('payment');
      },
      error: (error) => {
        this.toast.error('Erro', error.error?.message || 'Código inválido ou expirado.');
      }
    });
  }

  handleResendCode() {
    const preRegisterId = this.preRegisterId();
    if (!preRegisterId) return;

    this.authService.resendCode({ preRegisterId }).subscribe({
      next: () => {
        this.toast.success('Código reenviado!', 'Verifique seu e-mail.');
      },
      error: (error) => {
        this.toast.error('Erro', error.error?.message || 'Erro ao reenviar código.');
      }
    });
  }

  handleCloseConfirmationModal() {
    console.log('[DEBUG] handleCloseConfirmationModal chamado');
    this.showConfirmationModal.set(false);
    this.isLoading.set(false);
  }

  handleGoogleReservation() {
    if (typeof document === 'undefined') return;

    this.isLoading.set(true);

    // 1. Set cookie
    document.cookie = "prospecta_oauth_context=checkout_reservation; path=/; max-age=300";

    // 2. Open popup
    const width = 500;
    const height = 600;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    const apiUrl = this.authService.getApiUrl();

    const popup = window.open(
      `${apiUrl}/api/v1/auth/oauth2/authorization/google`,
      'google_oauth_popup',
      `width=${width},height=${height},top=${top},left=${left}`
    );

    // 3. Poll popup and Listen for Message
    const messageHandler = (event: MessageEvent) => {
       if (event.origin !== window.location.origin) return;
       if (event.data && event.data.type === 'oauth-result') {
         // Caso 1: Novo usuário (reserva)
         if (event.data.preRegisterId) {
           this.preRegisterId.set(event.data.preRegisterId);
           this.confirmedPreRegisterId.set(event.data.preRegisterId);
           this.isValidPrId.set(true);
           this.isAuthenticated.set(true);
           this.authenticatedUserLabel.set('via Google');
           if (popup) popup.close();
           this.isLoading.set(false);
           this.toast.success('Sucesso', 'Login realizado com sucesso.');
           window.removeEventListener('message', messageHandler);
         }
         // Caso 2: Usuário já existente (login direto)
          else if (event.data.token) {
            this.authService.handleOAuthCallback(event.data.token, event.data.expiredAt || '', false);
            if (popup) popup.close();
            this.isLoading.set(false);
            this.toast.success('Bem-vindo de volta', 'Redirecionando para o painel...');
            window.removeEventListener('message', messageHandler);
            this.router.navigate(['/splash']);
          }
       }
    };

    window.addEventListener('message', messageHandler);

    if (popup) {
        const timer = setInterval(() => {
            if (popup.closed) {
                clearInterval(timer);
                this.isLoading.set(false);
                window.removeEventListener('message', messageHandler);
                return;
            }
            try {
                // Try to read content (will fail if cross-origin until it's same-origin)
                const text = popup.document.body.innerText;
                if (text) {
                    try {
                        const json = JSON.parse(text);
                        if (json.preRegisterId) {
                                  this.preRegisterId.set(json.preRegisterId);
                                  this.confirmedPreRegisterId.set(json.preRegisterId);
                                  this.isValidPrId.set(true);
                                  this.isAuthenticated.set(true);
                                  this.authenticatedUserLabel.set('via Google');
                                  popup.close();
                                clearInterval(timer);
                                this.isLoading.set(false);
                                this.toast.success('Sucesso', 'Login realizado com sucesso.');
                                window.removeEventListener('message', messageHandler);
                            } else if (json.token) {
                                this.authService.handleOAuthCallback(json.token, json.expiredAt || '', false);
                                popup.close();
                                clearInterval(timer);
                                this.isLoading.set(false);
                                this.toast.success('Bem-vindo de volta', 'Redirecionando para o painel...');
                                window.removeEventListener('message', messageHandler);
                                this.router.navigate(['/splash']);
                            }
                    } catch (e) {
                        // Not JSON yet
                    }
                }
            } catch (e) {
                // Cross-origin error, ignore
            }
        }, 1000);
    } else {
      this.isLoading.set(false);
    }
  }

  selectPlan(plan: 'monthly' | 'annual'): void {
    this.selectedPlan.set(plan);
    this.checkoutForm.patchValue({ plan: plan });
  }

  proceedToPayment(): void {
    this.checkoutStep.set('payment');
  }

  backToPlan(): void {
    this.checkoutStep.set('plan');
  }

  handlePayment(event: Event): void {
    event.preventDefault();
    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      this.toast.error('Dados inválidos', 'Verifique os dados do cartão.');
      return;
    }
    if (this.isLoading()) return;

    this.isLoading.set(true);

    const form = this.checkoutForm.value;
    const planEnum = this.selectedPlan() === 'monthly' ? 'MONTHLY' : 'ANNUAL';
    const payload = {
      cardNumber: form.cardNumber,
      cardName: form.cardName,
      cardExpiry: form.cardExpiry,
      cardCvv: form.cardCvv,
      plan: planEnum,
      preRegisterId: this.confirmedPreRegisterId() || this.preRegisterId() || ''
    } as const;

    // Permite simular erro proposital via query param: ?simulateError=1
    const simulateError = ['1', 'true', 'yes'].includes(
      (this.route.snapshot.queryParams['simulateError'] || '').toLowerCase()
    );

    const request$ = simulateError
      ? throwError(() => ({ error: { message: 'Simulação de erro no pagamento.' } }))
      : this.authService.checkout(payload);

    request$.subscribe({
      next: () => {
        this.toast.success('Pagamento aprovado', 'Bem-vindo! Sua conta foi ativada.');
        this.paymentSuccess.set(true);
        this.isLoading.set(false);
        setTimeout(() => {
          this.router.navigate(['/splash']);
        }, 2000); // Give user 2 seconds to see "Pagamento aceito!"
      },
      error: (err) => {
        console.error('Erro no checkout', err);
        const msg = (err?.error?.message as string) || 'Pagamento recusado ou erro de conexão.';
        this.toast.error('Pagamento recusado', msg);
        this.isLoading.set(false);
      }
    });
  }

  get currentPlan() {
    return this.plans[this.selectedPlan()];
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  }
}
