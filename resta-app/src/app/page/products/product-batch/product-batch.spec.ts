import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductBatchComponent } from './product-batch.component';

describe('ProductBatch', () => {
  let component: ProductBatchComponent;
  let fixture: ComponentFixture<ProductBatchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductBatchComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductBatchComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
