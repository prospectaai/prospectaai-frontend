import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ButtonComponent } from "../../../components/ui/button/button.component";
import { BadgeComponent } from "../../../components/ui/badge/badge.component";
import { CardComponent } from "../../../components/ui/card/card.component";
import { CardContentComponent } from "../../../components/ui/card-content/card-content.component";
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';
import { Observable } from 'rxjs';
import { ThemeToggleComponent } from '../../../components/ui/theme-toggle/theme-toggle.component';


@Component({
  selector: 'page-landing-page',
  imports: [
    CommonModule,
    ButtonComponent,
    LucideAngularModule,
    BadgeComponent,
    CardComponent,
    CardContentComponent,
    RouterLink,
    ThemeToggleComponent
  ],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.css'
})
export class LandingPageComponent {
  isAuthenticated$!: Observable<boolean>;

  constructor(private authService: AuthService) {
    // Garante que o estado seja verificado no momento da criação do componente
    this.authService.isAuthenticated();
    this.isAuthenticated$ = this.authService.isAuthenticated$;
  }

 features = [
    {
      icon: 'globe',
      title: 'Extração via Google Places',
      description: 'Encontre empresas reais e atualizadas diretamente do Google Maps com filtros de localização e segmento'
    },
    {
      icon: 'target',
      title: 'Filtros Precisos',
      description: 'Segmente sua busca por nicho, cidade ou região para atingir exatamente o público que você precisa'
    },
    {
      icon: 'zap',
      title: 'Prospecção Automatizada',
      description: 'Nossa plataforma faz o trabalho pesado de busca para você, organizando tudo em um só lugar'
    },
    {
      icon: 'layout',
      title: 'Gestão Organizada',
      description: 'Visualize seus leads de forma clara e intuitiva, facilitando o acompanhamento do seu funil de vendas'
    },
    {
      icon: 'bar-chart-3',
      title: 'Exportação Simples',
      description: 'Leve seus dados para onde quiser com exportação rápida para CSV'
    },
    {
      icon: 'shield-check',
      title: 'Dados em Tempo Real',
      description: 'Informações sempre atualizadas vindas da maior base de dados de empresas do mundo'
    }
  ];

  plans = [
    {
      name: 'Plano Mensal',
      price: 'R$ 97',
      period: '/mês',
      description: 'Ideal para validar seu processo de vendas',
      features: [
        '10.000 créditos de prospecção/mês',
        'Busca ilimitada no Google Maps',
        'Exportação CSV',
        'Suporte via e-mail',
        'Acesso completo à plataforma'
      ],
      highlighted: true
    },
    {
      name: 'Plano Anual',
      price: 'R$ 80,83',
      period: '/mês',
      description: 'Economia garantida para o ano todo',
      features: [
        '120.000 créditos de prospecção/ano',
        'Busca ilimitada no Google Maps',
        'Exportação CSV',
        'Suporte prioritário',
        'Acesso completo à plataforma',
        'Relatórios avançados'
      ],
      highlighted: false
    }
  ];

  testimonials = [
    {
      name: 'Carlos Mendes',
      role: 'Consultor de Vendas',
      company: 'Freelancer',
      content:
        'Aumentei minha lista de prospects em 300% no primeiro mês. O foco no Google Maps traz leads muito qualificados.',
      rating: 5
    },
    {
      name: 'Ana Silva',
      role: 'Founder',
      company: 'Digital Growth Agency',
      content:
        'Ferramenta essencial para nossa operação. Conseguimos encontrar e organizar leads locais de forma muito rápida.',
      rating: 5
    }
  ];

  stats = [
    { value: '100%', label: 'Dados do Google Maps' },
    { value: '24h', label: 'Plataforma Online' },
    { value: '98%', label: 'Precisão nos Dados' },
    { value: 'MVP', label: 'Versão Beta Ativa' }
  ];
}
