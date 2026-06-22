import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VariantComponent } from './variant.component';

describe('Variant', () => {
  let component: VariantComponent;
  let fixture: ComponentFixture<VariantComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [VariantComponent] }).compileComponents();
    fixture = TestBed.createComponent(VariantComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
