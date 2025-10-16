import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SaasMainLayoutComponent } from './saas-main-layout.component';

describe('SaasMainLayoutComponent', () => {
  let component: SaasMainLayoutComponent;
  let fixture: ComponentFixture<SaasMainLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaasMainLayoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SaasMainLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
