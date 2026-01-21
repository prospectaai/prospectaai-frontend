import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { map, catchError, throwError } from 'rxjs';
import { AnalyticsOverviewDto } from '../dtos/analytics-overview.dto';

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

export interface ProspectionRecordDto {
  query: string;
  platform: string;
  nomeEmpresa: string;
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
  private loadingSummaries = signal<boolean>(false);
  private detailsCache = new Map<number, ProspectionDetailDto>();
  public summariesSig = this.summaries.asReadonly();
  public loadingSummariesSig = this.loadingSummaries.asReadonly();

  constructor(private http: HttpClient, private auth: AuthService) {}

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
      },
      error: () => {
        this.summaries.set([]);
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

  clearCaches(): void {
    this.summaries.set([]);
    this.loadingSummaries.set(false);
    this.detailsCache.clear();
  }
}
