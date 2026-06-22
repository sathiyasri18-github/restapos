import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PosSettingComponent } from './pos-setting.component';

describe('PosSetting', () => {
  let component: PosSettingComponent;
  let fixture: ComponentFixture<PosSettingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PosSettingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PosSettingComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
