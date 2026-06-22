import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountHeadComponent } from './account-head.component';

describe('AccountHead', () => {
  let component: AccountHeadComponent;
  let fixture: ComponentFixture<AccountHeadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountHeadComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountHeadComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
