import { NgClass } from '@angular/common';
import { Component, computed, Input } from '@angular/core';

@Component({
  selector: 'ui-card-content',
  imports: [NgClass],
  templateUrl: './card-content.component.html',
  styleUrl: './card-content.component.css'
})
export class CardContentComponent {
  @Input() className = '';

  classes = computed(() =>
    `p-6 pt-0 ${this.className}`.trim()
  );
}
