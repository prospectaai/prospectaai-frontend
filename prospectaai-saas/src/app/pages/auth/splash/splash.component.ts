import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../shared/services/auth.service';
import { TasksService } from '../../../shared/services/tasks.service';
import { NotificationsService } from '../../../shared/services/notifications.service';
import { ProspectionsService } from '../../../shared/services/prospections.service';
import { SseService } from '../../../shared/services/sse.service';

@Component({
  selector: 'page-splash',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './splash.component.html',
  styleUrl: './splash.component.css'
})
export class SplashComponent implements OnInit {
  constructor(
    private auth: AuthService,
    private router: Router,
    private sse: SseService,
    private tasks: TasksService,
    public notifs: NotificationsService,
    private prospections: ProspectionsService
  ) {}

  ngOnInit(): void {
    try {
      this.tasks.clearAll();
      this.notifs.clearCache();
      this.prospections.clearCaches();
    } catch {}
    this.sse.connect();
    this.auth.fetchUserProfile().subscribe({
      next: () => {
        this.router.navigate(['/saas/dashboard']);
      },
      error: (err) => {
        try { if (typeof window !== 'undefined') window.alert(JSON.stringify(err)); } catch {}
        const msg = (err?.error?.message as string) || 'Não foi possível carregar seu perfil.';
        this.router.navigate(['/error'], { queryParams: { message: msg } });
      }
    });
  }
}
