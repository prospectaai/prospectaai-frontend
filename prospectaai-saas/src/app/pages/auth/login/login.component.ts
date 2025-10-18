import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
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
    ButtonComponent
],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginPageComponent implements OnInit {
  isLoading = signal(false);
  loginForm!: FormGroup;
  signupForm!: FormGroup;

  constructor(private router: Router, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });

    this.signupForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async handleLogin(event: Event) {
    event.preventDefault();
    if (this.loginForm.invalid) return;
    
    this.isLoading.set(true);
    // TODO: lógica real de login
    console.log('Login iniciado', this.loginForm.value);

    // comportamento temporário:
    setTimeout(() => {
      console.log('Redirecionando para dashboard');
      this.router.navigate(['/saas/dashboard']);
    }, 1500);
  }

  async handleSignup(event: Event) {
    event.preventDefault();
    if (this.signupForm.invalid) return;
    
    this.isLoading.set(true);
    // TODO: lógica real de cadastro

    // comportamento temporário:
    setTimeout(() => {
      this.router.navigate(['/saas/dashboard']);
    }, 1500);
  }
}