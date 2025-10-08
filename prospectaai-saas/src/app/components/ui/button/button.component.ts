import { Component, computed, EventEmitter, Input, Output } from '@angular/core';

type ButtonVariant =
  | 'default'
  | 'destructive'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'link';

type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

@Component({
  selector: 'ui-button',
  imports: [],
  templateUrl: './button.component.html',
  styleUrl: './button.component.css'
})
export class ButtonComponent {
  /** Variante de estilo (equivalente ao `variant` no React) */
  @Input() variant:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link' = 'default';

  /** Tamanho do botão (equivalente ao `size` no React) */
  @Input() size: 'default' | 'sm' | 'lg' | 'icon' = 'default';

  /** Tipo do botão */
  @Input() type: 'button' | 'submit' | 'reset' = 'button';

  /** Desabilitado */
  @Input() disabled: boolean = false;

  /** Classe extra opcional */
  @Input() className: string = '';

  /** Evento de clique */
  @Output() onClick = new EventEmitter<Event>();

  /** Classes finais calculadas dinamicamente */
  get buttonClass(): string {
    const base =
      'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors ' +
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ' +
      'disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0';

    const variants: Record<string, string> = {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      link: 'text-primary underline-offset-4 hover:underline',
    };

    const sizes: Record<string, string> = {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 rounded-md px-3',
      lg: 'h-11 rounded-md px-8',
      icon: 'h-10 w-10',
    };

    return `${base} ${variants[this.variant]} ${sizes[this.size]} ${this.className}`;
  }
}
