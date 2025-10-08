import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardComponent } from "../../../components/ui/card/card.component";
import { LucideAngularModule } from "lucide-angular";
import { CardHeaderComponent } from "../../../components/ui/card-header/card-header.component";
import { CardTitleComponent } from "../../../components/ui/card-title/card-title.component";
import { CardDescriptionComponent } from "../../../components/ui/card-description/card-description.component";
import { CardContentComponent } from "../../../components/ui/card-content/card-content.component";
import { TabsComponent } from "../../../components/ui/tabs/tabs.component";
import { TabsListComponent } from "../../../components/ui/tabs-list/tabs-list.component";
import { TabsTriggerComponent } from "../../../components/ui/tabs-trigger/tabs-trigger.component";
import { TabsContentComponent } from "../../../components/ui/tabs-content/tabs-content.component";
import { LabelComponent } from "../../../components/ui/label/label.component";
import { InputComponent } from "../../../components/ui/input/input.component";
import { ButtonComponent } from "../../../components/ui/button/button.component";

@Component({
  selector: 'page-login',
  imports: [
    RouterLink,
    CardComponent,
    LucideAngularModule,
    CardHeaderComponent,
    CardTitleComponent,
    CardDescriptionComponent,
    CardContentComponent,
    TabsComponent,
    TabsListComponent,
    TabsTriggerComponent,
    TabsContentComponent,
    LabelComponent,
    InputComponent,
    ButtonComponent
],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginPageComponent {
  isLoading = signal(false);

  async handleLogin(event: Event) {
    event.preventDefault();
    this.isLoading.set(true);
    // TODO: lógica real de login
    await new Promise((res) => setTimeout(res, 1000));
    this.isLoading.set(false);
  }

  async handleSignup(event: Event) {
    event.preventDefault();
    this.isLoading.set(true);
    // TODO: lógica real de cadastro
    await new Promise((res) => setTimeout(res, 1000));
    this.isLoading.set(false);
  }
}
