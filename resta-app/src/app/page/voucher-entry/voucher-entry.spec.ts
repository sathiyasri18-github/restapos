import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VoucherEntryComponent } from './voucher-entry.component';

describe('VoucherEntry', () => {
  let component: VoucherEntryComponent;
  let fixture: ComponentFixture<VoucherEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VoucherEntryComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(VoucherEntryComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
