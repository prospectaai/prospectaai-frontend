import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { first } from 'rxjs/operators';
import { AuthService } from '../../../shared/services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';
import { CardComponent } from "../../../components/ui/card/card.component";
import { LucideAngularModule } from "lucide-angular";
import { CardHeaderComponent } from "../../../components/ui/card-header/card-header.component";
import { CardTitleComponent } from "../../../components/ui/card-title/card-title.component";
import { CardDescriptionComponent } from "../../../components/ui/card-description/card-description.component";
import { CardContentComponent } from "../../../components/ui/card-content/card-content.component";
import { TabsComponent } from "../../../components/ui/tabs/tabs.component";
import { TabsListComponent } from "../../../components/ui/tabs-list/tabs-list.component";
import { TabsTriggerComponent } from "../../../components/ui/tabs-trigger/tabs-trigger.component";
import { TabsContentComponent } from "../../../components/ui/tabs-content/tabs-content.component";
import { LabelComponent } from "../../../components/ui/label/label.component";
import { InputComponent } from "../../../components/ui/input/input.component";
import { ButtonComponent } from "../../../components/ui/button/button.component";
import { ConfirmationModalComponent } from "../../../components/ui/confirmation-modal/confirmation-modal.component";
import { ToastContainerComponent } from "../../../components/ui/toast-container/toast-container.component";

@Component({
  selector: 'page-login',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    CardComponent,
    LucideAngularModule,
    CardHeaderComponent,
    CardTitleComponent,
    CardDescriptionComponent,
    CardContentComponent,
    TabsComponent,
    TabsListComponent,
    TabsTriggerComponent,
    TabsContentComponent,
    LabelComponent,
    InputComponent,
    ButtonComponent,
    ConfirmationModalComponent,
    ToastContainerComponent
],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginPageComponent implements OnInit {
  isLoading = signal(false);
  loginForm!: FormGroup;
  signupForm!: FormGroup;
  errorMessage = signal('');
  showConfirmationModal = signal(false);
  confirmationEmail = signal('');
  preRegisterId = signal('');

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });

    this.signupForm = this.fb.group({
      displayName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      passwordHash: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async handleLogin(event: Event) {
    event.preventDefault();
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    const loginData = this.loginForm.value;

    this.authService.login(loginData)
      .pipe(first())
      .subscribe({
        next: (response) => {
          console.log('Login realizado com sucesso', response);
          this.router.navigate(['/saas/dashboard']);
        },
        error: (error) => {
          console.error('Erro no login', error);
          this.errorMessage.set(error.error?.message || 'Erro ao fazer login. Verifique suas credenciais.');
          this.isLoading.set(false);
        }
      });
  }

  async handleSignup(event: Event) {
    event.preventDefault();
    if (this.signupForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    const signupData = this.signupForm.value;

    this.authService.register(signupData)
      .pipe(first())
      .subscribe({
        next: (response) => {
          console.log('Cadastro realizado com sucesso', response);
          this.confirmationEmail.set(signupData.email);
          this.preRegisterId.set(response.preRegisterId);
          this.showConfirmationModal.set(true);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Erro no cadastro', error);
          this.errorMessage.set(error.error?.message || 'Erro ao criar conta. Tente novamente.');
          this.isLoading.set(false);
        }
      });
  }

  handleOAuthLogin(provider: 'google' | 'github'): void {
    this.authService.oauthLogin(provider);
  }

  handleConfirmCode(code: string) {
    const preRegisterId = this.preRegisterId();
    
    this.authService.confirmCode({ code, preRegisterId })
      .pipe(first())
      .subscribe({
        next: (response) => {
          console.log('Código confirmado com sucesso', response);
          this.showConfirmationModal.set(false);
          this.toastService.success('Sucesso!', 'Código confirmado com sucesso!');
          
          // Redirecionar para o checkout após confirmação bem-sucedida
          this.router.navigate(['/checkout'], {
            queryParams: { prID: preRegisterId }
          });
        },
        error: (error) => {
          console.error('Erro ao confirmar código', error);
          this.toastService.error('Erro', error.error?.message || 'Código inválido ou expirado. Tente novamente.');
        }
      });
  }

  handleResendCode() {
    const preRegisterId = this.preRegisterId();
    
    this.authService.resendCode({ preRegisterId })
      .pipe(first())
      .subscribe({
        next: () => {
          this.toastService.success('Código reenviado!', 'Um novo código foi enviado para seu email.');
        },
        error: (error) => {
          console.error('Erro ao reenviar código', error);
          this.toastService.error('Erro', error.error?.message || 'Erro ao reenviar código. Tente novamente.');
        }
      });
  }

  handleCloseConfirmationModal() {
    this.showConfirmationModal.set(false);
    this.isLoading.set(false);
  }
}
