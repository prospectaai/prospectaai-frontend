import { NgClass } from '@angular/common';
import { Component, computed, Input } from '@angular/core';

@Component({
  selector: 'ui-card-header',
  imports: [NgClass],
  templateUrl: './card-header.component.html',
  styleUrl: './card-header.component.css'
})
export class CardHeaderComponent {
  @Input() className = '';

  classes = computed(() =>
    `flex flex-col space-y-1.5 p-6 ${this.className}`.trim()
  );
}
