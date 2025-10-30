import { NgClass } from '@angular/common';
import { Component, computed, Input } from '@angular/core';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';
type BadgeSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'ui-badge',
  imports: [NgClass],
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.css'
})
export class BadgeComponent {
  @Input() variant: BadgeVariant = 'default';
  @Input() className = '';
  @Input() size: BadgeSize = 'md';

  private variantClasses: Record<BadgeVariant, string> = {
    default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
    secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
    outline: 'text-foreground border',
  };

  private sizeClasses: Record<BadgeSize, string> = {
    xs: 'text-xs px-2 py-0.5',
    sm: 'text-sm px-2.5 py-1',
    md: 'text-base px-3 py-2',
    lg: 'text-lg px-4 py-2.5',
    xl: 'text-xl px-5 py-3',
  };

  classes = computed(() => {
    return `${this.variantClasses[this.variant]} ${this.sizeClasses[this.size]} ${this.className}`.trim();
  });
}
