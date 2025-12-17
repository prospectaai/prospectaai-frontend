import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../shared/services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';
import { CardComponent } from '../../../components/ui/card/card.component';
import { CardHeaderComponent } from '../../../components/ui/card-header/card-header.component';
import { CardTitleComponent } from '../../../components/ui/card-title/card-title.component';
import { CardDescriptionComponent } from '../../../components/ui/card-description/card-description.component';
import { CardContentComponent } from '../../../components/ui/card-content/card-content.component';
import { ButtonComponent } from '../../../components/ui/button/button.component';
import { InputComponent } from '../../../components/ui/input/input.component';
import { LabelComponent } from '../../../components/ui/label/label.component';
import { LucideAngularModule } from 'lucide-angular';
import { ThemeToggleComponent } from '../../../components/ui/theme-toggle/theme-toggle.component';

@Component({
  selector: 'page-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardDescriptionComponent,
    CardContentComponent,
    ButtonComponent,
    InputComponent,
    LabelComponent,
    LucideAngularModule,
    ThemeToggleComponent
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent implements OnInit {
  isValidating = signal(true);
  isValid = signal(false);
  isSubmitting = signal(false);
  token = signal('');

  form!: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private auth: AuthService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    });

    const tokenParam = this.route.snapshot.queryParamMap.get('token') || '';
    this.token.set(tokenParam);

    if (!tokenParam) {
      this.toast.error('Erro na operação', 'Token de reset ausente.');
      this.router.navigate(['/auth']);
      return;
    }

    // Validar token com spinner (como o checkout)
    this.validateToken(tokenParam);
  }

  async validateToken(token: string) {
    try {
      this.isValidating.set(true);
      const ok = await this.auth.validateResetToken(token);
      this.isValid.set(!!ok);
      if (!ok) {
        this.toast.error('Erro na operação', 'Link de redefinição inválido ou expirado.');
      }
    } catch (e) {
      this.toast.error('Erro na operação', 'Erro ao validar o token de redefinição.');
    } finally {
      this.isValidating.set(false);
    }
  }

  async submitReset(event: Event) {
    event.preventDefault();
    if (this.form.invalid) {
      this.toast.warning('Atenção', 'Preencha todos os campos corretamente.');
      return;
    }
    const { newPassword, confirmPassword } = this.form.value;
    if (newPassword !== confirmPassword) {
      this.toast.error('Erro na operação', 'As senhas não coincidem.');
      return;
    }
    try {
      this.isSubmitting.set(true);
      await this.auth.resetPassword(this.token(), newPassword);
      this.toast.success('Senha redefinida com sucesso. Faça login novamente.');
      this.router.navigate(['/auth']);
    } catch (e) {
      this.toast.error('Erro na operação', 'Não foi possível redefinir a senha.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
