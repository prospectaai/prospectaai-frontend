import { Component, EventEmitter, HostBinding, HostListener, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabsComponent } from '../tabs/tabs.component';

@Component({
  selector: 'ui-tabs-trigger',
  imports: [CommonModule],
  template: '<ng-content></ng-content>',
   host: {
    '[class]': "'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50'",
    '[class.bg-background]': 'isActive',
    '[class.text-foreground]': 'isActive',
    '[class.data-[state=active]:bg-white]': 'true',
    '[class.data-[state=inactive]:bg-transparent]': 'true',
    '[class.data-[state=inactive]:hover:bg-muted/30]': 'true',
  },
  styleUrl: './tabs-trigger.component.css'
})
export class TabsTriggerComponent {
  @Input({ required: true }) value!: string;
  @Output() tabClick = new EventEmitter<string>();

  private tabs = inject(TabsComponent);

  @HostBinding('attr.data-state') get state() {
    return this.isActive ? 'active' : 'inactive';
  }

  get isActive(): boolean {
    return this.tabs.activeTab() === this.value;
  }

  @HostListener('click')
  onClick() {
    // Atualiza diretamente o valor ativo no componente pai
    this.tabs.setActive(this.value);
    // Emite o evento para quem estiver escutando
    this.tabClick.emit(this.value);
  }
}
