import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { CardComponent } from '../../../components/ui/card/card.component';
import { ButtonComponent } from '../../../components/ui/button/button.component';
import { InputComponent } from '../../../components/ui/input/input.component';
import { LabelComponent } from '../../../components/ui/label/label.component';
import { SelectComponent } from '../../../components/ui/select/select.component';
import { SaasMainLayoutComponent } from '../../../components/layout/saas-main-layout/saas-main-layout.component';
import { SliderComponent } from '../../../components/ui/slider/slider.component';

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
  
  constructor(private fb: FormBuilder) {}
  
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
    this.toastVisible = true;
    setTimeout(() => (this.toastVisible = false), 4000);
  }
}
