import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductUnitComponent } from './product-unit.component';

describe('ProductUnit', () => {
  let component: ProductUnitComponent;
  let fixture: ComponentFixture<ProductUnitComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ProductUnitComponent] }).compileComponents();
    fixture = TestBed.createComponent(ProductUnitComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
