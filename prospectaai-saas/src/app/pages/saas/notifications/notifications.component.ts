import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SaasMainLayoutComponent } from '../../../components/layout/saas-main-layout/saas-main-layout.component';
import { NotificationsService } from '../../../shared/services/notifications.service';
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

  constructor(public notifs: NotificationsService) {}

  ngOnInit(): void {}

  loadMore(): void {
    this.notifs.loadMore();
  }
}
