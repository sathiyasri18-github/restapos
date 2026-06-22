import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpenseCategoryComponent } from './expense-category.component';

describe('ExpenseCategory', () => {
  let component: ExpenseCategoryComponent;
  let fixture: ComponentFixture<ExpenseCategoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpenseCategoryComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ExpenseCategoryComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
