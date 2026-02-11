import { Injectable, signal, effect } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { map, catchError, throwError } from 'rxjs';
import { AnalyticsOverviewDto } from '../dtos/analytics-overview.dto';
import { NotificationsService, NotificationItem } from './notifications.service';
import { TasksService } from './tasks.service';

export type AsyncTaskPlatform = 'GOOGLE_MAPS' | 'OTHER';
export type AsyncTaskStatus = 'PROCESSING' | 'PROCESSED';

export interface ProspectionSummaryDto {
  taskId: number;
  query: string;
  platform: AsyncTaskPlatform;
  status: AsyncTaskStatus;
  createdAt: string;
  resultsCount: number;
}

export interface ProspectionUsageDto {
  used: number;
  limit: number;
}

export interface ProspectionRecordDto {
  query: string;
  platform: string;
  nomeEmpresa: string;
  imageUrl?: string;
  telefone?: string;
  endereco?: string;
  website?: string;
  rating?: number;
  reviews?: number;
  especialidades?: string;
  createdAt: string;
}

export interface ProspectionDetailDto {
  taskId: number;
  query: string;
  platform: AsyncTaskPlatform;
  updatedAt: string;
  resultsCount: number;
  results: ProspectionRecordDto[];
}

@Injectable({
  providedIn: 'root'
})
export class ProspectionsService {
  private summaries = signal<ProspectionSummaryDto[]>([]);
  private loadingSummaries = signal<boolean>(true);
  private detailsCache = new Map<number, ProspectionDetailDto>();
  private analytics = signal<AnalyticsOverviewDto | null>(null);
  private usage = signal<ProspectionUsageDto | null>({ used: 0, limit: 0 });
  private fallbackNotified = new Set<number>();
  public summariesSig = this.summaries.asReadonly();
  public loadingSummariesSig = this.loadingSummaries.asReadonly();
  public analyticsSig = this.analytics.asReadonly();
  public usageSig = this.usage.asReadonly();

  constructor(private http: HttpClient, private auth: AuthService, private notifs: NotificationsService, private tasks: TasksService) {
    effect(() => {
      const last = this.tasks.getLastCompletedAt();
      if (last) {
        this.loadUsage();
      }
    });
  }

  loadUsage(): void {
    const url = `${this.auth.getApiUrl()}/api/v1/async/prospect/usage`;
    this.http.get<ProspectionUsageDto>(url).subscribe({
      next: (data) => this.usage.set(data),
      error: (err) => {
        console.error('Failed to load usage:', err);
      }
    });
  }

  loadAllSummaries(): void {
    if (!this.auth.isBrowser()) return;
    this.loadingSummaries.set(true);
    const token = this.auth.getToken();
    if (!token || this.auth.isTokenExpired()) {
      this.loadingSummaries.set(false);
      this.auth.logoutExpired();
      return;
    }
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const url = `${this.auth.getApiUrl()}/api/v1/async/prospect/get-all-results`;
    this.http.get<ProspectionSummaryDto[]>(url, { headers }).subscribe({
      next: (list) => {
        const arr = Array.isArray(list) ? list : [];
        this.summaries.set(arr);
        const tasksNow = this.tasks['getTasks']?.() || [];
        for (const s of arr) {
          if (s.status === 'PROCESSED' && (s.resultsCount || 0) > 0) {
            if (!this.fallbackNotified.has(s.taskId)) {
              const inPanel = tasksNow.find(t => t.id === String(s.taskId));
              if (inPanel && inPanel.status === 'PROCESSANDO') {
                const notif: NotificationItem = {
                  id: `TASK:${s.taskId}`,
                  title: 'Prospecção concluída',
                  datetime: new Date().toISOString(),
                  sentLabel: 'Agora',
                  icon: 'CheckCircle',
                  content: s.query,
                  link: `/saas/result/${s.taskId}`,
                  read: false
                };
                this.notifs.addNotification(notif);
                this.refreshAnalyticsOverview();
                this.fallbackNotified.add(s.taskId);
              }
            }
          }
        }
      },
      error: () => {
        this.summaries.set([]);
        this.loadingSummaries.set(false);
      },
      complete: () => {
        this.loadingSummaries.set(false);
      }
    });
  }

  getSummaries(): ProspectionSummaryDto[] {
    return this.summaries();
  }

  getDetail(taskId: number): Observable<ProspectionDetailDto> {
    const url = `${this.auth.getApiUrl()}/api/v1/async/prospect/result/${taskId}`;
    return this.http.get<ProspectionDetailDto>(url).pipe(
      map(dto => {
        this.detailsCache.set(taskId, dto);
        return dto;
      }),
      catchError(err => throwError(() => err))
    );
  }

  getCachedDetail(taskId: number): ProspectionDetailDto | undefined {
    return this.detailsCache.get(taskId);
  }

  deleteProspection(taskId: number): Observable<void> {
    const url = `${this.auth.getApiUrl()}/api/v1/async/prospect/result/${taskId}`;
    return this.http.delete<void>(url);
  }

  deleteAllProspection(): Observable<void> {
    const url = `${this.auth.getApiUrl()}/api/v1/async/prospect/result/all`;
    return this.http.delete<void>(url);
  }

  getAnalyticsOverview(): Observable<AnalyticsOverviewDto> {
    const url = `${this.auth.getApiUrl()}/api/v1/async/analytics/overview`;
    return this.http.get<AnalyticsOverviewDto>(url);
  }

  refreshAnalyticsOverview(): void {
    const url = `${this.auth.getApiUrl()}/api/v1/async/analytics/overview`;
    this.http.get<AnalyticsOverviewDto>(url).subscribe({
      next: (data) => this.analytics.set(data),
      error: () => {}
    });
  }

  clearCaches(): void {
    this.summaries.set([]);
    this.loadingSummaries.set(false);
    this.detailsCache.clear();
    this.analytics.set(null);
  }
}
