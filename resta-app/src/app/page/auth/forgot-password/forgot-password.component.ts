import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AppModule } from '../../../module/app.module';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  imports: [AppModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['../auth-shared.scss'],
  providers: [MessageService]
})
export class ForgotPasswordComponent {
  email = '';
  isLoading = false;
  submitted = false;
  devResetToken: string | null = null;
  error = '';

  constructor(
    private auth: AuthService,
    private messageService: MessageService
  ) {}

  submit(): void {
    this.error = '';
    if (!this.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      this.error = 'Valid email is required.';
      return;
    }

    this.isLoading = true;
    this.auth.forgotPassword({ email: this.email.trim() }).subscribe({
      next: (res) => {
        this.submitted = true;
        this.devResetToken = res.resetToken ?? null;
        this.messageService.add({ severity: 'info', summary: 'Request sent', detail: res.message });
      },
      error: (err) => {
        this.isLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error ?? 'Request failed.' });
      },
      complete: () => { this.isLoading = false; }
    });
  }
}
