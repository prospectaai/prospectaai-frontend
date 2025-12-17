import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';
import { CardComponent } from '../../../components/ui/card/card.component';
import { CardHeaderComponent } from '../../../components/ui/card-header/card-header.component';
import { CardTitleComponent } from '../../../components/ui/card-title/card-title.component';
import { CardDescriptionComponent } from '../../../components/ui/card-description/card-description.component';
import { CardContentComponent } from '../../../components/ui/card-content/card-content.component';
import { ButtonComponent } from '../../../components/ui/button/button.component';
import { BadgeComponent } from '../../../components/ui/badge/badge.component';
import { SaasMainLayoutComponent } from '../../../components/layout/saas-main-layout/saas-main-layout.component';
import { ModalComponent } from '../../../components/ui/modal/modal.component';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'page-gerenciamento-assinatura',
  standalone: true,
  imports: [
    CommonModule,
    SaasMainLayoutComponent,
    CardComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardDescriptionComponent,
    CardContentComponent,
    ButtonComponent,
    BadgeComponent,
    ModalComponent,
    LucideAngularModule
  ],
  templateUrl: './gerenciamento-assinatura.component.html',
  styleUrls: ['./gerenciamento-assinatura.component.css']
})
export class GerenciamentoAssinaturaComponent implements OnInit {
  isProcessing = signal(false);
  showCancelModal = signal(false);
  
  // Dados da assinatura
  subscriptionPlan = signal<string>('');
  subscriptionPlanType = signal<'MONTHLY' | 'ANNUAL' | null>(null);
  subscriptionStatus = signal<string>('');
  subscriptionActive = signal<boolean>(false);
  renewalDate = signal<string>('');
  billingEmail = signal<string>('');
  subscriptionValue = signal<string>('');
  subscriptionStartDate = signal<string>('');
  autoBilling = signal<boolean>(true); // Sempre true pois está no cartão de crédito
  cancelAtPeriodEnd = signal<boolean>(false);

  constructor(private auth: AuthService, private router: Router) {
    this.loadSubscriptionData();
  }

  ngOnInit(): void {
    // Recarrega dados do perfil se necessário
    if (!this.subscriptionPlan()) {
      this.auth.fetchUserProfile().subscribe({
        next: (profile) => {
          this.updateSubscriptionData(profile);
        },
        error: () => {
          window.alert('Erro ao carregar dados da assinatura.');
        }
      });
    }
  }

  private loadSubscriptionData() {
    const profile = this.auth.getUserProfile();
    if (profile) {
      this.updateSubscriptionData(profile);
    }
  }

  private updateSubscriptionData(profile: any) {
    this.subscriptionPlanType.set(profile.subscriptionPlan);
    this.subscriptionPlan.set((profile.subscriptionPlan === 'ANNUAL') ? 'Plano Anual' : 'Plano Mensal');
    this.subscriptionStatus.set(profile.subscriptionActive ? 'Ativa' : 'Inativa');
    this.subscriptionActive.set(profile.subscriptionActive);
    this.renewalDate.set(this.formatDate(profile.subscriptionNextBillingDate) || '-');
    this.billingEmail.set(profile.email);
    this.subscriptionStartDate.set(this.formatDate(profile.accountCreatedAt) || '-');
    
    // Calcula valor baseado no plano (valores fictícios - serão substituídos pelo backend)
    if (profile.subscriptionPlan === 'ANNUAL') {
      this.subscriptionValue.set('R$ 999,00/ano');
    } else {
      this.subscriptionValue.set('R$ 99,00/mês');
    }
  }

  private formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      });
    } catch {
      return '-';
    }
  }

  payNextPeriod() {
    if (this.isProcessing()) return;
    
    // TODO: Implementar chamada ao backend para pagar próximo período
    this.isProcessing.set(true);
    
    // Simulação - será substituído pela chamada real ao backend
    setTimeout(() => {
      window.alert('Funcionalidade de pagamento será implementada no backend.');
      this.isProcessing.set(false);
    }, 1000);
  }

  openCancelModal() {
    this.showCancelModal.set(true);
  }

  closeCancelModal() {
    this.showCancelModal.set(false);
  }

  confirmCancel() {
    if (this.isProcessing()) return;
    
    this.isProcessing.set(true);
    
    // TODO: Implementar chamada ao backend para cancelar assinatura
    // A assinatura será desativada no próximo ciclo
    setTimeout(() => {
      this.cancelAtPeriodEnd.set(true);
      this.showCancelModal.set(false);
      window.alert('Sua assinatura será cancelada ao final do período atual. Você continuará tendo acesso até ' + this.renewalDate() + '.');
      this.isProcessing.set(false);
    }, 1000);
  }

  goBack() {
    this.router.navigate(['/saas/settings']);
  }
}

