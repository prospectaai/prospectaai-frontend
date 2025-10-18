import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, ReactiveFormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'ui-select',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, ReactiveFormsModule],
  templateUrl: './select.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: SelectComponent,
      multi: true
    }
  ]
})
export class SelectComponent implements ControlValueAccessor {
  @Input() options: string[] = [];
  @Input() placeholder = 'Selecione...';
  @Input() value: string | null = null;
  @Output() valueChange = new EventEmitter<string>();

  open = false;
  disabled = false;

  // Funções do ControlValueAccessor
  onChange = (_: any) => {};
  onTouched = () => {};

  toggleDropdown() {
    if (!this.disabled) {
      this.open = !this.open;
      this.onTouched();
    }
  }

  selectOption(option: string) {
    this.value = option;
    this.valueChange.emit(option);
    this.onChange(option);
    this.onTouched();
    this.open = false;
  }

  // Implementação de ControlValueAccessor
  writeValue(value: string | null): void {
    this.value = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('ui-select')) {
      this.open = false;
    }
  }
}
