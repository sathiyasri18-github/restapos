import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StockCountComponent } from './stock-count.component';

describe('StockCount', () => {
  let component: StockCountComponent;
  let fixture: ComponentFixture<StockCountComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StockCountComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StockCountComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
