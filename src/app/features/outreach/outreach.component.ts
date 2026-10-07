import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LucideMail, LucideSend, LucideTrash2 } from '@lucide/angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from '../../core/i18n/supported-languages';
import { SendQuota, Suggestion, TargetCompany } from '../../core/models/outreach.model';
import { OutreachService } from '../../core/services/outreach.service';
import { ProfileService } from '../../core/services/profile.service';

@Component({
  selector: 'app-outreach',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    LucideMail,
    LucideSend,
    LucideTrash2,
  ],
  templateUrl: './outreach.component.html',
  styleUrl: './outreach.component.scss',
})
export class OutreachComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly outreach = inject(OutreachService);
  private readonly profile = inject(ProfileService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);

  readonly languages = SUPPORTED_LANGUAGES;
  readonly languageLabels = LANGUAGE_LABELS;

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly sendingIds = signal<Set<string>>(new Set());
  readonly sendingAll = signal(false);
  readonly targets = signal<TargetCompany[]>([]);
  readonly quota = signal<SendQuota | null>(null);
  readonly paused = signal(false);
  readonly autopiloting = signal(false);
  readonly suggestions = signal<Suggestion[]>([]);
  readonly loadingSuggestions = signal(false);

  readonly sendable = computed(() => this.targets().filter((t) => t.can_send));

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    language: ['es'],
    tags: [''],
  });

  ngOnInit(): void {
    this.load();
    this.profile.getProfile().subscribe({
      next: (user) => this.paused.set(user.auto_outreach_paused),
    });
  }

  load(): void {
    this.loading.set(true);
    this.outreach.list().subscribe({
      next: (targets) => {
        this.targets.set(targets);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.outreach.quota().subscribe({ next: (quota) => this.quota.set(quota) });
    this.loadingSuggestions.set(true);
    this.outreach.suggestions().subscribe({
      next: (result) => {
        this.suggestions.set([...result.from_offers, ...result.from_hn]);
        this.loadingSuggestions.set(false);
      },
      error: () => this.loadingSuggestions.set(false),
    });
  }

  add(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const raw = this.form.getRawValue();
    const tags = (raw.tags ?? '').split(',').map((t) => t.trim()).filter((t) => t.length > 0);
    this.outreach
      .create({ name: raw.name!.trim(), email: raw.email!.trim(), language: raw.language ?? 'es', tags })
      .subscribe({
        next: (target) => {
          this.saving.set(false);
          this.form.reset({ name: '', email: '', language: 'es', tags: '' });
          this.targets.update((current) => [...current, target].sort((a, b) => a.name.localeCompare(b.name)));
          this.notify('outreach.added');
        },
        error: (err: { status?: number }) => {
          this.saving.set(false);
          this.notify(err.status === 409 ? 'outreach.error_duplicate' : 'common.error_generic');
        },
      });
  }

  remove(target: TargetCompany): void {
    this.outreach.remove(target.id).subscribe({
      next: () => {
        this.targets.update((current) => current.filter((t) => t.id !== target.id));
        this.notify('outreach.removed');
      },
      error: () => this.notify('common.error_generic'),
    });
  }

  send(target: TargetCompany): void {
    if (!target.can_send || this.sendingIds().has(target.id)) return;
    this.sendingIds.update((ids) => new Set(ids).add(target.id));
    this.outreach.send(target.id).subscribe({
      next: (result) => {
        this.finishSending(target.id);
        this.notify('outreach.sent', { email: result.sent_to });
        this.load();
      },
      error: (err: { status?: number }) => {
        this.finishSending(target.id);
        this.notify(
          err.status === 429 ? 'send_cv.error_limit' : err.status === 503 ? 'send_cv.error_config' : 'common.error_generic'
        );
        this.load();
      },
    });
  }

  sendAll(): void {
    const ids = this.sendable().map((t) => t.id);
    if (ids.length === 0 || this.sendingAll()) return;
    this.sendingAll.set(true);
    this.outreach.sendBulk(ids).subscribe({
      next: (result) => {
        this.sendingAll.set(false);
        const ok = result.sent.filter((r) => r.ok).length;
        this.notify('outreach.bulk_done', { ok, total: result.sent.length });
        this.load();
      },
      error: () => {
        this.sendingAll.set(false);
        this.notify('common.error_generic');
      },
    });
  }

  togglePaused(): void {
    const next = !this.paused();
    this.profile.updateProfile({ auto_outreach_paused: next }).subscribe({
      next: () => {
        this.paused.set(next);
        this.notify(next ? 'outreach.paused' : 'outreach.resumed');
      },
      error: () => this.notify('common.error_generic'),
    });
  }

  runAutopilot(): void {
    if (this.autopiloting() || this.paused()) return;
    this.autopiloting.set(true);
    this.outreach.autopilot(5).subscribe({
      next: (result) => {
        this.autopiloting.set(false);
        const ok = result.sent.filter((r) => r.ok).length;
        this.notify('outreach.autopilot_done', { ok, skipped: result.skipped });
        this.load();
      },
      error: (err: { status?: number }) => {
        this.autopiloting.set(false);
        this.notify(
          err.status === 409
            ? 'outreach.autopilot_paused'
            : err.status === 503
              ? 'send_cv.error_config'
              : 'common.error_generic'
        );
      },
    });
  }

  importSuggestion(suggestion: Suggestion): void {
    this.outreach.importSuggestions([suggestion]).subscribe({
      next: (result) => {
        this.notify('outreach.imported', { count: result.imported });
        this.load();
      },
      error: () => this.notify('common.error_generic'),
    });
  }

  importAllSuggestions(): void {
    const items = this.suggestions();
    if (items.length === 0) return;
    this.outreach.importSuggestions(items).subscribe({
      next: (result) => {
        this.notify('outreach.imported', { count: result.imported });
        this.load();
      },
      error: () => this.notify('common.error_generic'),
    });
  }

  private finishSending(id: string): void {
    this.sendingIds.update((ids) => {
      const next = new Set(ids);
      next.delete(id);
      return next;
    });
  }

  private notify(key: string, params?: Record<string, unknown>): void {
    this.translate.get(key, params).subscribe((msg) => this.snackBar.open(msg, undefined, { duration: 4000 }));
  }
}
