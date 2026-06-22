import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BrandComponent } from './brand.component';

describe('Brand', () => {
  let component: BrandComponent;
  let fixture: ComponentFixture<BrandComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrandComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BrandComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
