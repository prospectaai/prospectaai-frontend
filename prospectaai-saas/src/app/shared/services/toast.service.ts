import { Injectable, NgZone, signal } from '@angular/core';

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

  constructor(private zone: NgZone) {}

  show(toast: Omit<ToastMessage, 'id'>) {
    this.zone.run(() => {
      const id = this.generateId();
      const newToast: ToastMessage = {
        id,
        type: toast.type,
        title: toast.title,
        message: (typeof toast.message === 'string' && toast.message.trim().length > 0)
          ? toast.message
          : toast.title,
        duration: toast.duration ?? 4000
      };

      this.toasts.update(toasts => [...toasts, newToast]);

      // Auto remove after duration
      setTimeout(() => {
        this.remove(id);
      }, newToast.duration);
    });
  }

  remove(id: string) {
    this.zone.run(() => {
      this.toasts.update(toasts => toasts.filter(t => t.id !== id));
    });
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