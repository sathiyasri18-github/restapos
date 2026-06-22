import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CallLog } from './call-log.component';

describe('CallLog', () => {
  let component: CallLog;
  let fixture: ComponentFixture<CallLog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CallLog],
    }).compileComponents();

    fixture = TestBed.createComponent(CallLog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
