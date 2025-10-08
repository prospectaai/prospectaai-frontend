import { NgClass } from '@angular/common';
import { Component, computed, Input } from '@angular/core';

@Component({
  selector: 'ui-card',
  imports: [NgClass],
  templateUrl: './card.component.html',
  styleUrl: './card.component.css'
})
export class CardComponent {
  @Input() className = '';

  classes = computed(() =>
    `rounded-lg border bg-card text-card-foreground shadow-sm ${this.className}`.trim()
  );
}
