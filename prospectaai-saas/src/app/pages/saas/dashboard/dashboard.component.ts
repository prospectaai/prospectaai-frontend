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
import { SkeletonComponent } from '../../../components/ui/skeleton/skeleton.component';

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
    LucideAngularModule,
    SkeletonComponent
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
  ) {
    // Initialize signals based on service state to avoid flicker
    const cachedAnalytics = this.prospectionsService.analyticsSig();
    if (cachedAnalytics) {
      this.analytics.set(cachedAnalytics);
      this.loading.set(false);
    }
  }

  stats = signal<any[]>([]);
  private doneEffect = effect(() => {
    const doneAt = this.tasks.getLastCompletedAt();
    if (doneAt) {
      this.prospectionsService.getAnalyticsOverview().subscribe({
        next: (data) => {
          this.loading.set(false);
          this.analytics.set(data);
          this.updateStats(data);
        },
        error: () => {
          this.loading.set(false);
        }
      });
      this.prospectionsService.loadAllSummaries();
    }
  }, { allowSignalWrites: true });
  private summariesEffect = effect(() => {
    const summaries = this.prospectionsService.summariesSig();
    if (summaries && summaries.length > 0) {
      this.prospectionsService.getAnalyticsOverview().subscribe({
        next: (data) => {
          this.loading.set(false);
          this.analytics.set(data);
          this.updateStats(data);
        },
        error: () => {
          this.loading.set(false);
        }
      });
    }
  }, { allowSignalWrites: true });
  private analyticsEffect = effect(() => {
    const data = this.prospectionsService.analyticsSig();
    if (data) {
      this.loading.set(false);
      this.analytics.set(data);
      this.updateStats(data);
    }
  }, { allowSignalWrites: true });

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

  }

  loadData() {
    this.loading.set(true);
    // Load Analytics
    this.prospectionsService.getAnalyticsOverview().subscribe({
      next: (data) => {
        this.loading.set(false);
        this.analytics.set(data);
        this.updateStats(data);
      },
      error: () => {
        this.loading.set(false);
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
        value: typeof data.empresasProspectadasTotal === 'number' ? data.empresasProspectadasTotal.toLocaleString() : '-',
        change: `${data.empresasProspectadasVariationPercentMonth > 0 ? '+' : ''}${data.empresasProspectadasVariationPercentMonth}% este mês`,
        icon: 'Users',
      },
      {
        title: 'Buscas Ativas',
        value: typeof data.buscasAtivasTotal === 'number' ? data.buscasAtivasTotal.toString() : '-',
        change: `${data.buscasAgendadas} agendadas`,
        icon: 'Calendar',
      },
      {
        title: 'Cidades Alcançadas',
        value: typeof data.cidadesTotal === 'number' ? data.cidadesTotal.toString() : '-',
        change: 'Expansão geográfica',
        icon: 'MapPin',
      },
      {
        title: 'Plataforma mais usada',
        value: (data.plataformaMaisUsada || '').trim() || '-',
        change: 'Mais utilizada',
        icon: this.getPlatformIcon((data.plataformaMaisUsada || '').trim()),
        isPlatform: true,
        platformIcon: this.getPlatformIcon((data.plataformaMaisUsada || '').trim())
      },
    ]);
  }

  private getPlatformIcon(name: string): string {
    const n = (name || '').trim().toUpperCase();
    if (n === 'GOOGLE_MAPS') return 'MapPin';
    if (n === 'LINKEDIN') return 'Linkedin';
    if (n === 'INSTAGRAM') return 'Instagram';
    return 'Globe';
  }
  get recentSearchesList() {
    const arr = this.prospectionsService.summariesSig();
    const filtered = arr
      .filter(s => s.status === 'PROCESSED' && (s.resultsCount || 0) > 0)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return filtered.slice(0, 3);
  }
  get recentSearchesHasMore() {
    const arr = this.prospectionsService.summariesSig();
    const count = arr.filter(s => s.status === 'PROCESSED' && (s.resultsCount || 0) > 0).length;
    return count > 3;
  }
}
