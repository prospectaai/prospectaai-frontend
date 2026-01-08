import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { AsyncTaskPanelDto } from '../dtos/async-task-panel.dto';

export type TaskStatus = 'PROCESSANDO' | 'CONCLUIDA';
export type TaskType = 'PROSPECÇÃO' | 'OUTRA';

export interface TaskItem {
  id: string;
  name: string;
  type: TaskType;
  start: string;
  end?: string;
  status: TaskStatus;
}

@Injectable({
  providedIn: 'root'
})
export class TasksService {
  private tasks = signal<TaskItem[]>([]);
  private lastCompletedAt = signal<number | null>(null);
  accordionOpen = signal<boolean>(false);
  private initialized = false;

  constructor(private http: HttpClient, private auth: AuthService) {}

  getTasks(): TaskItem[] {
    return this.tasks();
  }

  getProcessingCount(): number {
    return this.tasks().filter(t => t.status === 'PROCESSANDO').length;
  }

  getProcessedCount(): number {
    return this.tasks().filter(t => t.status === 'CONCLUIDA').length;
  }

  getTotalCount(): number {
    return this.tasks().length;
  }

  getLastCompletedAt(): number | null {
    return this.lastCompletedAt();
  }

  toggleAccordion(): void {
    this.accordionOpen.update(v => !v);
  }

  addProspectionTaskStart(name: string): string {
    const id = `task-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const item: TaskItem = {
      id,
      name,
      type: 'PROSPECÇÃO',
      start: new Date().toISOString(),
      status: 'PROCESSANDO'
    };
    this.tasks.update(curr => [item, ...curr]);
    this.accordionOpen.set(true);
    return id;
  }

  markLastProspectionCompleted(): void {
    const now = new Date().toISOString();
    let updated = false;
    this.tasks.update(curr => {
      const idx = curr.findIndex(t => t.type === 'PROSPECÇÃO' && t.status === 'PROCESSANDO');
      if (idx !== -1) {
        const t = curr[idx];
        curr[idx] = { ...t, status: 'CONCLUIDA', end: now };
        updated = true;
      }
      return [...curr];
    });
    if (updated) this.lastCompletedAt.set(Date.now());
  }

  upsertFromDto(dto: AsyncTaskPanelDto): void {
    const mappedStatus: TaskStatus = dto.status === 'PROCESSED' ? 'CONCLUIDA' : 'PROCESSANDO';
    const mappedType: TaskType = dto.platform === 'GOOGLE_MAPS' ? 'PROSPECÇÃO' : 'OUTRA';
    const nowIso = new Date().toISOString();
    this.tasks.update(curr => {
      const idx = curr.findIndex(t => t.id === dto.taskId);
      if (idx !== -1) {
        const t = curr[idx];
        const end = mappedStatus === 'CONCLUIDA' ? (t.end || nowIso) : undefined;
        curr[idx] = { ...t, name: dto.query, type: mappedType, status: mappedStatus, end };
      } else {
        const item: TaskItem = {
          id: dto.taskId,
          name: dto.query,
          type: mappedType,
          start: nowIso,
          status: mappedStatus,
          end: mappedStatus === 'CONCLUIDA' ? nowIso : undefined
        };
        curr = [item, ...curr];
      }
      return [...curr];
    });
    if (mappedStatus === 'CONCLUIDA') {
      this.lastCompletedAt.set(Date.now());
    }
    if (this.getTotalCount() > 0) {
      this.accordionOpen.set(true);
    }
  }

  loadAllProcessing(): void {
    if (!this.auth.isBrowser()) return;
    if (this.initialized) return;
    this.initialized = true;
    const url = `${this.auth.getApiUrl()}/api/v1/async/prospect/get-all-processing`;
    this.http.get<AsyncTaskPanelDto[]>(url).subscribe({
      next: (list) => {
        const arr = Array.isArray(list) ? list : [];
        if (arr.length === 0) return;
        this.tasks.update(() => {
          const mapped = arr.map(dto => {
            const status: TaskStatus = dto.status === 'PROCESSED' ? 'CONCLUIDA' : 'PROCESSANDO';
            const type: TaskType = dto.platform === 'GOOGLE_MAPS' ? 'PROSPECÇÃO' : 'OUTRA';
            return {
              id: dto.taskId,
              name: dto.query,
              type,
              start: new Date().toISOString(),
              status
            } as TaskItem;
          });
          return mapped;
        });
        if (this.getTotalCount() > 0) {
          this.accordionOpen.set(true);
        }
      },
      error: () => {}
    });
  }
}
