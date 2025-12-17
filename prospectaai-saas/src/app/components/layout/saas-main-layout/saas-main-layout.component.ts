import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService, UserProfileResponse } from '../../../shared/services/auth.service';

@Component({
  selector: 'layout-saas-main',
  standalone: true,
  imports: [RouterLink, CommonModule, LucideAngularModule],
  templateUrl: './saas-main-layout.component.html',
  styleUrl: './saas-main-layout.component.css'
})
export class SaasMainLayoutComponent {
  mobileMenuOpen = signal(false);
  avatarUrl = signal<string>('');
  displayInitials = signal<string>('');

  constructor(private auth: AuthService) {
    try {
      const profile = this.auth.getUserProfile() as UserProfileResponse | null;
      if (profile?.avatarUrl) this.avatarUrl.set(profile.avatarUrl);
      const name = profile?.displayName || '';
      const parts = name.trim().split(' ');
      const initials = (parts[0]?.[0] || 'U') + (parts[1]?.[0] || 'P');
      this.displayInitials.set(initials.toUpperCase());
    } catch {}
  }

  toggleMobileMenu() {
    this.mobileMenuOpen.update(value => !value);
  }
}
