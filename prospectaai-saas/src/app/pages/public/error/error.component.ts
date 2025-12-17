import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ThemeToggleComponent } from '../../../components/ui/theme-toggle/theme-toggle.component';

@Component({
  selector: 'page-error',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, ThemeToggleComponent],
  templateUrl: './error.component.html',
  styleUrl: './error.component.css'
})
export class ErrorPageComponent {
  message = signal('Ocorreu um erro inesperado. Tente novamente mais tarde.');

  constructor(route: ActivatedRoute) {
    const msg = route.snapshot.queryParams['message'];
    if (typeof msg === 'string' && msg.trim().length > 0) {
      this.message.set(msg);
    }
  }
}
