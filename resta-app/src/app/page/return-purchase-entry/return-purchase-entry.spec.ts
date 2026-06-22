import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';

import { ReturnPurchaseEntryComponent } from './return-purchase-entry.component';

describe('ReturnPurchaseEntryComponent', () => {
  let component: ReturnPurchaseEntryComponent;
  let fixture: ComponentFixture<ReturnPurchaseEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReturnPurchaseEntryComponent],
      providers: [provideRouter([]), provideHttpClient(), MessageService],
    }).compileComponents();

    fixture = TestBed.createComponent(ReturnPurchaseEntryComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
