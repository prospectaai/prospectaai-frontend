import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ButtonComponent } from "../../../components/ui/button/button.component";
import { BadgeComponent } from "../../../components/ui/badge/badge.component";
import { CardComponent } from "../../../components/ui/card/card.component";
import { CardContentComponent } from "../../../components/ui/card-content/card-content.component";
import { RouterLink } from '@angular/router';


@Component({
  selector: 'page-landing-page',
  imports: [
    CommonModule,
    ButtonComponent,
    LucideAngularModule,
    BadgeComponent,
    CardComponent,
    CardContentComponent,
    RouterLink
],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.css'
})
export class LandingPageComponent {

 features = [
    {
      icon: 'globe',
      title: 'Busca Automática no Google Maps',
      description: 'Encontre empresas usando Google Places API com filtros avançados de localização e segmento'
    },
    {
      icon: 'users',
      title: 'Integração LinkedIn e Instagram',
      description: 'Colete dados públicos de redes sociais para enriquecer seu banco de prospects'
    },
    {
      icon: 'zap',
      title: 'Automação com n8n',
      description: 'Configure buscas periódicas e receba atualizações automáticas sem esforço manual'
    },
    {
      icon: 'target',
      title: 'Filtros Inteligentes',
      description: 'Segmente por setor, tamanho, localização e outros critérios relevantes'
    },
    {
      icon: 'bar-chart-3',
      title: 'Exportação Flexível',
      description: 'Exporte para CSV, Google Sheets ou integre diretamente com seu CRM'
    },
    {
      icon: 'mail',
      title: 'Relatórios Automáticos',
      description: 'Receba atualizações e novos resultados diretamente por email'
    }
  ];

  plans = [
    {
      name: 'Starter',
      price: 'R$ 97',
      period: '/mês',
      description: 'Perfeito para freelancers e autônomos',
      features: ['500 empresas/mês', 'Busca no Google Maps', 'Exportação CSV', 'Suporte por email', '1 usuário'],
      highlighted: false
    },
    {
      name: 'Professional',
      price: 'R$ 197',
      period: '/mês',
      description: 'Ideal para agências e equipes',
      features: [
        '2.000 empresas/mês',
        'Google Maps + LinkedIn',
        'Exportação CSV e Google Sheets',
        'Integração com CRMs',
        'Até 5 usuários',
        'Suporte prioritário'
      ],
      highlighted: true
    },
    {
      name: 'Enterprise',
      price: 'R$ 497',
      period: '/mês',
      description: 'Para empresas que precisam escalar',
      features: [
        '10.000 empresas/mês',
        'Todas as integrações',
        'API dedicada',
        'Usuários ilimitados',
        'Automações personalizadas',
        'Suporte 24/7',
        'Onboarding dedicado'
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
        'Aumentei minha lista de prospects em 300% no primeiro mês. A automação me economiza horas de trabalho manual.',
      rating: 5
    },
    {
      name: 'Ana Silva',
      role: 'Founder',
      company: 'Digital Growth Agency',
      content:
        'Ferramenta essencial para nossa operação. Conseguimos encontrar e qualificar leads muito mais rápido.',
      rating: 5
    },
    {
      name: 'Roberto Costa',
      role: 'Head of Sales',
      company: 'TechSolutions',
      content:
        'O ROI foi imediato. Em uma semana já tínhamos recuperado o investimento com os novos clientes prospectados.',
      rating: 5
    }
  ];

  stats = [
    { value: '10M+', label: 'Empresas no banco de dados' },
    { value: '5.000+', label: 'Usuários ativos' },
    { value: '98%', label: 'Taxa de satisfação' },
    { value: '24/7', label: 'Automação contínua' }
  ];
}
