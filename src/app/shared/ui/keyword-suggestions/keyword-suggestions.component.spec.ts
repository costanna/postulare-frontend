import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';

import { PROGRAMMING_KEYWORDS, keywordTokens, toggleTerm } from '../../../core/data/programming-keywords';
import { KeywordSuggestionsComponent } from './keyword-suggestions.component';

describe('KeywordSuggestionsComponent', () => {
  let fixture: ComponentFixture<KeywordSuggestionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KeywordSuggestionsComponent],
      providers: [provideTranslateService({ lang: 'es', fallbackLang: 'es' })],
    }).compileComponents();
    fixture = TestBed.createComponent(KeywordSuggestionsComponent);
  });

  const chips = (): HTMLButtonElement[] => Array.from(fixture.nativeElement.querySelectorAll('.kw__chip'));

  it('renders one chip per keyword of every group', () => {
    fixture.detectChanges();
    const total = PROGRAMMING_KEYWORDS.reduce((sum, group) => sum + group.terms.length, 0);
    expect(chips().length).toBe(total);
    expect(fixture.nativeElement.querySelectorAll('.kw__group').length).toBe(PROGRAMMING_KEYWORDS.length);
  });

  it('marks as pressed the selected ones, ignoring case', () => {
    fixture.componentRef.setInput('selected', ['angular', 'PYTHON']);
    fixture.detectChanges();

    const pressed = chips().filter((chip) => chip.getAttribute('aria-pressed') === 'true').map((chip) => chip.textContent?.trim());
    expect(pressed.sort()).toEqual(['Angular', 'Python']);
  });

  it('emits the clicked keyword', () => {
    fixture.detectChanges();
    const picked: string[] = [];
    fixture.componentInstance.picked.subscribe((term) => picked.push(term));

    chips().find((chip) => chip.textContent?.trim() === 'Docker')!.click();

    expect(picked).toEqual(['Docker']);
  });

  it('has no keyword repeated across groups and none with spaces (the search matches any single word)', () => {
    const all = PROGRAMMING_KEYWORDS.flatMap((group) => group.terms.map((t) => t.toLowerCase()));
    expect(new Set(all).size).toBe(all.length);
    expect(all.filter((term) => /\s/.test(term))).toEqual([]);
  });
});

describe('keyword helpers', () => {
  it('keywordTokens() splits by spaces and commas', () => {
    expect(keywordTokens(' angular,  react   node.js ')).toEqual(['angular', 'react', 'node.js']);
    expect(keywordTokens(null)).toEqual([]);
  });

  it('toggleTerm() adds a missing term and removes an existing one regardless of case', () => {
    expect(toggleTerm(['angular'], 'React')).toEqual(['angular', 'React']);
    expect(toggleTerm(['angular', 'React'], 'ANGULAR')).toEqual(['React']);
  });
});
