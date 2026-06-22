import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WarehouseComponent } from './warehouse.component';

describe('Warehouse', () => {
  let component: WarehouseComponent;
  let fixture: ComponentFixture<WarehouseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WarehouseComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WarehouseComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
