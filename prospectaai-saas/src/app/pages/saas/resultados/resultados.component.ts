import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CardComponent } from '../../../components/ui/card/card.component';
import { ButtonComponent } from '../../../components/ui/button/button.component';
import { InputComponent } from '../../../components/ui/input/input.component';
import { BadgeComponent } from '../../../components/ui/badge/badge.component';
import { LucideAngularModule } from 'lucide-angular';
import { SaasMainLayoutComponent } from "../../../components/layout/saas-main-layout/saas-main-layout.component";

@Component({
  selector: 'app-resultados',
    imports: [
    CommonModule,
    ReactiveFormsModule,
    CardComponent,
    ButtonComponent,
    InputComponent,
    BadgeComponent,
    LucideAngularModule
    // Download,
    // Search,
    // Filter,
    // MapPin,
    // Phone,
    // Mail,
    // ExternalLink
    ,
    SaasMainLayoutComponent
],
  templateUrl: './resultados.component.html',
  styleUrl: './resultados.component.css'
})
export class ResultadosComponent implements OnInit {
  searchForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.searchForm = this.fb.group({
      searchTerm: ['']
    });

    // Reagir às mudanças no formulário
    this.searchForm.get('searchTerm')?.valueChanges.subscribe(value => {
      // Aqui você pode adicionar lógica adicional se necessário
    });
  }

  mockCompanies = [
    {
      id: 1,
      name: 'Restaurante Sabor & Arte',
      category: 'Restaurante',
      address: 'Rua Augusta, 1000 - São Paulo, SP',
      phone: '(11) 3333-4444',
      email: 'contato@saborarte.com.br',
      rating: 4.5,
      status: 'verified',
    },
    {
      id: 2,
      name: 'Academia Fitness Pro',
      category: 'Academia',
      address: 'Av. Paulista, 2000 - São Paulo, SP',
      phone: '(11) 5555-6666',
      email: 'info@fitnesspro.com.br',
      rating: 4.8,
      status: 'pending',
    },
    {
      id: 3,
      name: 'Clínica Saúde Total',
      category: 'Clínica Médica',
      address: 'Rua Oscar Freire, 500 - São Paulo, SP',
      phone: '(11) 7777-8888',
      email: 'atendimento@saudetotal.com.br',
      rating: 4.7,
      status: 'verified',
    },
    {
      id: 4,
      name: 'Café Gourmet Express',
      category: 'Cafeteria',
      address: 'Rua Haddock Lobo, 300 - São Paulo, SP',
      phone: '(11) 9999-0000',
      email: 'cafe@gourmetexpress.com.br',
      rating: 4.3,
      status: 'new',
    },
  ];

  get filteredCompanies() {
    const searchTerm = this.searchForm.get('searchTerm')?.value || '';
    return this.mockCompanies.filter(company =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
}
