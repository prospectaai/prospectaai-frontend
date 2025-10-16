import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'ui-slider',
  imports: [],
  templateUrl: './slider.component.html',
  styleUrl: './slider.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: SliderComponent,
      multi: true
    }
  ]
})
export class SliderComponent implements ControlValueAccessor {

  /** Valor atual do slider (ex: [10]) */
  @Input() value: number[] = [0];

  /** Valor mínimo e máximo */
  @Input() min = 0;
  @Input() max = 100;

  /** Passo de incremento */
  @Input() step = 1;

  /** Evento emitido ao alterar o valor */
  @Output() valueChange = new EventEmitter<number[]>();

  /** Atualiza o valor e emite evento */
  onInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const newValue = [parseInt(input.value, 10)];
    this.value = newValue;
    this.valueChange.emit(this.value);
  }

  /** Funções do ControlValueAccessor */
  onChange = (value: number[]) => {};
  onTouched = () => {};

  /** Escreve valor vindo do form control */
  writeValue(value: number[]): void {
    this.value = value || [this.min];
  }

  /** Registra função para propagar mudança */
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  /** Registra função de toque */
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  /** Calcula a largura da faixa preenchida */
  get rangeWidth() {
    const percent = ((this.value[0] - this.min) / (this.max - this.min)) * 100;
    return `${percent}%`;
  }

  /** Marca o campo como tocado ao interagir */
  @HostListener('blur')
  handleBlur() {
    this.onTouched();
  }
}
