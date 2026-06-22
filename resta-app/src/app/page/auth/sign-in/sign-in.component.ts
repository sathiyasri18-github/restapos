import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AppModule } from '../../../module/app.module';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-sign-in',
  imports: [AppModule, RouterLink],
  templateUrl: './sign-in.component.html',
  styleUrls: ['../auth-shared.scss', './sign-in.component.scss'],
  providers: [MessageService]
})
export class SignInComponent {
  userName = '';
  password = '';
  isLoading = false;
  errors: { userName?: string; password?: string } = {};

  constructor(
    private auth: AuthService,
    private router: Router,
    private messageService: MessageService
  ) {}

  submit(): void {
    this.errors = {};
    if (!this.userName.trim()) this.errors.userName = 'User name is required.';
    if (!this.password) this.errors.password = 'Password is required.';
    if (Object.keys(this.errors).length) return;

    this.isLoading = true;
    this.auth.signIn({ userName: this.userName.trim(), password: this.password }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Welcome', detail: 'Signed in successfully.' });
        this.router.navigate(['/service-call-dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err?.error?.error ?? err?.error ?? 'Sign in failed.';
        this.messageService.add({ severity: 'error', summary: 'Error', detail: typeof msg === 'string' ? msg : 'Invalid credentials.' });
      },
      complete: () => { this.isLoading = false; }
    });
  }
}
