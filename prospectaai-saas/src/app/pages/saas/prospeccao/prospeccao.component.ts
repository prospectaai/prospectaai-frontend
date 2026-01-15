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
import { ProspectTemplatesService, ProspectTemplateDto } from '../../../shared/services/prospect-templates.service';

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
  templates = signal<ProspectTemplateDto[]>([]);
  showSelectModal = signal(false);
  showSaveModal = signal(false);
  selectedTemplateId = signal<string | null>(null);
  saveTemplateName = signal<string>('');
  showDeleteModal = signal<boolean>(false);
  deleteTargetId = signal<string | null>(null);
  isEditMode = signal<boolean>(false);
  editTargetId = signal<string | null>(null);

  constructor(private fb: FormBuilder, private auth: AuthService, private toast: ToastService, private router: Router, private tasks: TasksService, public tpl: ProspectTemplatesService) {
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
    this.tpl.loadAll();
    effect(() => {
      this.templates.set(this.tpl.getItems());
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
    const payload = {
      query,
      platform: 'GOOGLE_MAPS' as const,
      location,
      businessType,
      radiusKm: radius,
      companySize
    };

    this.isProcessing.set(true);
    this.auth.dispatchN8n(payload).subscribe({
      next: () => {
        this.tasks.addProspectionTaskStart(query);
        this.isProcessing.set(false);
        this.toastVisible = true;
        this.toast.success('Busca iniciada', 'Sua prospecção está sendo processada.');
        setTimeout(() => (this.toastVisible = false), 2000);
        this.router.navigate(['/saas/dashboard']);
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

  openSelectTemplates() {
    this.showSelectModal.set(true);
    this.selectedTemplateId.set(null);
  }

  closeSelectTemplates() {
    this.showSelectModal.set(false);
    this.selectedTemplateId.set(null);
  }

  selectTemplate(id: string) {
    this.selectedTemplateId.set(id);
  }

  applySelectedTemplate() {
    const id = this.selectedTemplateId();
    if (!id) return;
    const tpl = this.templates().find(t => t.id === id);
    if (!tpl) return;
    this.applyTemplateData(tpl);
    this.closeSelectTemplates();
  }

  applyTemplateData(tpl: ProspectTemplateDto) {
    try {
      const data = JSON.parse(tpl.dataJson || '{}');
      this.prospeccaoForm.patchValue({
        location: data.location || '',
        searchRadius: data.searchRadius ?? 10,
        businessType: data.businessType || '',
        companySize: data.companySize || 'Todos os portes',
      });
    } catch {}
  }

  applyQuickTemplate(tpl: ProspectTemplateDto) {
    this.applyTemplateData(tpl);
    this.selectedTemplateId.set(tpl.id);
  }

  openSaveTemplate() {
    if (this.isProcessing()) return;
    if (!this.canOpenSaveTemplate()) return;
    const currentId = this.selectedTemplateId();
    if (currentId) {
      const tpl = this.tpl.getItems().find(t => t.id === currentId);
      if (tpl) {
        this.isEditMode.set(true);
        this.editTargetId.set(currentId);
        this.saveTemplateName.set(tpl.title || '');
      } else {
        this.isEditMode.set(false);
        this.editTargetId.set(null);
        this.saveTemplateName.set('');
      }
    } else {
      this.isEditMode.set(false);
      this.editTargetId.set(null);
      this.saveTemplateName.set('');
    }
    this.showSaveModal.set(true);
  }

  closeSaveTemplate() {
    this.showSaveModal.set(false);
    this.saveTemplateName.set('');
    this.isEditMode.set(false);
    this.editTargetId.set(null);
  }

  canSaveTemplate(): boolean {
    const name = (this.saveTemplateName() || '').trim();
    if (name.length < 3 || name.length > 55) return false;
    const editId = this.editTargetId();
    const lower = name.toLowerCase();
    const existsOther = this.tpl.getItems().some(x => (x.title || '').trim().toLowerCase() === lower && x.id !== editId);
    if (existsOther) return false;
    return true;
  }

  canOpenSaveTemplate(): boolean {
    const loc = (this.location || '').trim();
    const bt = (this.businessType || '').trim();
    const radius = Number(this.searchRadius || 0);
    const size = (this.companySize || '').trim();
    return loc.length > 0 && bt.length > 0 && radius > 0 && size.length > 0;
  }

  saveTemplate() {
    if (!this.canSaveTemplate()) return;
    const name = (this.saveTemplateName() || '').trim();
    const payload = {
      title: name,
      dataJson: JSON.stringify({
        location: this.location || '',
        searchRadius: Number(this.searchRadius || 0),
        businessType: this.businessType || '',
        companySize: this.companySize || ''
      })
    };
    const editId = this.editTargetId();
    if (this.isEditMode() && editId) {
      this.tpl.update(editId, payload).subscribe({
        next: () => {
          this.toast.success('Template atualizado', 'Seu template foi atualizado com sucesso.');
          this.closeSaveTemplate();
          this.selectedTemplateId.set(editId);
        },
        error: (err) => {
          const msg = err?.error?.message || 'Não foi possível atualizar o template.';
          this.toast.error('Erro ao atualizar', msg);
        }
      });
    } else {
      this.tpl.create(payload).subscribe({
        next: (dto) => {
          this.toast.success('Template salvo', 'Seu template foi salvo com sucesso.');
          this.selectedTemplateId.set(dto.id);
          this.closeSaveTemplate();
        },
        error: (err) => {
          const msg = err?.error?.message || 'Não foi possível salvar o template.';
          this.toast.error('Erro ao salvar', msg);
        }
      });
    }
  }

  clearFormToNoTemplate() {
    this.prospeccaoForm.patchValue({
      location: '',
      searchRadius: 10,
      businessType: '',
      companySize: 'Todos os portes',
    });
    this.selectedTemplateId.set(null);
  }

  openDeleteTemplate(id: string) {
    this.deleteTargetId.set(id);
    this.showDeleteModal.set(true);
  }

  closeDeleteTemplateModal() {
    this.showDeleteModal.set(false);
    this.deleteTargetId.set(null);
  }

  confirmDeleteTemplate() {
    const id = this.deleteTargetId();
    if (!id) return;
    this.tpl.delete(id).subscribe({
      next: () => {
        this.clearFormToNoTemplate();
        this.closeDeleteTemplateModal();
        this.toast.success('Template excluído', 'O template foi removido com sucesso.');
      },
      error: (err) => {
        const msg = err?.error?.message || 'Não foi possível excluir o template.';
        this.toast.error('Erro ao excluir', msg);
      }
    });
  }
}
