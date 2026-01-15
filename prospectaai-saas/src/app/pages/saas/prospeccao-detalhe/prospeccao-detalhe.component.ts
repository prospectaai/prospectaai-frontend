import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { SaasMainLayoutComponent } from '../../../components/layout/saas-main-layout/saas-main-layout.component';
import { CardComponent } from '../../../components/ui/card/card.component';
import { ButtonComponent } from '../../../components/ui/button/button.component';
import { ProspectionsService, ProspectionDetailDto } from '../../../shared/services/prospections.service';
import { TasksService } from '../../../shared/services/tasks.service';

@Component({
  selector: 'app-prospeccao-detalhe',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, SaasMainLayoutComponent, CardComponent, ButtonComponent],
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

  constructor(private route: ActivatedRoute, private prospections: ProspectionsService, private tasks: TasksService) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('taskId');
    const idNum = idParam ? Number(idParam) : NaN;
    if (!idParam || Number.isNaN(idNum)) {
      this.loading.set(false);
      this.processing.set(false);
      return;
    }
    this.taskId.set(idNum);
    this.loadDetail();
    const interval = setInterval(() => {
      const hasProcessing = this.tasks.getProcessingCount() > 0;
      if (!hasProcessing) {
        clearInterval(interval);
      }
      if (!this.processing()) {
        clearInterval(interval);
        return;
      }
      this.loadDetail();
    }, 6000);
  }

  private loadDetail(): void {
    const id = this.taskId();
    if (!id) return;
    this.loading.set(true);
    this.prospections.getDetail(id).subscribe({
      next: (dto) => {
        this.detail.set(dto);
        this.page.set(1);
        this.processing.set(dto.resultsCount === 0);
        this.loading.set(false);
      },
      error: () => {
        this.detail.set(null);
        this.processing.set(true);
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
}
