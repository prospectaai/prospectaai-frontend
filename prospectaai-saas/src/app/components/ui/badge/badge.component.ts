import { NgClass } from '@angular/common';
import { Component, computed, Input } from '@angular/core';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

@Component({
  selector: 'ui-badge',
  imports: [NgClass],
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.css'
})
export class BadgeComponent {
  @Input() variant: BadgeVariant = 'default';
  @Input() className = '';

  private variantClasses: Record<BadgeVariant, string> = {
    default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
    secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
    outline: 'text-foreground border',
  };

  classes = computed(() => {
    return `${this.variantClasses[this.variant]} ${this.className}`.trim();
  });
}
