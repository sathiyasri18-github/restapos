import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaxComponent } from './tax.component';

describe('Tax', () => {
  let component: TaxComponent;
  let fixture: ComponentFixture<TaxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TaxComponent] }).compileComponents();
    fixture = TestBed.createComponent(TaxComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
