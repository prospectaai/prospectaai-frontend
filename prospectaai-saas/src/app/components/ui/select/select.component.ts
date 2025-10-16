import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'ui-select',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './select.component.html',
})
export class SelectComponent {
  @Input() options: string[] = [];
  @Input() placeholder = 'Selecione...';
  @Input() value: string | null = null;
  @Output() valueChange = new EventEmitter<string>();

  open = false;

  toggleDropdown() {
    this.open = !this.open;
  }

  selectOption(option: string) {
    this.value = option;
    this.valueChange.emit(option);
    this.open = false;
  }

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('ui-select')) {
      this.open = false;
    }
  }
}
