import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { AsyncTaskPanelDto } from '../dtos/async-task-panel.dto';
import { ProspectionSummaryDto } from './prospections.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

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
  private processedPollId: any = null;

  constructor(private http: HttpClient, private auth: AuthService) {}

  private getVisibleTasks(): TaskItem[] {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    return this.tasks().filter(t => {
      if (t.status === 'PROCESSANDO') return true;
      if (!t.end) return true;
      const endDate = new Date(t.end).getTime();
      return (now - endDate) < oneDayMs;
    });
  }

  getTasks(): TaskItem[] {
    return this.getVisibleTasks();
  }

  getProcessingCount(): number {
    return this.tasks().filter(t => t.status === 'PROCESSANDO').length;
  }

  getProcessedCount(): number {
    return this.getVisibleTasks().filter(t => t.status === 'CONCLUIDA').length;
  }

  getTotalCount(): number {
    return this.getVisibleTasks().length;
  }

  getLastCompletedAt(): number | null {
    return this.lastCompletedAt();
  }

  toggleAccordion(): void {
    this.accordionOpen.update(v => !v);
  }

  addProspectionTaskStart(name: string): string {
    const id = `local:${Date.now()}:${Math.floor(Math.random() * 100000)}`;
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
    const idStr = String(dto.taskId);

    this.tasks.update(curr => {
      const idx = curr.findIndex(t => t.id === idStr);
      if (idx !== -1) {
        const t = curr[idx];
        const end = mappedStatus === 'CONCLUIDA' ? (t.end || nowIso) : undefined;
        curr[idx] = { ...t, id: idStr, name: dto.query, type: mappedType, status: mappedStatus, end };
      } else {
        const dupIdx = curr.findIndex(t => t.type === mappedType && t.status === 'PROCESSANDO' && t.name === dto.query);
        if (dupIdx !== -1) {
          curr.splice(dupIdx, 1);
        }
        const item: TaskItem = {
          id: idStr,
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

    // We will load:
    // 1. All results (summaries) -> Contains dates, good for Prospections
    // 2. Processing tasks -> Active tasks
    // 3. Processed tasks (legacy DTO) -> For "OTHER" types mainly

    const urlResults = `${this.auth.getApiUrl()}/api/v1/async/prospect/get-all-results`;
    const urlProcessing = `${this.auth.getApiUrl()}/api/v1/async/prospect/get-all-processing`;
    const urlProcessed = `${this.auth.getApiUrl()}/api/v1/async/prospect/get-all-processed`;

    forkJoin({
      results: this.http.get<ProspectionSummaryDto[]>(urlResults).pipe(catchError(() => of([]))),
      processing: this.http.get<AsyncTaskPanelDto[]>(urlProcessing).pipe(catchError(() => of([]))),
      processed: this.http.get<AsyncTaskPanelDto[]>(urlProcessed).pipe(catchError(() => of([])))
    }).subscribe(({ results, processing, processed }) => {
      const taskMap = new Map<string, TaskItem>();
      const now = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;

      // 1. Process Results (Prospections with dates)
      if (Array.isArray(results)) {
        results.forEach(res => {
          const createdAt = new Date(res.createdAt).getTime();
          // Assuming createdAt is roughly start/end time.
          // If task is old, we skip it.
          // Logic: visible if (now - end) < 24h.
          // Use createdAt as proxy for end time if completed.
          const isVisible = (now - createdAt) < oneDayMs;

          // However, if status is PROCESSING, it should be visible regardless of age?
          // Usually processing tasks are recent. If stuck for days, maybe we show them.
          // But 'results' usually have status.

          if (isVisible || res.status === 'PROCESSING') {
            const mappedStatus: TaskStatus = res.status === 'PROCESSED' ? 'CONCLUIDA' : 'PROCESSANDO';
            taskMap.set(String(res.taskId), {
              id: String(res.taskId),
              name: res.query,
              type: 'PROSPECÇÃO',
              start: res.createdAt,
              end: mappedStatus === 'CONCLUIDA' ? res.createdAt : undefined,
              status: mappedStatus
            });
          }
        });
      }

      // 2. Process Processing (Active tasks - overwrite/add)
      if (Array.isArray(processing)) {
        processing.forEach(dto => {
          const status: TaskStatus = 'PROCESSANDO';
          const type: TaskType = dto.platform === 'GOOGLE_MAPS' ? 'PROSPECÇÃO' : 'OUTRA';
          // Always add processing tasks
          taskMap.set(String(dto.taskId), {
            id: String(dto.taskId),
            name: dto.query,
            type,
            start: new Date().toISOString(), // We don't have start date here, use now
            status
          });
        });
      }

      // 3. Process Processed (For OTHER types mainly)
      if (Array.isArray(processed)) {
        processed.forEach(dto => {
          const id = String(dto.taskId);
          // Only add if not already present (prioritize 'results' which has dates)
          if (!taskMap.has(id)) {
             const type: TaskType = dto.platform === 'GOOGLE_MAPS' ? 'PROSPECÇÃO' : 'OUTRA';
             // If it's PROSPECÇÃO and missing from 'results', it means it was filtered out by date (old).
             // So we should NOT add it back.
             // If it's OUTRA, we don't have dates, so we assume it's relevant (or maybe we should filter OUTRA too? But we can't).
             // Let's assume user cares mostly about Prospections.
             if (type !== 'PROSPECÇÃO') {
               const status: TaskStatus = dto.status === 'PROCESSED' ? 'CONCLUIDA' : 'PROCESSANDO';
               taskMap.set(id, {
                 id,
                 name: dto.query,
                 type,
                 start: new Date().toISOString(),
                 end: new Date().toISOString(), // Default to now
                 status
               });
             }
          }
        });
      }

      const allTasks = Array.from(taskMap.values());
      // Sort by start date desc (newest first)
      allTasks.sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());

      this.tasks.set(allTasks);

      if (this.getTotalCount() > 0) {
        this.accordionOpen.set(true);
      }
    });
  }

  private syncProcessedOnce(): void {
    if (!this.auth.isBrowser()) return;
    const url = `${this.auth.getApiUrl()}/api/v1/async/prospect/get-all-processed`;
    this.http.get<AsyncTaskPanelDto[]>(url).subscribe({
      next: (list) => {
        const arr = Array.isArray(list) ? list : [];
        if (arr.length === 0) return;
        arr.forEach(dto => {
          if (dto.platform !== 'GOOGLE_MAPS') {
            this.upsertFromDto(dto);
          }
        });
      },
      error: () => {}
    });
  }

  startProcessedPolling(intervalMs = 6000): void {
    if (this.processedPollId) return;
    this.processedPollId = setInterval(() => {
      const hasProcessing = this.getProcessingCount() > 0;
      if (!hasProcessing) {
        if (this.processedPollId) {
          clearInterval(this.processedPollId);
          this.processedPollId = null;
        }
        return;
      }
      this.syncProcessedOnce();
    }, intervalMs);
  }

  clearAll(): void {
    if (this.processedPollId) {
      clearInterval(this.processedPollId);
      this.processedPollId = null;
    }
    this.tasks.set([]);
    this.lastCompletedAt.set(null);
    this.accordionOpen.set(false);
    this.initialized = false;
  }
}
