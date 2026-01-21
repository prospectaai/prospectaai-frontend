import { Component, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SaasMainLayoutComponent } from '../../../components/layout/saas-main-layout/saas-main-layout.component';
import { NotificationsService, NotificationItem } from '../../../shared/services/notifications.service';
import { ButtonComponent } from '../../../components/ui/button/button.component';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'page-notifications',
  standalone: true,
  imports: [CommonModule, RouterLink, SaasMainLayoutComponent, ButtonComponent, LucideAngularModule],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.css'
})
export class NotificationsPageComponent implements OnInit {
  loading = signal(false);
  page = signal(1);
  pageSize = 10;

  // Track previous items length to auto-advance page on load
  private prevItemsLength = 0;

  constructor(public notifs: NotificationsService) {
    effect(() => {
      const currentLen = this.notifs.itemsSig().length;
      // Se carregou mais itens e estávamos esperando (loading), e a página atual estava cheia
      // podemos considerar avançar ou notificar.
      // Mas por enquanto vamos deixar manual ou tratar no nextPage.
      this.prevItemsLength = currentLen;
    });
  }

  ngOnInit(): void {
    // Ensure we have data
    if (this.notifs.itemsSig().length === 0) {
       this.notifs.loadInitial(50);
    }
  }

  get pagedItems(): NotificationItem[] {
    const start = (this.page() - 1) * this.pageSize;
    return this.notifs.itemsSig().slice(start, start + this.pageSize);
  }

  get pageCount(): number {
    const total = this.notifs.itemsSig().length;
    return Math.max(1, Math.ceil(total / this.pageSize));
  }

  prevPage(): void {
    this.page.update(p => Math.max(1, p - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  nextPage(): void {
    if (this.page() < this.pageCount) {
      this.page.update(p => p + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (this.notifs.hasMore()) {
      // Load more from server
      this.notifs.loadMore();
    }
  }

  handleNextPage(): void {
    if (this.page() < this.pageCount) {
      this.nextPage();
    } else if (this.notifs.hasMore()) {
      const currentLen = this.notifs.itemsSig().length;
      this.notifs.loadMore();

      const checkInterval = setInterval(() => {
        if (this.notifs.itemsSig().length > currentLen) {
          this.page.update(p => p + 1);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          clearInterval(checkInterval);
        } else if (!this.notifs.isLoading() && !this.notifs.hasMore()) {
            clearInterval(checkInterval); // Stop if load finished with no new items
        }
      }, 100);

      // Safety timeout
      setTimeout(() => clearInterval(checkInterval), 5000);
    }
  }

  goToPage(p: number): void {
    this.page.set(Math.min(this.pageCount, Math.max(1, p)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
