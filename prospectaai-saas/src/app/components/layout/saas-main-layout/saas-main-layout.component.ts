import { Component, OnInit, signal } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService, UserProfileResponse } from '../../../shared/services/auth.service';
import { NotificationsService } from '../../../shared/services/notifications.service';
import { SaasTasksAccordionComponent } from '../saas-tasks-accordion/saas-tasks-accordion.component';
import { TasksService } from '../../../shared/services/tasks.service';

@Component({
  selector: 'layout-saas-main',
  standalone: true,
  imports: [RouterLink, RouterModule, CommonModule, LucideAngularModule, SaasTasksAccordionComponent],
  templateUrl: './saas-main-layout.component.html',
  styleUrl: './saas-main-layout.component.css'
})
export class SaasMainLayoutComponent implements OnInit {
  mobileMenuOpen = signal(false);
  avatarUrl = signal<string>('');
  displayInitials = signal<string>('');
  notificationsOpen = signal(false);

  constructor(private auth: AuthService, public notifs: NotificationsService, private tasks: TasksService) {
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
  }

  toggleMobileMenu() {
    this.mobileMenuOpen.update(value => !value);
  }

  toggleNotifications() {
    const willOpen = !this.notificationsOpen();
    this.notificationsOpen.set(willOpen);
    if (willOpen) {
      this.notifs.markAllUnreadAsRead();
    } else {
      this.notifs.collapseAll();
    }
  }
}
