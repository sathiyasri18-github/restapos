import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RewardPointSettingComponent } from './reward-point-setting.component';

describe('RewardPointSetting', () => {
  let component: RewardPointSettingComponent;
  let fixture: ComponentFixture<RewardPointSettingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RewardPointSettingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RewardPointSettingComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
