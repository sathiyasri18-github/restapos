import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ServiceCallDashboardComponent } from './service-call-dashboard.component';

describe('ServiceCallDashboardComponent', () => {
  let component: ServiceCallDashboardComponent;
  let fixture: ComponentFixture<ServiceCallDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceCallDashboardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ServiceCallDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
