import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { retry } from 'rxjs';

import { environment } from '../../../environments/environment';

// 3s used to feel like a dead page on a cold start: the demo button showed its own spinner
// immediately, but nothing explained *why* it was slow until this banner caught up seconds
// later. A healthy /warmup answers in well under a second, so this can be short without
// flashing the banner on every normal load.
/** Show the banner only if the server has not answered after this long (a healthy one is faster). */
export const WAKE_BANNER_DELAY_MS = 800;
const RETRY_DELAY_MS = 3000;
const MAX_RETRIES = 40; // about two minutes: more than a cold start of the free hosting plan

/**
 * The free hosting plan puts the API to sleep after a while without traffic, and the first request
 * can take close to a minute. This pings /warmup when the app starts (which also wakes it up)
 * and shows a banner if the wait is noticeable.
 *
 * Deliberately not /health: some ad blockers and antivirus web shields treat that name as a
 * tracking/telemetry beacon and silently drop the request (net::ERR_BLOCKED_BY_CLIENT), which
 * would stall this check forever. /warmup is a second endpoint with the same trivial handler -
 * /health stays untouched because Render's own health check is pointed at it.
 */
@Injectable({ providedIn: 'root' })
export class ServerWakeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;
  private readonly wakingState = signal(false);

  /** True while the server is not answering and the wait is long enough to be worth a message. */
  readonly waking = this.wakingState.asReadonly();

  /** Fire and forget: never blocks the first render. */
  start(): void {
    const timer = setTimeout(() => this.wakingState.set(true), WAKE_BANNER_DELAY_MS);
    const finish = () => {
      clearTimeout(timer);
      this.wakingState.set(false);
    };
    this.http
      .get(`${this.baseUrl}/warmup`)
      .pipe(retry({ count: MAX_RETRIES, delay: RETRY_DELAY_MS }))
      .subscribe({ next: finish, error: finish });
  }
}
