import { Component } from '@angular/core';

@Component({
  selector: 'app-bugtest',
  standalone: true,
  template: `
    @for (item of items; track item.key ?? $index) {
      <div>{{ item.key }}</div>
    }
  `,
})
export class BugtestComponent {
  items: { key: string | null }[] = [{ key: 'a' }, { key: null }];
}
