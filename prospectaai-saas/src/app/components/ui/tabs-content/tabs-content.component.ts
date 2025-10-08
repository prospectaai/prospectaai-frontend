import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { TabsComponent } from '../tabs/tabs.component';

@Component({
  selector: 'ui-tabs-content',
  imports: [CommonModule],
  templateUrl: './tabs-content.component.html',
  styleUrl: './tabs-content.component.css'
})
export class TabsContentComponent {
  @Input({ required: true }) value!: string;
  private tabs = inject(TabsComponent);

  get isActive(): boolean {
    return this.tabs.activeTab() === this.value;
  }
}
