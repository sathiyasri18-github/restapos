import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupplierCreditDebitNoteComponent } from './supplier-credit-debit-note.component';

describe('SupplierCreditDebitNote', () => {
  let component: SupplierCreditDebitNoteComponent;
  let fixture: ComponentFixture<SupplierCreditDebitNoteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupplierCreditDebitNoteComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SupplierCreditDebitNoteComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
