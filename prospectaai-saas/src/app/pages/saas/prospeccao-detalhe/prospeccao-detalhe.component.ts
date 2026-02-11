import { Component, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { SaasMainLayoutComponent } from '../../../components/layout/saas-main-layout/saas-main-layout.component';
import { CardComponent } from '../../../components/ui/card/card.component';
import { ButtonComponent } from '../../../components/ui/button/button.component';
import { SkeletonComponent } from '../../../components/ui/skeleton/skeleton.component';
import { ProspectionsService, ProspectionDetailDto } from '../../../shared/services/prospections.service';
import { TasksService } from '../../../shared/services/tasks.service';

@Component({
  selector: 'app-prospeccao-detalhe',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, SaasMainLayoutComponent, CardComponent, ButtonComponent, SkeletonComponent],
  templateUrl: './prospeccao-detalhe.component.html',
  styleUrl: './prospeccao-detalhe.component.css'
})
export class ProspeccaoDetalheComponent implements OnInit {
  taskId = signal<number | null>(null);
  loading = signal<boolean>(true);
  processing = signal<boolean>(true);
  detail = signal<ProspectionDetailDto | null>(null);
  page = signal<number>(1);
  readonly pageSize = 6;

  constructor(private route: ActivatedRoute, private prospections: ProspectionsService, private tasks: TasksService) {
    // Sync status with summaries to handle updates and initial state correctly
    effect(() => {
      const summaries = this.prospections.summariesSig();
      const id = this.taskId();
      // Only update if we have a detail loaded (meaning we are viewing a task)
      // and we found the summary for it.
      if (id && this.detail()) {
        const summary = summaries.find(s => s.taskId === id);
        if (summary) {
          this.processing.set(summary.status === 'PROCESSING');
        }
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('taskId');
    const idNum = idParam ? Number(idParam) : NaN;
    if (!idParam || Number.isNaN(idNum)) {
      this.loading.set(false);
      this.processing.set(false);
      return;
    }
    this.taskId.set(idNum);

    // Ensure summaries are loaded to check status
    if (this.prospections.getSummaries().length === 0) {
      this.prospections.loadAllSummaries();
    }

    this.loadDetail();
    const interval = setInterval(() => {
      const hasProcessing = this.tasks.getProcessingCount() > 0;
      if (!hasProcessing) {
        // If we were processing, one last check to ensure we get final state
        if (this.processing()) {
          this.loadDetail();
        }
        clearInterval(interval);
      }
      if (!this.processing()) {
        clearInterval(interval);
        return;
      }
      this.loadDetail();
    }, 6000);

    effect(() => {
      const doneAt = this.tasks.getLastCompletedAt();
      if (doneAt) {
        this.prospections.loadAllSummaries();
        this.loadDetail();
      }
    }, { allowSignalWrites: true });
  }

  private loadDetail(): void {
    const id = this.taskId();
    if (!id) return;

    // Only show loading state if we don't have data yet
    if (!this.detail()) {
      this.loading.set(true);
    }

    this.prospections.getDetail(id).subscribe({
      next: (dto) => {
        this.detail.set(dto);
        this.page.set(1);

        // Determine processing status from summaries if possible
        const summary = this.prospections.getSummaries().find(s => s.taskId === id);
        if (summary) {
          this.processing.set(summary.status === 'PROCESSING');
        }

        this.loading.set(false);
      },
      error: () => {
        this.detail.set(null);
        this.processing.set(true); // Keep processing on error or retry?
        this.loading.set(false);
      }
    });
  }

  whatsappLink(phone?: string | null): string {
    if (!phone) return '';
    const digits = String(phone).replace(/\D+/g, '');
    if (!digits) return '';
    const normalized = digits.startsWith('55') ? digits : `55${digits}`;
    return `https://wa.me/${normalized}`;
  }

  get pageCount(): number {
    const total = this.detail()?.results?.length || 0;
    return Math.max(1, Math.ceil(total / this.pageSize));
  }

  pagedResults(): any[] {
    const arr = this.detail()?.results || [];
    const current = Math.min(Math.max(this.page(), 1), this.pageCount);
    const start = (current - 1) * this.pageSize;
    return arr.slice(start, start + this.pageSize);
  }

  prevPage(): void {
    this.page.update(p => Math.max(1, p - 1));
  }

  nextPage(): void {
    this.page.update(p => Math.min(this.pageCount, p + 1));
  }

  goToPage(p: number): void {
    this.page.set(Math.min(this.pageCount, Math.max(1, p)));
  }

  goToEntry(entry: number | '...'): void {
    if (typeof entry === 'number') {
      this.goToPage(entry);
    }
  }

  get showFirstPageDots(): boolean {
    return this.pageCount > 5 && this.page() > 5;
  }

  get pagesWindow(): (number | '...')[] {
    const total = this.pageCount;
    if (total <= 0) return [];
    const current = Math.min(Math.max(this.page(), 1), total);
    const pages: (number | '...')[] = [];
    if (current <= 5) {
      const end = Math.min(current === 1 ? 5 : 6, total);
      for (let i = 1; i <= end; i++) pages.push(i);
      if (end < total) {
        pages.push('...');
        pages.push(total);
      }
      return pages;
    }
    const base = Math.floor((current - 1) / 5) * 5 + 1;
    const windowStart = current % 5 === 0 ? current : base;
    const windowEnd = Math.min(windowStart + 4, total);
    for (let i = windowStart; i <= windowEnd; i++) pages.push(i);
    if (windowEnd < total) {
      pages.push('...');
      pages.push(total);
    }
    return pages;
  }
}
