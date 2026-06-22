import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SaleComponent } from './sale.component';

describe('SaleComponent', () => {
  let component: SaleComponent;
  let fixture: ComponentFixture<SaleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SaleComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
