import { NgClass } from '@angular/common';
import { Component, computed, Input } from '@angular/core';

@Component({
  selector: 'ui-card-footer',
  imports: [NgClass],
  templateUrl: './card-footer.component.html',
  styleUrl: './card-footer.component.css'
})
export class CardFooterComponent {
  @Input() className = '';

  classes = computed(() =>
    `flex items-center p-6 pt-0 ${this.className}`.trim()
  );
}
