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
import { SaasMainLayoutComponent } from '../../../components/layout/saas-main-layout/saas-main-layout.component';
import { LucideAngularModule } from 'lucide-angular';
import { ModalComponent } from '../../../components/ui/modal/modal.component';
import { ThemeToggleComponent } from '../../../components/ui/theme-toggle/theme-toggle.component';
import { NotificationsService } from '../../../shared/services/notifications.service';
import { ToggleButtonComponent } from '../../../components/ui/toggle-button/toggle-button.component';

@Component({
  selector: 'page-configuracoes',
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
    LucideAngularModule,
    ModalComponent,
    ThemeToggleComponent,
    ToggleButtonComponent
  ],
  templateUrl: './configuracoes.component.html',
  styleUrls: ['./configuracoes.component.css']
})
export class ConfiguracoesComponent implements OnInit {
  isProcessing = false;
  subscriptionPlan = signal<string>('');
  subscriptionStatus = signal<string>('');
  renewalDate = signal<string>('');
  billingEmail = signal<string>('');
  displayName = signal<string>('');
  email = signal<string>('');
  avatarUrl = signal<string>('');
  showLogoutModal = signal(false);

  constructor(private auth: AuthService, private router: Router, public notifs: NotificationsService) {
    const profile = this.auth.getUserProfile();
    if (profile) {
      this.displayName.set(profile.displayName);
      this.email.set(profile.email);
      this.avatarUrl.set(profile.avatarUrl || '');
      this.subscriptionPlan.set((profile.subscriptionPlan === 'ANNUAL') ? 'Plano Anual' : 'Plano Mensal');
      this.subscriptionStatus.set(profile.subscriptionActive ? 'Ativa' : 'Inativa');
      this.renewalDate.set(profile.subscriptionNextBillingDate || '-');
      this.billingEmail.set(profile.email);
    }
    else {
      window.alert('Erro ao carregar perfil do usuário.');
    }
  }

  ngOnInit(): void {
    if (!this.displayName() || !this.email()) {
      this.auth.fetchUserProfile().subscribe({
        next: (profile) => {
          this.displayName.set(profile.displayName);
          this.email.set(profile.email);
          this.avatarUrl.set(profile.avatarUrl || '');
          this.subscriptionPlan.set((profile.subscriptionPlan === 'ANNUAL') ? 'Plano Anual' : 'Plano Mensal');
          this.subscriptionStatus.set(profile.subscriptionActive ? 'Ativa' : 'Inativa');
          this.renewalDate.set(profile.subscriptionNextBillingDate || '-');
          this.billingEmail.set(profile.email);
        }
      });
    }
  }

  openLogoutModal() {
    this.showLogoutModal.set(true);
  }

  cancelLogout() {
    this.showLogoutModal.set(false);
  }

  async logout() {
    if (this.isProcessing) return;
    this.isProcessing = true;
    try {
      try {
        sessionStorage.setItem('logout_goodbye', 'true');
      } catch {}
      this.showLogoutModal.set(false);
      this.auth.logout();
    } finally {
      this.isProcessing = false;
    }
  }

  manageSubscription() {
    this.router.navigate(['/saas/subscription']);
  }
}
