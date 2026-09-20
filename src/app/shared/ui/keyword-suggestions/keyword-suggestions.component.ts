import { Component, computed, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { PROGRAMMING_KEYWORDS } from '../../../core/data/programming-keywords';

@Component({
  selector: 'app-keyword-suggestions',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './keyword-suggestions.component.html',
  styleUrl: './keyword-suggestions.component.scss',
})
export class KeywordSuggestionsComponent {
  readonly selected = input<string[]>([]);
  readonly picked = output<string>();

  readonly groups = PROGRAMMING_KEYWORDS;
  private readonly selectedSet = computed(() => new Set(this.selected().map((term) => term.toLowerCase())));

  isSelected(term: string): boolean {
    return this.selectedSet().has(term.toLowerCase());
  }
}
