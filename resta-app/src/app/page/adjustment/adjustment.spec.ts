import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdjustmentComponent } from './adjustment.component';

describe('Adjustment', () => {
  let component: AdjustmentComponent;
  let fixture: ComponentFixture<AdjustmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdjustmentComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdjustmentComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
