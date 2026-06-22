import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeneralSettingComponent } from './general-setting.component';

describe('GeneralSetting', () => {
  let component: GeneralSettingComponent;
  let fixture: ComponentFixture<GeneralSettingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GeneralSettingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GeneralSettingComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
