import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryTypeComponent } from './category-type-component';

describe('CategoryTypeComponent', () => {
  let component: CategoryTypeComponent;
  let fixture: ComponentFixture<CategoryTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryTypeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryTypeComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
