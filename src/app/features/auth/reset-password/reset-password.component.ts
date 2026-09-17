import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LucideCircleAlert, LucideEye, LucideEyeOff, LucideLock } from '@lucide/angular';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    LucideLock,
    LucideEye,
    LucideEyeOff,
    LucideCircleAlert,
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: '../_auth-form.scss',
})
export class ResetPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  private readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';

  readonly loading = signal(false);
  readonly success = signal(false);
  readonly errorMessage = signal<string | null>(this.token ? null : 'auth.reset_password.error_invalid_token');
  readonly hidePassword = signal(true);

  readonly form = this.fb.nonNullable.group({
    new_password: ['', [Validators.required, Validators.minLength(8)]],
  });

  submit(): void {
    if (this.form.invalid || this.loading() || !this.token) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.auth.resetPassword(this.token, this.form.getRawValue().new_password).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(true);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('auth.reset_password.error_invalid_token');
      },
    });
  }
}
