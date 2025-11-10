import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toasts = signal<ToastMessage[]>([]);
  
  toasts$ = this.toasts.asReadonly();

  show(toast: Omit<ToastMessage, 'id'>) {
    const id = this.generateId();
    const newToast: ToastMessage = {
      id,
      duration: 4000,
      ...toast
    };

    this.toasts.update(toasts => [...toasts, newToast]);

    // Auto remove after duration
    setTimeout(() => {
      this.remove(id);
    }, newToast.duration);
  }

  remove(id: string) {
    this.toasts.update(toasts => toasts.filter(t => t.id !== id));
  }

  success(title: string, message?: string) {
    this.show({ type: 'success', title, message });
  }

  error(title: string, message?: string) {
    this.show({ type: 'error', title, message });
  }

  warning(title: string, message?: string) {
    this.show({ type: 'warning', title, message });
  }

  info(title: string, message?: string) {
    this.show({ type: 'info', title, message });
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}