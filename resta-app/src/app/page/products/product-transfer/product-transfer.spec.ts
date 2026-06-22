import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductTransferComponent } from './product-transfer.component';

describe('ProductTransfer', () => {
  let component: ProductTransferComponent;
  let fixture: ComponentFixture<ProductTransferComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductTransferComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductTransferComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
