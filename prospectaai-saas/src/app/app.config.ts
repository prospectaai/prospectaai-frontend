import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { ArrowRight, BarChart3, Building2, Calendar, Check, ChevronDown, ChevronUp, Filter, Globe, Lock, LucideAngularModule, Mail, MapPin, Search, Star, Target, TrendingUp, User, Users, Zap } from 'lucide-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    importProvidersFrom(
      LucideAngularModule.pick({
        Globe, Users, Zap, Target, BarChart3, Mail, TrendingUp, Check, Star, User, Lock,
        ArrowRight, MapPin, Calendar, ChevronDown, ChevronUp, Search, Building2, Filter
      })
    )
  ]
};
