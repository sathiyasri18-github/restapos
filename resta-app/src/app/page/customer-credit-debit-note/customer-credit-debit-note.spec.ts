import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerCreditDebitNoteComponent } from './customer-credit-debit-note.component';

describe('CustomerCreditDebitNote', () => {
  let component: CustomerCreditDebitNoteComponent;
  let fixture: ComponentFixture<CustomerCreditDebitNoteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerCreditDebitNoteComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerCreditDebitNoteComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
