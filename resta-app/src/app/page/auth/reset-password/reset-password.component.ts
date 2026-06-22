import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AppModule } from '../../../module/app.module';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  imports: [AppModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrls: ['../auth-shared.scss'],
  providers: [MessageService]
})
export class ResetPasswordComponent implements OnInit {
  token = '';
  password = '';
  confirmPassword = '';
  isLoading = false;
  errors: Record<string, string> = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
  }

  submit(): void {
    this.errors = {};
    if (!this.token.trim()) this.errors['token'] = 'Reset token is required.';
    if (!this.password || this.password.length < 6) this.errors['password'] = 'Password must be at least 6 characters.';
    if (this.password !== this.confirmPassword) this.errors['confirmPassword'] = 'Passwords do not match.';
    if (Object.keys(this.errors).length) return;

    this.isLoading = true;
    this.auth.resetPassword({
      token: this.token.trim(),
      password: this.password,
      confirmPassword: this.confirmPassword
    }).subscribe({
      next: (res) => {
        this.messageService.add({ severity: 'success', summary: 'Done', detail: res.message });
        this.router.navigate(['/sign-in']);
      },
      error: (err) => {
        this.isLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error ?? 'Reset failed.' });
      },
      complete: () => { this.isLoading = false; }
    });
  }
}
