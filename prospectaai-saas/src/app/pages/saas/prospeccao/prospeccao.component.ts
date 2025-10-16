import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
    FormsModule,
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
export class ProspeccaoComponent {
  searchRadius = 10;
  companySize = '';
  location = '';
  businessType = '';

  toastVisible = false;

  handleSearch() {
    this.toastVisible = true;
    setTimeout(() => (this.toastVisible = false), 4000);
  }
}
