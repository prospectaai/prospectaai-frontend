import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { map, catchError, throwError } from 'rxjs';

export interface ProspectTemplateDto {
  id: string;
  title: string;
  dataJson: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProspectTemplateRequest {
  title: string;
  dataJson: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProspectTemplatesService {
  private items = signal<ProspectTemplateDto[]>([]);
  private loading = signal<boolean>(false);
  public itemsSig = this.items.asReadonly();
  public loadingSig = this.loading.asReadonly();

  constructor(private http: HttpClient, private auth: AuthService) {}

  getItems(): ProspectTemplateDto[] {
    return this.items();
  }

  isLoading(): boolean {
    return this.loading();
  }

  loadAll(): void {
    if (!this.auth.isBrowser()) return;
    const token = this.auth.getToken();
    if (!token || this.auth.isTokenExpired()) {
      this.auth.logoutExpired();
      return;
    }
    this.loading.set(true);
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    this.http.get<ProspectTemplateDto[]>(`${this.auth.getApiUrl()}/api/v1/async/prospect/templates`, { headers }).subscribe({
      next: (list) => {
        const arr = Array.isArray(list) ? list : [];
        this.items.set(arr);
      },
      error: () => {},
      complete: () => {
        this.loading.set(false);
      }
    });
  }

  create(req: ProspectTemplateRequest): Observable<ProspectTemplateDto> {
    const token = this.auth.getToken();
    if (!token || this.auth.isTokenExpired()) {
      this.auth.logoutExpired();
      return throwError(() => new Error('Unauthorized'));
    }
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.post<ProspectTemplateDto>(`${this.auth.getApiUrl()}/api/v1/async/prospect/templates`, req, { headers }).pipe(
      map(dto => {
        const curr = this.items();
        this.items.set([dto, ...curr]);
        return dto;
      }),
      catchError(err => throwError(() => err))
    );
  }

  update(id: string, req: ProspectTemplateRequest): Observable<ProspectTemplateDto> {
    const token = this.auth.getToken();
    if (!token || this.auth.isTokenExpired()) {
      this.auth.logoutExpired();
      return throwError(() => new Error('Unauthorized'));
    }
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.put<ProspectTemplateDto>(`${this.auth.getApiUrl()}/api/v1/async/prospect/templates/${id}`, req, { headers }).pipe(
      map(dto => {
        this.items.update(arr => {
          const idx = arr.findIndex(t => t.id === id);
          if (idx !== -1) {
            const next = [...arr];
            next[idx] = dto;
            return next;
          }
          return [dto, ...arr];
        });
        return dto;
      }),
      catchError(err => throwError(() => err))
    );
  }

  existsTitle(title: string): boolean {
    const t = (title || '').trim().toLowerCase();
    return this.items().some(x => (x.title || '').trim().toLowerCase() === t);
  }

  delete(id: string): Observable<void> {
    const token = this.auth.getToken();
    if (!token || this.auth.isTokenExpired()) {
      this.auth.logoutExpired();
      return throwError(() => new Error('Unauthorized'));
    }
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.delete<void>(`${this.auth.getApiUrl()}/api/v1/async/prospect/templates/${id}`, { headers }).pipe(
      map(() => {
        this.items.update(arr => arr.filter(t => t.id !== id));
      }),
      catchError(err => throwError(() => err))
    );
  }
}
