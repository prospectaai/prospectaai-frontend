import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CardComponent } from '../../../components/ui/card/card.component';
import { ButtonComponent } from '../../../components/ui/button/button.component';
import { InputComponent } from '../../../components/ui/input/input.component';
import { BadgeComponent } from '../../../components/ui/badge/badge.component';
import { LucideAngularModule } from 'lucide-angular';
import { SaasMainLayoutComponent } from "../../../components/layout/saas-main-layout/saas-main-layout.component";
import { ProspectionsService, ProspectionSummaryDto } from '../../../shared/services/prospections.service';
import { TasksService } from '../../../shared/services/tasks.service';
import { SelectComponent } from '../../../components/ui/select/select.component';

@Component({
  selector: 'app-resultados',
    imports: [
    CommonModule,
    ReactiveFormsModule,
    CardComponent,
    ButtonComponent,
    InputComponent,
    BadgeComponent,
    LucideAngularModule,
    SelectComponent,
    RouterLink
    // Download,
    // Search,
    // Filter,
    // MapPin,
    // Phone,
    // Mail,
    // ExternalLink
    ,
    SaasMainLayoutComponent
],
  templateUrl: './resultados.component.html',
  styleUrl: './resultados.component.css'
})
export class ResultadosComponent implements OnInit {
  searchForm!: FormGroup;
  loading = signal<boolean>(false);
  items = signal<ProspectionSummaryDto[]>([]);
  page = signal<number>(1);
  readonly pageSize = 6;
  showFilters = signal<boolean>(false);
  readonly titleMaxChars = 45;
  eff = effect(() => {
    this.loading.set(this.prospections.loadingSummariesSig());
    this.items.set(this.prospections.getSummaries());
  });

  constructor(private fb: FormBuilder, private prospections: ProspectionsService, private tasks: TasksService) {}

  ngOnInit() {
    this.searchForm = this.fb.group({
      searchTerm: [''],
      filterPlatform: [''],
      filterStatus: [''],
      filterFromDate: [''],
      filterToDate: ['']
    });

    this.searchForm.get('searchTerm')?.valueChanges.subscribe(value => {
      // filtro reativo
    });
    this.prospections.loadAllSummaries();
    const interval = setInterval(() => {
      const hasProcessing = this.tasks.getProcessingCount() > 0;
      if (!hasProcessing) {
        clearInterval(interval);
        return;
      }
      this.prospections.loadAllSummaries();
    }, 8000);
  }

  get filteredCompanies() {
    const searchTerm = this.searchForm.get('searchTerm')?.value || '';
    const term = this.normalizeText(String(searchTerm || '').trim().toLowerCase());
    const fPlatform = String(this.searchForm.get('filterPlatform')?.value || '').trim();
    const fStatus = String(this.searchForm.get('filterStatus')?.value || '').trim();
    const fFrom = String(this.searchForm.get('filterFromDate')?.value || '').trim();
    const fTo = String(this.searchForm.get('filterToDate')?.value || '').trim();
    const arr = this.items();
    let filtered = arr;
    if (term.length > 0) {
      filtered = filtered.filter(c => this.normalizeText((c.query || '').toLowerCase()).includes(term));
    }
    if (fPlatform) {
      filtered = filtered.filter(c => (c.platform || '').toLowerCase() === fPlatform.toLowerCase());
    }
    if (fStatus) {
      filtered = filtered.filter(c => (c.status || '').toLowerCase() === fStatus.toLowerCase());
    }
    if (fFrom) {
      const fromTime = new Date(fFrom).getTime();
      filtered = filtered.filter(c => new Date(c.createdAt || '').getTime() >= fromTime);
    }
    if (fTo) {
      const toTime = new Date(fTo).getTime();
      filtered = filtered.filter(c => new Date(c.createdAt || '').getTime() <= toTime);
    }
    const sorted = [...filtered].sort((a, b) => {
      const ta = new Date(a.createdAt || '').getTime();
      const tb = new Date(b.createdAt || '').getTime();
      return tb - ta;
    });
    return sorted;
  }

  toggleFilters(): void {
    this.showFilters.update(v => !v);
  }

  hasActiveFilters(): boolean {
    const fPlatform = String(this.searchForm.get('filterPlatform')?.value || '').trim();
    const fStatus = String(this.searchForm.get('filterStatus')?.value || '').trim();
    const fFrom = String(this.searchForm.get('filterFromDate')?.value || '').trim();
    const fTo = String(this.searchForm.get('filterToDate')?.value || '').trim();
    return !!(fPlatform || fStatus || fFrom || fTo);
  }

  get pageCount(): number {
    const total = this.filteredCompanies.length;
    return Math.max(1, Math.ceil(total / this.pageSize));
  }

  get pagedCompanies(): ProspectionSummaryDto[] {
    const current = Math.min(Math.max(this.page(), 1), this.pageCount);
    const start = (current - 1) * this.pageSize;
    return this.filteredCompanies.slice(start, start + this.pageSize);
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

  formatDate(dt: string): string {
    try {
      const d = new Date(dt);
      return d.toLocaleString();
    } catch {
      return dt;
    }
  }

  private normalizeText(s: string): string {
    try {
      return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    } catch {
      return s;
    }
  }

  clipTitle(q: string | undefined | null): string {
    const s = String(q || '');
    if (s.length <= this.titleMaxChars) return s;
    return s.slice(0, this.titleMaxChars - 3) + '...';
  }
}
