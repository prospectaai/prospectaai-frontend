import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UiEventsService {
  private prospectionProcessed$ = new Subject<void>();

  onProspectionProcessed(): Observable<void> {
    return this.prospectionProcessed$.asObservable();
  }

  emitProspectionProcessed(): void {
    this.prospectionProcessed$.next();
  }
}
