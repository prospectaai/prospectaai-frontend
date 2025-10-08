import { NgClass } from '@angular/common';
import { Component, computed, Input } from '@angular/core';

@Component({
  selector: 'ui-card-title',
  imports: [NgClass],
  templateUrl: './card-title.component.html',
  styleUrl: './card-title.component.css'
})
export class CardTitleComponent {
  @Input() className = '';

  classes = computed(() =>
    `text-2xl font-semibold leading-none tracking-tight ${this.className}`.trim()
  );
}
