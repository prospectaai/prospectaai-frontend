import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, effect } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';
import { SaasMainLayoutComponent } from '../../../components/layout/saas-main-layout/saas-main-layout.component';
import { ButtonComponent } from '../../../components/ui/button/button.component';
import { CardComponent } from '../../../components/ui/card/card.component';
import { CardHeaderComponent } from '../../../components/ui/card-header/card-header.component';
import { CardContentComponent } from '../../../components/ui/card-content/card-content.component';
import { CardTitleComponent } from '../../../components/ui/card-title/card-title.component';
import { CardDescriptionComponent } from '../../../components/ui/card-description/card-description.component';
import { LucideAngularModule } from 'lucide-angular';
import { ProspectionsService, ProspectionSummaryDto } from '../../../shared/services/prospections.service';
import { TasksService } from '../../../shared/services/tasks.service';
import { AnalyticsOverviewDto } from '../../../shared/dtos/analytics-overview.dto';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    RouterModule,
    SaasMainLayoutComponent,
    ButtonComponent,
    CardComponent,
    CardHeaderComponent,
    CardContentComponent,
    CardTitleComponent,
    CardDescriptionComponent,
    LucideAngularModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardPageComponent implements OnInit {
  analytics = signal<AnalyticsOverviewDto | null>(null);
  recentSearches = signal<ProspectionSummaryDto[]>([]);
  loading = signal<boolean>(true);

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private prospectionsService: ProspectionsService,
    private tasks: TasksService
  ) {}

  stats = signal<any[]>([]);

  ngOnInit(): void {
    // Se foi aberto no popup, devolve o token ao opener e fecha (apenas no browser)
    if (typeof window !== 'undefined' && window.opener) {
      const token = this.route.snapshot.queryParams['token'] || this.authService.getToken();
      const expiredAt = this.route.snapshot.queryParams['expiredAt'] || localStorage.getItem('token_expired_at') || '';

      window.opener.postMessage({ type: 'oauth-result', token, expiredAt }, window.location.origin);
      window.close();

      // salvar o token no localStorage
      if (token) {
        this.authService.handleOAuthCallback(token, new Date(expiredAt), false);
      }
      return;
    }

    this.loadData();

    effect(() => {
      const doneAt = this.tasks.getLastCompletedAt();
      if (doneAt) {
        this.prospectionsService.getAnalyticsOverview().subscribe({
          next: (data) => {
            this.analytics.set(data);
            this.updateStats(data);
          },
          error: () => {}
        });
        this.prospectionsService.loadAllSummaries();
      }
    });
  }

  loadData() {
    this.loading.set(true);
    // Load Analytics
    this.prospectionsService.getAnalyticsOverview().subscribe({
      next: (data) => {
        this.analytics.set(data);
        this.updateStats(data);
      },
      error: () => {
        // Fallback or empty state
      }
    });

    // Load Recent Searches
    this.prospectionsService.loadAllSummaries();
    // Watch for summaries updates
    // Since summaries is a signal in service, we can effect or just grab it?
    // Ideally we should use the service signal directly in template or computed
    // But for now let's just use what we have.
    // ProspectionsService exposes summariesSig.
  }

  // Computed signal for stats would be better, but let's keep it simple with update method for now
  updateStats(data: AnalyticsOverviewDto) {
    this.stats.set([
      {
        title: 'Empresas Prospectadas',
        value: data.empresasProspectadasTotal.toLocaleString(),
        change: `${data.empresasProspectadasVariationPercentMonth > 0 ? '+' : ''}${data.empresasProspectadasVariationPercentMonth}% este mês`,
        icon: 'Users',
      },
      {
        title: 'Buscas Ativas',
        value: data.buscasAtivasTotal.toString(),
        change: `${data.buscasAgendadas} agendadas`,
        icon: 'Calendar',
      },
      {
        title: 'Cidades Alcançadas',
        value: data.cidadesTotal.toString(),
        change: 'Expansão geográfica',
        icon: 'MapPin',
      },
      {
        title: 'Localizações',
        value: data.localizacoesTotal.toLocaleString(),
        change: 'Total mapeado',
        icon: 'Globe',
      },
    ]);
  }

  get recentSearchesList() {
    const arr = this.prospectionsService.summariesSig();
    const filtered = arr.filter(s => s.status === 'PROCESSED' && (s.resultsCount || 0) > 0);
    return filtered.slice(0, 5);
  }
}
