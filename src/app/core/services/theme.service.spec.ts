import { TestBed } from '@angular/core/testing';

import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.removeAttribute('data-theme');
    TestBed.configureTestingModule({});
  });

  it('defaults to light when there is no stored preference and the OS prefers light', () => {
    spyOn(window, 'matchMedia').and.returnValue({ matches: false } as MediaQueryList);
    const service = TestBed.inject(ThemeService);
    expect(service.theme()).toBe('light');
    expect(document.body.getAttribute('data-theme')).toBe('light');
  });

  it('respects a stored preference over the OS setting', () => {
    localStorage.setItem('postulare-theme', 'dark');
    spyOn(window, 'matchMedia').and.returnValue({ matches: false } as MediaQueryList);
    const service = TestBed.inject(ThemeService);
    expect(service.theme()).toBe('dark');
  });

  it('toggle() switches theme and persists it', () => {
    spyOn(window, 'matchMedia').and.returnValue({ matches: false } as MediaQueryList);
    const service = TestBed.inject(ThemeService);
    service.toggle();
    expect(service.theme()).toBe('dark');
    expect(document.body.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('postulare-theme')).toBe('dark');

    service.toggle();
    expect(service.theme()).toBe('light');
  });
});
