import { CommonModule } from '@angular/common';
import { Component, OnInit, AfterViewInit, signal, effect } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
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
export class ProspeccaoComponent implements OnInit, AfterViewInit {
  prospeccaoForm!: FormGroup;
  toastVisible = false;
  isProcessing = signal(false);
  templates = signal<ProspectTemplateDto[]>([]);
  states = signal<any[]>([]);
  cities = signal<any[]>([]);
  showSelectModal = signal(false);
  showSaveModal = signal(false);
  selectedTemplateId = signal<string | null>(null);
  saveTemplateName = signal<string>('');
  showDeleteModal = signal<boolean>(false);
  deleteTargetId = signal<string | null>(null);
  isEditMode = signal<boolean>(false);
  editTargetId = signal<string | null>(null);

  constructor(private fb: FormBuilder, private auth: AuthService, private toast: ToastService, private router: Router, private tasks: TasksService, public tpl: ProspectTemplatesService, private http: HttpClient) {
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
      state: [''],
      city: [''],
      searchRadius: [2],
      businessType: [''],
      useAddress: [false],
      addressStreet: [''],
      addressNumber: [''],
      addressNeighborhood: [''],
      addressCity: [''],
      addressState: [''],
      addressZip: [''],
      latitude: [''],
      longitude: ['']
    });
    this.tpl.loadAll();
    effect(() => {
      this.templates.set(this.tpl.getItems());
    });
    this.loadStates();
    this.prospeccaoForm.get('state')?.valueChanges.subscribe(val => {
      const stateId = String(val || '').trim();
      this.prospeccaoForm.patchValue({ city: '', location: '' });
      if (!stateId) {
        this.cities.set([]);
        return;
      }
      this.loadCitiesForState(stateId);
    });
    this.prospeccaoForm.get('city')?.valueChanges.subscribe(val => {
      const cityName = String(val || '').trim();
      const stateId = String(this.prospeccaoForm.get('state')?.value || '').trim();
      const st = this.states().find(s => String(s.id) === stateId);
      if (cityName && st?.sigla) {
        this.prospeccaoForm.patchValue({ location: `${cityName}, ${st.sigla}` });
      } else {
        this.prospeccaoForm.patchValue({ location: '' });
      }
    });
    this.prospeccaoForm.get('useAddress')?.valueChanges.subscribe(v => {
      if (v) {
        this.prospeccaoForm.get('addressCity')?.setValidators([Validators.required]);
        this.prospeccaoForm.get('addressState')?.setValidators([Validators.required]);
        this.prospeccaoForm.get('addressStreet')?.setValidators([Validators.required]);
        this.prospeccaoForm.get('addressNeighborhood')?.setValidators([Validators.required]);
        this.prospeccaoForm.get('addressCity')?.updateValueAndValidity();
        this.prospeccaoForm.get('addressState')?.updateValueAndValidity();
        this.prospeccaoForm.get('addressStreet')?.updateValueAndValidity();
        this.prospeccaoForm.get('addressNeighborhood')?.updateValueAndValidity();
        this.prospeccaoForm.patchValue({
          state: '',
          city: '',
          location: ''
        });
        this.tryResolveMyLocation();
      } else {
        this.prospeccaoForm.get('addressCity')?.clearValidators();
        this.prospeccaoForm.get('addressState')?.clearValidators();
        this.prospeccaoForm.get('addressStreet')?.clearValidators();
        this.prospeccaoForm.get('addressNeighborhood')?.clearValidators();
        this.prospeccaoForm.get('addressCity')?.updateValueAndValidity();
        this.prospeccaoForm.get('addressState')?.updateValueAndValidity();
        this.prospeccaoForm.get('addressStreet')?.updateValueAndValidity();
        this.prospeccaoForm.get('addressNeighborhood')?.updateValueAndValidity();
        this.prospeccaoForm.patchValue({
          addressStreet: '',
          addressNumber: '',
          addressNeighborhood: '',
          addressCity: '',
          addressState: '',
          addressZip: '',
          latitude: '',
          longitude: ''
        });
      }
    });
  }

  ngAfterViewInit(): void {
    try {
      if (this.auth.isBrowser()) {
        setTimeout(() => {
          if (this.states().length === 0) {
            this.loadStates();
          }
        }, 0);
      }
    } catch {}
  }

  get location() { return this.prospeccaoForm.get('location')?.value; }
  get searchRadius() {
    const v = this.prospeccaoForm.get('searchRadius')?.value;
    return Array.isArray(v) ? v[0] : v;
  }
  get businessType() { return this.prospeccaoForm.get('businessType')?.value; }
  get state() { return this.prospeccaoForm.get('state')?.value; }
  get city() { return this.prospeccaoForm.get('city')?.value; }
  get useAddress() { return !!this.prospeccaoForm.get('useAddress')?.value; }
  get addressStreet() { return this.prospeccaoForm.get('addressStreet')?.value; }
  get addressNumber() { return this.prospeccaoForm.get('addressNumber')?.value; }
  get addressNeighborhood() { return this.prospeccaoForm.get('addressNeighborhood')?.value; }
  get addressCity() { return this.prospeccaoForm.get('addressCity')?.value; }
  get addressState() { return this.prospeccaoForm.get('addressState')?.value; }
  get latitude() { return this.prospeccaoForm.get('latitude')?.value; }
  get longitude() { return this.prospeccaoForm.get('longitude')?.value; }

  onStateChange(stateId: string) {
    const id = String(stateId || '').trim();
    this.prospeccaoForm.patchValue({ state: id, city: '', location: '' });
    if (!id) {
      this.cities.set([]);
      return;
    }
    this.loadCitiesForState(id);
  }

  handleSearch() {
    const businessType = String(this.businessType || '').trim();
    const useAddr = this.useAddress;
    let location = String(this.location || '').trim();
    let radius = useAddr ? Number(this.searchRadius || 0) : 0;
    let latVal = String(this.latitude || '').trim();
    let lngVal = String(this.longitude || '').trim();

    if (!businessType) {
      this.toast.warning('Atenção', 'Informe o tipo de negócio.');
      return;
    }
    if (useAddr) {
      const city = String(this.addressCity || '').trim();
      const state = String(this.addressState || '').trim();
      const street = String(this.addressStreet || '').trim();
      const number = String(this.addressNumber || '').trim();
      const neighborhood = String(this.addressNeighborhood || '').trim();
      const lat = String(this.latitude || '').trim();
      const lng = String(this.longitude || '').trim();
      if (!city || !state || !street || !neighborhood) {
        this.toast.warning('Atenção', 'Informe os dados do endereço (incluindo bairro).');
        return;
      }
      const display = [`${street}${number ? ' ' + number : ''}${neighborhood ? ' - ' + neighborhood : ''}`, city, state].filter(Boolean).join(', ');
      location = display;
      if (radius < 2 || radius > 100) {
        this.toast.warning('Atenção', 'Raio deve ser entre 2 e 100 km.');
        return;
      }
    } else {
      const stateId = String(this.state || '').trim();
      const cityName = String(this.city || '').trim();
      const st = this.states().find(s => String(s.id) === stateId);
      if (!stateId || !cityName || !st?.sigla) {
        this.toast.warning('Atenção', 'Informe estado e cidade.');
        return;
      }
      location = `${cityName}, ${st.sigla}`;
      radius = 0;
    }

    const query = this.composeSerpApiPrompt({ location, businessType, radius });
    const payload: any = {
      query,
      platform: 'GOOGLE_MAPS' as const,
      businessType
    };
    if (useAddr) {
      const zipVal = String(this.prospeccaoForm.get('addressZip')?.value || '').trim();
      Object.assign(payload, {
        location,
        radiusKm: radius,
        useAddress: true,
        addressStreet: this.addressStreet || '',
        addressNumber: this.addressNumber || '',
        addressNeighborhood: this.addressNeighborhood || '',
        addressCity: this.addressCity || '',
        addressState: this.addressState || '',
        addressZip: zipVal
      });
      if (latVal && lngVal) {
        payload.latitude = Number(latVal);
        payload.longitude = Number(lngVal);
      }
    } else {
      const stateId = String(this.state || '').trim();
      const cityName = String(this.city || '').trim();
      const st = this.states().find(s => String(s.id) === stateId);
      Object.assign(payload, {
        location,
        radiusKm: 0,
        useAddress: false,
        stateId,
        stateSigla: st?.sigla || '',
        cityName
      });
    }

    if (useAddr) {
      if (latVal && lngVal) {
        payload.latitude = Number(latVal);
        payload.longitude = Number(lngVal);
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
        return;
      }
      try {
        const params = new HttpParams().set('format', 'jsonv2').set('q', location).set('limit', '1');
        this.isProcessing.set(true);
        this.http.get<any[]>('https://nominatim.openstreetmap.org/search', { params }).subscribe({
          next: (res) => {
            const first = Array.isArray(res) && res.length > 0 ? res[0] : null;
            if (!first || !first.lat || !first.lon) {
              this.isProcessing.set(false);
              this.toast.error('Erro ao geocodificar', 'Não foi possível obter latitude/longitude para o endereço informado.');
              return;
            }
            latVal = String(first.lat);
            lngVal = String(first.lon);
            payload.latitude = Number(latVal);
            payload.longitude = Number(lngVal);
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
          },
          error: () => {
            this.isProcessing.set(false);
            this.toast.error('Erro ao geocodificar', 'Falha ao consultar geocodificação do endereço.');
          }
        });
        return;
      } catch {
        this.isProcessing.set(false);
        this.toast.error('Erro ao geocodificar', 'Falha inesperada ao preparar latitude/longitude.');
        return;
      }
    } else {
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
      return;
    }
  }

  private composeSerpApiPrompt(params: { location: string; businessType: string; radius: number }): string {
    const base = `${params.businessType} em ${params.location}`.trim();
    const parts: string[] = [base];
    if (params.radius && params.radius > 0) {
      parts.push(`até ${params.radius} km`);
    }
    return parts.join(', ');
  }

  tryResolveMyLocation() {
    try {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        this.toast.warning('Atenção', 'Navegador sem suporte a geolocalização.');
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = String(pos.coords.latitude || '');
          const lng = String(pos.coords.longitude || '');
          this.prospeccaoForm.patchValue({ latitude: lat, longitude: lng, location: `${lat},${lng}` });
          this.reverseGeocode(lat, lng);
          this.toast.success('Localização obtida', 'Usaremos sua localização atual.');
        },
        () => {
          this.toast.warning('Atenção', 'Não foi possível obter sua localização. Informe manualmente.');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } catch {
      this.toast.warning('Atenção', 'Falha ao obter localização.');
    }
  }

  private reverseGeocode(lat: string, lng: string) {
    try {
      const params = new HttpParams()
        .set('format', 'jsonv2')
        .set('lat', lat)
        .set('lon', lng)
        .set('addressdetails', '1');
      this.http.get<any>('https://nominatim.openstreetmap.org/reverse', { params }).subscribe({
        next: (res) => {
          const addr = res?.address || {};
          const street = String(addr.road || addr.pedestrian || addr.footway || addr.path || '').trim();
          const number = String(addr.house_number || '').trim();
          const city = String(addr.city || addr.town || addr.village || addr.county || '').trim();
          const state = String(addr.state || addr.region || addr.state_district || '').trim();
          const zip = String(addr.postcode || '').trim();
          const neighborhood = String(addr.suburb || addr.neighbourhood || addr.quarter || '').trim();
          const patch: any = {};
          if (street) patch.addressStreet = street;
          if (number) patch.addressNumber = number;
          if (neighborhood) patch.addressNeighborhood = neighborhood;
          if (city) patch.addressCity = city;
          if (state) patch.addressState = state;
          if (zip) patch.addressZip = zip;
          if (street && city && state) {
            const display = [`${street}${number ? ' ' + number : ''}${neighborhood ? ' - ' + neighborhood : ''}`, city, state].filter(Boolean).join(', ');
            patch.location = display;
          }
          this.prospeccaoForm.patchValue(patch);
        },
        error: () => {}
      });
    } catch {}
  }

  private loadStates() {
    try {
      if (!this.auth.isBrowser()) return;
      this.http.get<any[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados').subscribe({
        next: (res) => {
          const arr = Array.isArray(res) ? res : [];
          const sorted = arr.sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || '')));
          this.states.set(sorted);
        },
        error: () => {}
      });
    } catch {}
  }

  private loadCitiesForState(stateId: string) {
    try {
      if (!this.auth.isBrowser()) return;
      if (!stateId) {
        this.cities.set([]);
        return;
      }
      this.http.get<any[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${stateId}/municipios`).subscribe({
        next: (res) => {
          const arr = Array.isArray(res) ? res : [];
          const sorted = arr.sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || '')));
          this.cities.set(sorted);
        },
        error: () => {}
      });
    } catch {}
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
      const bt = String(data.businessType || '').trim();
      const mode = String(data.mode || '').toUpperCase();
      const useAddr = !!data.useAddress || mode === 'ADDRESS';
      if (useAddr) {
        const radius = typeof data.searchRadius === 'number' ? data.searchRadius : 2;
        const patch: any = {
          businessType: bt,
          useAddress: true,
          searchRadius: radius >= 2 && radius <= 100 ? radius : 2,
          addressStreet: data.addressStreet || '',
          addressNumber: data.addressNumber || '',
          addressNeighborhood: data.addressNeighborhood || '',
          addressCity: data.addressCity || '',
          addressState: data.addressState || '',
          addressZip: data.addressZip || '',
          latitude: data.latitude ? String(data.latitude) : '',
          longitude: data.longitude ? String(data.longitude) : '',
          location: data.location || '',
          state: '',
          city: ''
        };
        this.prospeccaoForm.patchValue(patch);
      } else {
        const radius = typeof data.searchRadius === 'number' ? data.searchRadius : 0;
        const rawLoc = String(data.location || '').trim();
        const stateIdFromData = data.stateId ? String(data.stateId) : '';
        const stateSigla = String(data.stateSigla || '');
        const cityName = String(data.cityName || '');
        let st = null as any;
        if (stateIdFromData) {
          st = this.states().find((s) => String(s.id) === stateIdFromData);
        }
        if (!st && stateSigla) {
          st = this.states().find((s) => String(s.sigla).toUpperCase() === stateSigla.toUpperCase());
        }
        let finalLocation = rawLoc;
        if (!finalLocation && cityName && st?.sigla) {
          finalLocation = `${cityName}, ${st.sigla}`;
        }
        const stateIdFinal = st ? String(st.id) : stateIdFromData;
        const patch: any = {
          businessType: bt,
          useAddress: false,
          searchRadius: radius || 0,
          location: finalLocation,
          state: stateIdFinal,
          city: cityName
        };
        this.prospeccaoForm.patchValue(patch);
        if (stateIdFinal) {
          this.loadCitiesForState(stateIdFinal);
        }
      }
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
    const bt = (this.businessType || '').trim();
    if (!bt) return false;
    if (this.useAddress) {
      const city = String(this.addressCity || '').trim();
      const state = String(this.addressState || '').trim();
      const street = String(this.addressStreet || '').trim();
       const neighborhood = String(this.addressNeighborhood || '').trim();
      const radius = Number(this.searchRadius || 0);
      return city.length > 0 && state.length > 0 && street.length > 0 && neighborhood.length > 0 && radius >= 2 && radius <= 100;
    } else {
      const stateId = String(this.state || '').trim();
      const cityName = String(this.city || '').trim();
      return stateId.length > 0 && cityName.length > 0;
    }
  }

  saveTemplate() {
    if (!this.canSaveTemplate()) return;
    const name = (this.saveTemplateName() || '').trim();
    const useAddr = this.useAddress;
    const bt = this.businessType || '';
    const base: any = { businessType: bt };
    if (useAddr) {
      const radius = Number(this.searchRadius || 0);
      const latVal = String(this.latitude || '').trim();
      const lngVal = String(this.longitude || '').trim();
      const addr: any = {
        mode: 'ADDRESS',
        useAddress: true,
        location: this.location || '',
        searchRadius: radius,
        addressStreet: this.addressStreet || '',
        addressNumber: this.addressNumber || '',
        addressNeighborhood: this.addressNeighborhood || '',
        addressCity: this.addressCity || '',
        addressState: this.addressState || '',
        addressZip: this.prospeccaoForm.get('addressZip')?.value || ''
      };
      if (latVal && lngVal) {
        addr.latitude = Number(latVal);
        addr.longitude = Number(lngVal);
      }
      Object.assign(base, addr);
    } else {
      const stateId = String(this.state || '').trim();
      const cityName = String(this.city || '').trim();
      const st = this.states().find(s => String(s.id) === stateId);
      let loc = String(this.location || '').trim();
      if (!loc && cityName && st?.sigla) {
        loc = `${cityName}, ${st.sigla}`;
      }
      Object.assign(base, {
        mode: 'LOCATION',
        useAddress: false,
        location: loc,
        searchRadius: 0,
        stateId,
        stateSigla: st?.sigla || '',
        cityName
      });
    }
    const payload = {
      title: name,
      dataJson: JSON.stringify(base)
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
      state: '',
      city: '',
      searchRadius: 2,
      businessType: '',
      useAddress: false,
      addressStreet: '',
      addressNumber: '',
      addressNeighborhood: '',
      addressCity: '',
      addressState: '',
      addressZip: '',
      latitude: '',
      longitude: ''
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
