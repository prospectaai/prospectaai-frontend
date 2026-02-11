import { Component, OnInit, signal, ChangeDetectorRef, NgZone } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService, UserProfileResponse } from '../../../shared/services/auth.service';
import { NotificationsService, NotificationItem } from '../../../shared/services/notifications.service';
import { SaasTasksAccordionComponent } from '../saas-tasks-accordion/saas-tasks-accordion.component';
import { TasksService } from '../../../shared/services/tasks.service';
import { ToastContainerComponent } from '../../ui/toast-container/toast-container.component';
import { ProspectionsService } from '../../../shared/services/prospections.service';

@Component({
  selector: 'layout-saas-main',
  standalone: true,
  imports: [RouterLink, RouterModule, CommonModule, LucideAngularModule, SaasTasksAccordionComponent, ToastContainerComponent],
  templateUrl: './saas-main-layout.component.html',
  styleUrl: './saas-main-layout.component.css'
})
export class SaasMainLayoutComponent implements OnInit {
  mobileMenuOpen = signal(false);
  avatarUrl = signal<string>('');
  displayInitials = signal<string>('');
  notificationsOpen = signal(false);
  expandedIds = signal<Set<string>>(new Set());
  listRenderReady = signal<boolean>(true);
  renderKey = signal<number>(0);
  viewItems: NotificationItem[] = [];
  trackById = (_: number, item: NotificationItem) => item.id;

  constructor(private auth: AuthService, public notifs: NotificationsService, private tasks: TasksService, private cdr: ChangeDetectorRef, private zone: NgZone, public prospections: ProspectionsService) {
    try {
      const profile = this.auth.getUserProfile() as UserProfileResponse | null;
      if (profile?.avatarUrl) this.avatarUrl.set(profile.avatarUrl);
      const name = profile?.displayName || '';
      const parts = name.trim().split(' ');
      const initials = (parts[0]?.[0] || 'U') + (parts[1]?.[0] || 'P');
      this.displayInitials.set(initials.toUpperCase());
    } catch {}
    this.notifs.loadInitial(10);
  }

  ngOnInit(): void {
    this.tasks.loadAllProcessing();
    this.tasks.startProcessedPolling();
    this.prospections.loadUsage();
  }

  toggleMobileMenu() {
    this.mobileMenuOpen.update(value => !value);
  }

  toggleNotifications() {
    const willOpen = !this.notificationsOpen();
    this.notificationsOpen.set(willOpen);
    if (willOpen) {
      setTimeout(() => this.cdr.detectChanges(), 0);
    } else {
      this.expandedIds.set(new Set());
      this.notifs.markAllUnreadAsRead();
    }
  }

  toggleExpanded(id: string) {
    if (!id) return;
    this.expandedIds.update(set => {
      const newSet = new Set(set);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
    this.cdr.detectChanges();
  }

  isExpanded(id: string): boolean {
    return this.expandedIds().has(id);
  }

  setExpanded(id: string, open: boolean) {
    if (!id) return;
    this.expandedIds.update(prev => {
      const next = new Set(prev);
      if (open) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  onDetailsToggle(id: string, ev: Event) {
    // Legacy support or remove if unused
  }

  get usagePercent(): number {
    const u = this.prospections.usageSig();
    if (!u || u.limit === 0) return 0;
    return Math.min(100, (u.used / u.limit) * 100);
  }

  get usageColorClass(): string {
    const p = this.usagePercent;
    if (p >= 100) return 'bg-red-600'; // Strong red
    if (p >= 90) return 'bg-red-400'; // Light red
    if (p >= 70) return 'bg-yellow-500'; // Yellow
    return 'bg-green-500'; // Green
  }
}
