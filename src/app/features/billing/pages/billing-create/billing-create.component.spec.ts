import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillingCreateComponent } from './billing-create.component';

describe('BillingCreateComponent', () => {
  let component: BillingCreateComponent;
  let fixture: ComponentFixture<BillingCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BillingCreateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BillingCreateComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
