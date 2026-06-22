import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HrmSettingComponent } from './hrm-setting.component';

describe('HrmSetting', () => {
  let component: HrmSettingComponent;
  let fixture: ComponentFixture<HrmSettingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HrmSettingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HrmSettingComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
