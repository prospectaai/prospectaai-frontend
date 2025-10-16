import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SaasMainLayoutComponent } from '../../../components/layout/saas-main-layout/saas-main-layout.component';
import { ButtonComponent } from '../../../components/ui/button/button.component';
import { CardComponent } from '../../../components/ui/card/card.component';
import { CardHeaderComponent } from '../../../components/ui/card-header/card-header.component';
import { CardContentComponent } from '../../../components/ui/card-content/card-content.component';
import { CardTitleComponent } from '../../../components/ui/card-title/card-title.component';
import { CardDescriptionComponent } from '../../../components/ui/card-description/card-description.component';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    RouterModule,
    SaasMainLayoutComponent,
    ButtonComponent,
    CardComponent,
    CardHeaderComponent,
    CardContentComponent,
    CardTitleComponent,
    CardDescriptionComponent,
    LucideAngularModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardPageComponent {
 stats = [
    {
      title: 'Empresas Prospectadas',
      value: '1,234',
      change: '+12% este mês',
      icon: 'Users',
    },
    {
      title: 'Buscas Ativas',
      value: '8',
      change: '3 agendadas',
      icon: 'Calendar',
    },
    {
      title: 'Taxa de Sucesso',
      value: '87%',
      change: '+5% vs. mês anterior',
      icon: 'TrendingUp',
    },
    {
      title: 'Localizações',
      value: '15',
      change: '5 cidades',
      icon: 'MapPin',
    },
  ];

  recentSearches = [
    { id: 1, name: 'Restaurantes em São Paulo', date: 'Hoje, 14:30', results: 45 },
    { id: 2, name: 'Academias no Rio de Janeiro', date: 'Ontem, 09:15', results: 32 },
    { id: 3, name: 'Clínicas em Belo Horizonte', date: '2 dias atrás', results: 28 },
  ];
}
