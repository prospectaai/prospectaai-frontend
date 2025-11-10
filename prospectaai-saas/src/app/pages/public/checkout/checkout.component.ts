import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'page-checkout',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    LucideAngularModule
  ],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit {
  isLoading = signal(false);
  checkoutForm!: FormGroup;
  selectedPlan = signal<'monthly' | 'annual'>('monthly');
  userId = signal<string>('');

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
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userId.set(this.route.snapshot.queryParams['userId'] || '');

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

  async handlePayment(event: Event): Promise<void> {
    event.preventDefault();
    if (this.checkoutForm.invalid) return;

    this.isLoading.set(true);

    try {
      // Simular processamento do pagamento
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('Pagamento processado com sucesso!', {
        userId: this.userId(),
        plan: this.selectedPlan(),
        amount: this.plans[this.selectedPlan()].price
      });

      // Redirecionar para o dashboard após o pagamento
      this.router.navigate(['/saas/dashboard']);
    } catch (error) {
      console.error('Erro no processamento do pagamento', error);
    } finally {
      this.isLoading.set(false);
    }
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
