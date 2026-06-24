import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MetaTypeComponent } from './meta-type-component';

describe('MetaTypeComponent', () => {
  let component: MetaTypeComponent;
  let fixture: ComponentFixture<MetaTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetaTypeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MetaTypeComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
