import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { ServerWakeService, WAKE_BANNER_DELAY_MS } from './server-wake.service';

const WARMUP = `${environment.apiUrl}/warmup`;

function setup() {
  TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
  return {
    wake: TestBed.inject(ServerWakeService),
    backend: TestBed.inject(HttpTestingController),
  };
}

describe('ServerWakeService', () => {
  beforeEach(() => jasmine.clock().install());
  afterEach(() => jasmine.clock().uninstall());

  it('pings /warmup when the app starts (not /health: some ad blockers drop that one)', () => {
    const { wake, backend } = setup();

    wake.start();

    expect(backend.expectOne(WARMUP).request.method).toBe('GET');
  });

  it('shows no banner when the server answers quickly', () => {
    const { wake, backend } = setup();

    wake.start();
    jasmine.clock().tick(WAKE_BANNER_DELAY_MS - 1);
    backend.expectOne(WARMUP).flush({ status: 'ok' });
    jasmine.clock().tick(WAKE_BANNER_DELAY_MS * 2);

    expect(wake.waking()).toBe(false);
  });

  it('shows the banner once the wait passes 3 seconds, and hides it when the server answers', () => {
    const { wake, backend } = setup();

    wake.start();
    jasmine.clock().tick(WAKE_BANNER_DELAY_MS - 1);
    expect(wake.waking()).toBe(false);
    jasmine.clock().tick(1);
    expect(wake.waking()).toBe(true);

    backend.expectOne(WARMUP).flush({ status: 'ok' });

    expect(wake.waking()).toBe(false);
  });

  it('keeps trying while the server is still waking up', () => {
    const { wake, backend } = setup();

    wake.start();
    backend.expectOne(WARMUP).error(new ProgressEvent('error')); // the host is still asleep
    jasmine.clock().tick(3000);
    backend.expectOne(WARMUP).flush('gateway timeout', { status: 504, statusText: 'Timeout' });
    jasmine.clock().tick(3000);
    expect(wake.waking()).toBe(true);
    backend.expectOne(WARMUP).flush({ status: 'ok' });

    expect(wake.waking()).toBe(false);
  });
});
