import { Component, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService, UserProfileResponse } from '../../../shared/services/auth.service';
import { NotificationsService, NotificationItem } from '../../../shared/services/notifications.service';
import { SaasTasksAccordionComponent } from '../saas-tasks-accordion/saas-tasks-accordion.component';
import { TasksService } from '../../../shared/services/tasks.service';
import { ToastContainerComponent } from '../../ui/toast-container/toast-container.component';

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
  trackById = (_: number, item: NotificationItem) => item.id;

  constructor(private auth: AuthService, public notifs: NotificationsService, private tasks: TasksService, private cdr: ChangeDetectorRef) {
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
  }

  toggleMobileMenu() {
    this.mobileMenuOpen.update(value => !value);
  }

  toggleNotifications() {
    const willOpen = !this.notificationsOpen();
    this.notificationsOpen.set(willOpen);
    if (willOpen) {
      this.listRenderReady.set(false);
      this.notifs.markAllUnreadAsRead();
      this.renderKey.set(Date.now());
      this.cdr.detectChanges();
      setTimeout(() => {
        this.listRenderReady.set(true);
        this.cdr.detectChanges();
      }, 0);
    } else {
      this.expandedIds.set(new Set());
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
    const open = (ev.target as HTMLDetailsElement)?.open ?? false;
    this.setExpanded(id, open);
  }
}
