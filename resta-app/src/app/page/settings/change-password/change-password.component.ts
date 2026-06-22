import { Component } from '@angular/core';
import { MessageService } from 'primeng/api';
import { AppModule } from '../../../module/app.module';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-change-password',
  imports: [AppModule],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss'],
  providers: [MessageService]
})
export class ChangePasswordComponent {
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  isLoading = false;
  errors: Record<string, string> = {};

  constructor(
    private auth: AuthService,
    private messageService: MessageService
  ) {}

  submit(): void {
    this.errors = {};
    if (!this.currentPassword) this.errors['currentPassword'] = 'Current password is required.';
    if (!this.newPassword || this.newPassword.length < 6) this.errors['newPassword'] = 'New password must be at least 6 characters.';
    if (this.newPassword !== this.confirmPassword) this.errors['confirmPassword'] = 'Passwords do not match.';
    if (Object.keys(this.errors).length) return;

    this.isLoading = true;
    this.auth.changePassword({
      currentPassword: this.currentPassword,
      newPassword: this.newPassword,
      confirmPassword: this.confirmPassword
    }).subscribe({
      next: (res) => {
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.messageService.add({ severity: 'success', summary: 'Success', detail: res.message });
      },
      error: (err) => {
        this.isLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error ?? 'Could not change password.' });
      },
      complete: () => { this.isLoading = false; }
    });
  }
}
