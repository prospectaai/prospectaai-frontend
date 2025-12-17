import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../shared/services/auth.service';

@Component({
  selector: 'page-splash',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './splash.component.html',
  styleUrl: './splash.component.css'
})
export class SplashComponent implements OnInit {
  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.auth.fetchUserProfile().subscribe({
      next: () => {
        this.router.navigate(['/saas/dashboard']);
      },
      error: (err) => {
        window.alert(JSON.stringify(err));
        const msg = (err?.error?.message as string) || 'Não foi possível carregar seu perfil.';
        this.router.navigate(['/error'], { queryParams: { message: msg } });
      }
    });
  }
}
