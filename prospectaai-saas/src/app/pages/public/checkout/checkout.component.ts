import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../shared/services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ButtonComponent } from '../../../components/ui/button/button.component';
import { ThemeToggleComponent } from '../../../components/ui/theme-toggle/theme-toggle.component';
import { throwError } from 'rxjs';

@Component({
  selector: 'page-checkout',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    LucideAngularModule,
    ButtonComponent,
    ThemeToggleComponent
  ],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit {
  isLoading = signal(false);
  checkoutForm!: FormGroup;
  selectedPlan = signal<'monthly' | 'annual'>('monthly');
  userId = signal<string>('');
  preRegisterId = signal<string>('');
  isValidPrId = signal<boolean>(false);
  serverError = signal<boolean>(false);
  errorMessage = signal<string>('');
  isCheckingPrId = signal<boolean>(true);

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
    this.userId.set(this.route.snapshot.queryParams['userId'] || '');
    const prID = this.route.snapshot.queryParams['prID'];

    // Se foi aberto no popup, devolve o preRegisterId ao opener e fecha (apenas no browser)
    if (typeof window !== 'undefined' && window.opener && prID) {
      window.opener.postMessage({ type: 'oauth-result', preRegisterId: prID }, window.location.origin);
      window.close();
      return;
    }

    if (!prID) {
      this.isValidPrId.set(false);
      this.errorMessage.set('Nenhum identificador de pré-cadastro foi informado.');
      this.toast.error('Link inválido', 'Nenhum identificador de pré-cadastro foi informado.');
      this.isCheckingPrId.set(false);
    } else {
      this.preRegisterId.set(prID);
      this.authService.validatePreRegisterId(prID).subscribe({
        next: (isValid) => {
          this.isValidPrId.set(isValid);
          if (!isValid) {
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

  selectPlan(plan: 'monthly' | 'annual'): void {
    this.selectedPlan.set(plan);
    this.checkoutForm.patchValue({ plan: plan });
  }

  handlePayment(event: Event): void {
    event.preventDefault();
    if (this.checkoutForm.invalid || this.isLoading()) return;

    this.isLoading.set(true);

    const form = this.checkoutForm.value;
    const planEnum = this.selectedPlan() === 'monthly' ? 'MONTHLY' : 'ANNUAL';
    const payload = {
      cardNumber: form.cardNumber,
      cardName: form.cardName,
      cardExpiry: form.cardExpiry,
      cardCvv: form.cardCvv,
      plan: planEnum,
      preRegisterId: this.preRegisterId()
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
        this.router.navigate(['/splash']);
        this.isLoading.set(false);
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
