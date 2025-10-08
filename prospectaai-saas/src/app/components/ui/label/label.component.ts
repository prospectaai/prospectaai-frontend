import { Component, Input } from '@angular/core';

@Component({
  selector: 'ui-label',
  imports: [],
  templateUrl: './label.component.html',
  styleUrl: './label.component.css'
})
export class LabelComponent {
  /**
   * Id do input associado ao label (equivalente ao "htmlFor" do React)
   */
  @Input() for?: string;

  /**
   * Classes adicionais (equivalente ao className do React)
   */
  @Input() className = '';
}
