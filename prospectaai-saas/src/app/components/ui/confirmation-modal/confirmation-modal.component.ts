import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ModalComponent } from '../modal/modal.component';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'ui-confirmation-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAngularModule,
    ModalComponent,
    ButtonComponent
  ],
  templateUrl: './confirmation-modal.component.html',
  styleUrl: './confirmation-modal.component.css'
})
export class ConfirmationModalComponent {
  @Input() isOpen = false;
  @Input() email = '';
  @Output() confirm = new EventEmitter<string>();
  @Output() resend = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  confirmationForm: FormGroup;
  isLoading = signal(false);
  resendTimer = signal(0);
  resendInterval: any;

  constructor(private fb: FormBuilder) {
    this.confirmationForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });
  }

  onConfirm() {
    if (this.confirmationForm.invalid) return;
    
    this.isLoading.set(true);
    const code = this.confirmationForm.get('code')?.value;
    this.confirm.emit(code);
  }

  onResend() {
    if (this.resendTimer() > 0) return;
    
    this.resend.emit();
    this.startResendTimer();
  }

  startResendTimer() {
    this.resendTimer.set(20);
    
    this.resendInterval = setInterval(() => {
      this.resendTimer.update(timer => {
        if (timer <= 1) {
          clearInterval(this.resendInterval);
          return 0;
        }
        return timer - 1;
      });
    }, 1000);
  }

  onClose() {
    this.close.emit();
    this.confirmationForm.reset();
    this.clearTimer();
  }

  clearTimer() {
    if (this.resendInterval) {
      clearInterval(this.resendInterval);
      this.resendTimer.set(0);
    }
  }

  getFormattedTimer(): string {
    return `${this.resendTimer()}s`;
  }
}