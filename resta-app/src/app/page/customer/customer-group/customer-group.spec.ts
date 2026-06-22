import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerGroupComponent } from './customer-group.component';

describe('CustomerGroupComponent', () => {
  let component: CustomerGroupComponent;
  let fixture: ComponentFixture<CustomerGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerGroupComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerGroupComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
