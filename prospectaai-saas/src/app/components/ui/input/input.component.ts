import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-input',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './input.component.html',
  styleUrl: './input.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ]
})
export class InputComponent implements ControlValueAccessor {
  /** Tipo do input (text, email, password...) */
  @Input() type: string = 'text';

  /** Placeholder do input */
  @Input() placeholder: string = '';

  /** Valor do input */
  value: string = '';

  /** Desabilitado */
  @Input() disabled: boolean = false;

  /** Classes adicionais (equivalente ao className do React) */
  @Input() className: string = '';

  /** Funções de callback para o ControlValueAccessor */
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  /** Implementação do ControlValueAccessor */
  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  /** Evento de input */
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.value = input.value;
    this.onChange(this.value);
    this.onTouched();
  }
}
