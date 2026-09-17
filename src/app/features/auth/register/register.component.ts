import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LucideCircleAlert, LucideEye, LucideEyeOff, LucideLock, LucideMail, LucideUser } from '@lucide/angular';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    LucideMail,
    LucideLock,
    LucideUser,
    LucideEye,
    LucideEyeOff,
    LucideCircleAlert,
  ],
  templateUrl: './register.component.html',
  styleUrl: '../_auth-form.scss',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly hidePassword = signal(true);

  readonly form = this.fb.nonNullable.group({
    full_name: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  submit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const { full_name, email, password } = this.form.getRawValue();

    this.auth.register({ email, password, full_name: full_name || undefined }).subscribe({
      next: () => {
        this.auth.login({ email, password }).subscribe({
          next: () => this.router.navigate(['/profile'], { queryParams: { welcome: 1 } }),
          error: () => this.router.navigate(['/auth/login']),
        });
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(err.status === 409 ? 'auth.register.error_email_taken' : 'common.error_generic');
      },
    });
  }
}
