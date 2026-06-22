import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductWarehouseComponent } from './product-warehouse.component';

describe('ProductWarehouse', () => {
  let component: ProductWarehouseComponent;
  let fixture: ComponentFixture<ProductWarehouseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductWarehouseComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductWarehouseComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
