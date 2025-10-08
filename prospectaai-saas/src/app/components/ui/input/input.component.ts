import { Component, Input } from '@angular/core';

@Component({
  selector: 'ui-input',
  imports: [],
  templateUrl: './input.component.html',
  styleUrl: './input.component.css'
})
export class InputComponent {
  /** Tipo do input (text, email, password...) */
  @Input() type: string = 'text';

  /** Placeholder do input */
  @Input() placeholder: string = '';

  /** Valor inicial */
  @Input() value: string = '';

  /** Desabilitado */
  @Input() disabled: boolean = false;

  /** Classes adicionais (equivalente ao className do React) */
  @Input() className: string = '';

  /** Evento de input — opcional se quiser trabalhar com two-way binding */
  onInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.value = input.value;
  }
}
