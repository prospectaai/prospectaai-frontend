import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, effect } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { CardComponent } from '../../../components/ui/card/card.component';
import { ButtonComponent } from '../../../components/ui/button/button.component';
import { InputComponent } from '../../../components/ui/input/input.component';
import { LabelComponent } from '../../../components/ui/label/label.component';
import { SelectComponent } from '../../../components/ui/select/select.component';
import { SaasMainLayoutComponent } from '../../../components/layout/saas-main-layout/saas-main-layout.component';
import { SliderComponent } from '../../../components/ui/slider/slider.component';
import { AuthService } from '../../../shared/services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';
import { Router } from '@angular/router';
import { TasksService } from '../../../shared/services/tasks.service';

@Component({
  selector: 'app-prospeccao',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAngularModule,
    CardComponent,
    ButtonComponent,
    InputComponent,
    LabelComponent,
    SelectComponent,
    SliderComponent,
    SaasMainLayoutComponent,
  ],
  templateUrl: './prospeccao.component.html',
  styleUrl: './prospeccao.component.css'
})
export class ProspeccaoComponent implements OnInit {
  prospeccaoForm!: FormGroup;
  toastVisible = false;
  isProcessing = signal(false);

  constructor(private fb: FormBuilder, private auth: AuthService, private toast: ToastService, private router: Router, private tasks: TasksService) {
    effect(() => {
      const doneAt = this.tasks.getLastCompletedAt();
      if (doneAt && this.isProcessing()) {
        this.isProcessing.set(false);
        this.router.navigate(['/saas/dashboard']);
      }
    });
  }

  ngOnInit(): void {
    this.prospeccaoForm = this.fb.group({
      location: [''],
      searchRadius: [10],
      businessType: [''],
      companySize: ['Todos os portes']
    });
  }

  get location() { return this.prospeccaoForm.get('location')?.value; }
  get searchRadius() { return this.prospeccaoForm.get('searchRadius')?.value; }
  get businessType() { return this.prospeccaoForm.get('businessType')?.value; }
  get companySize() { return this.prospeccaoForm.get('companySize')?.value; }

  handleSearch() {
    const location = (this.location || '').trim();
    const businessType = (this.businessType || '').trim();
    const radius = Number(this.searchRadius || 0);
    const companySize = (this.companySize || '').trim();

    if (!location || !businessType) {
      this.toast.warning('Atenção', 'Informe localização e tipo de negócio.');
      return;
    }

    const query = this.composeSerpApiPrompt({ location, businessType, radius, companySize });
    const payload = { query, platform: 'GOOGLE_MAPS' as const };

    this.isProcessing.set(true);
    this.auth.dispatchN8n(payload).subscribe({
      next: () => {
        this.isProcessing.set(false);
        this.toastVisible = true;
        this.toast.success('Busca iniciada', 'Sua prospecção está sendo processada.');
        setTimeout(() => (this.toastVisible = false), 4000);
      },
      error: (err) => {
        this.isProcessing.set(false);
        const msg = err?.error?.message || 'Não foi possível iniciar a prospecção.';
        this.toast.error('Erro ao iniciar', msg);
      }
    });
  }

  private composeSerpApiPrompt(params: { location: string; businessType: string; radius: number; companySize: string }): string {
    const base = `${params.businessType} em ${params.location}`.trim();
    const parts: string[] = [base];
    if (params.radius && params.radius > 0) {
      parts.push(`até ${params.radius} km`);
    }
    if (params.companySize && params.companySize !== 'Todos os portes') {
      parts.push(params.companySize);
    }
    return parts.join(', ');
  }
}
