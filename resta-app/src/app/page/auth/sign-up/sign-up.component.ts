import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { catchError, of, switchMap } from 'rxjs';
import { AppModule } from '../../../module/app.module';
import { AuthService } from '../../../services/auth.service';
import { MenuService } from '../../../services/menu.service';

@Component({
  selector: 'app-sign-up',
  imports: [AppModule, RouterLink],
  templateUrl: './sign-up.component.html',
  styleUrls: ['../auth-shared.scss'],
  providers: [MessageService]
})
export class SignUpComponent {
  userName = '';
  displayName = '';
  email = '';
  password = '';
  confirmPassword = '';
  isLoading = false;
  errors: Record<string, string> = {};

  constructor(
    private auth: AuthService,
    private menuService: MenuService,
    private router: Router,
    private messageService: MessageService
  ) {}

  submit(): void {
    this.errors = {};
    if (!this.userName.trim()) this.errors['userName'] = 'User name is required.';
    if (!this.displayName.trim()) this.errors['displayName'] = 'Display name is required.';
    if (this.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) this.errors['email'] = 'Invalid email.';
    if (!this.password || this.password.length < 6) this.errors['password'] = 'Password must be at least 6 characters.';
    if (this.password !== this.confirmPassword) this.errors['confirmPassword'] = 'Passwords do not match.';
    if (Object.keys(this.errors).length) return;

    this.isLoading = true;
    this.auth.signUp({
      userName: this.userName.trim(),
      displayName: this.displayName.trim(),
      email: this.email.trim() || null,
      password: this.password,
      confirmPassword: this.confirmPassword
    }).pipe(
      switchMap(() => this.menuService.fetchAndCacheMyTree().pipe(catchError(() => of(null))))
    ).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Account created', detail: 'You are now signed in.' });
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err?.error ?? 'Sign up failed.';
        this.messageService.add({ severity: 'error', summary: 'Error', detail: typeof msg === 'string' ? msg : 'Could not create account.' });
      },
      complete: () => { this.isLoading = false; }
    });
  }
}
