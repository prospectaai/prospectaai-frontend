import { ChangeDetectorRef, Component, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './toast-container.component.html',
  styleUrls: ['./toast-container.component.css']
})
export class ToastContainerComponent {
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  
  toasts = this.toastService.toasts$;

  // Ensure change detection runs immediately on signal updates
  constructor() {
    effect(() => {
      // Read the signal to track dependency
      void this.toasts();
      // Mark for check to update view even under coalesced events
      this.cdr.markForCheck();
    });
  }

  getToastIcon(type: string): string {
    switch (type) {
      case 'success':
        return 'Check';
      case 'error':
        return 'X';
      case 'warning':
        return 'AlertTriangle';
      case 'info':
        return 'Info';
      default:
        return 'Info';
    }
  }

  getToastStyles(type: string): string {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  }

  dismissToast(id: string): void {
    this.toastService.remove(id);
  }
}