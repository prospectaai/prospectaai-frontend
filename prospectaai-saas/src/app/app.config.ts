import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { ArrowRight, ArrowLeft, BarChart3, Building2, Calendar, Check, ChevronDown, ChevronUp, Chrome, CreditCard, Download, ExternalLink, Filter, Github, Globe, Key, Lock, LucideAngularModule, Mail, MapPin, Menu, Phone, RectangleGogglesIcon, Search, Settings, Star, Target, TrendingUp, User, Users, X, Zap, AlertTriangle, Info, CheckCircle, XCircle, Package, DollarSign, Clock, Loader2, CheckCircle2, Headphones, RotateCcw, Moon, Sun } from 'lucide-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch()),
    importProvidersFrom(
      LucideAngularModule.pick({
        Globe, Users, Zap, Target, BarChart3, Mail, TrendingUp, Check, Star, User, Lock,
        ArrowRight, MapPin, Calendar, ChevronDown, ChevronUp, Search, Building2, Filter, Menu,
        Settings, Download, Phone, ExternalLink, Github, Chrome, CreditCard, Key, X, AlertTriangle, Info,
        ArrowLeft, CheckCircle, XCircle, Package, DollarSign, Clock, Loader2, CheckCircle2, Headphones, RotateCcw,
        Moon, Sun
      })
    )
  ]
};
