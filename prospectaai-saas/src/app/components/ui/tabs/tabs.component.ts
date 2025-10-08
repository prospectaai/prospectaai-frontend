import { Component, ContentChildren, Input, QueryList, AfterContentInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabsTriggerComponent } from '../tabs-trigger/tabs-trigger.component';

@Component({
  selector: 'ui-tabs',
  imports: [CommonModule],
  template: '<ng-content></ng-content>',
  styleUrl: './tabs.component.css'
})
export class TabsComponent implements AfterContentInit  {
  @Input() defaultValue?: string;
  activeTab = signal<string | null>(null);

  @ContentChildren(TabsTriggerComponent) triggers!: QueryList<TabsTriggerComponent>;

  ngAfterContentInit() {
    if (this.defaultValue) {
      this.setActive(this.defaultValue);
    } else if (this.triggers.first) {
      this.setActive(this.triggers.first.value);
    }

    this.triggers.forEach(trigger => {
      trigger.tabClick.subscribe(val => this.setActive(val));
    });
  }

  setActive(value: string) {
    this.activeTab.set(value);
  }
}
