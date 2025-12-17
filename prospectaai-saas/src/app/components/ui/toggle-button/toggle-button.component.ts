import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'ui-toggle-button',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './toggle-button.component.html',
  styleUrl: './toggle-button.component.css'
})
export class ToggleButtonComponent {
  @Input() active = false;
  @Input() onLabel = '';
  @Input() offLabel = '';
  @Input() size: 'default' | 'sm' | 'lg' | 'icon' = 'default';
}
