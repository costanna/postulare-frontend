import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';

import { environment } from '../../../environments/environment';
import { Application, ApplicationStatus } from '../../core/models/application.model';
import { todayIso } from '../../core/utils/iso-date';
import { KanbanComponent } from './kanban.component';

const URL = `${environment.apiUrl}/applications`;

function application(id: string, status: ApplicationStatus, appliedAt: string | null = null): Application {
  return {
    id,
    user_id: 'u1',
    company_name: 'Acme',
    position: 'Dev',
    status,
    source: null,
    salary_range: null,
    job_url: null,
    notes: null,
    applied_at: appliedAt,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
}

describe('KanbanComponent', () => {
  let fixture: ComponentFixture<KanbanComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KanbanComponent, HttpClientTestingModule, NoopAnimationsModule],
      providers: [provideRouter([]), provideTranslateService({ lang: 'es', fallbackLang: 'es' })],
    }).compileComponents();
    fixture = TestBed.createComponent(KanbanComponent);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  function load(items: Application[]): void {
    fixture.detectChanges();
    httpMock
      .expectOne((r) => r.url === URL)
      .flush({ items, total: items.length, page: 1, page_size: 100, pages: 1 });
  }

  function drag(from: ApplicationStatus, to: ApplicationStatus): void {
    const board = fixture.componentInstance.board();
    const previous = { data: board[from] };
    const target = { data: board[to] };
    fixture.componentInstance.drop(
      { previousContainer: previous, container: target, previousIndex: 0, currentIndex: 0 } as unknown as CdkDragDrop<Application[]>,
      to
    );
  }

  it('moving a saved card to "applied" also sends the local application date', () => {
    load([application('a1', 'saved')]);
    drag('saved', 'applied');

    const req = httpMock.expectOne(`${URL}/a1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'applied', applied_at: todayIso() });
    req.flush(application('a1', 'applied', todayIso()));

    const card = fixture.componentInstance.board().applied[0];
    expect(card.applied_at).toBe(todayIso());
  });

  it('keeps an existing application date when moving between later stages', () => {
    load([application('a1', 'applied', '2026-01-15')]);
    drag('applied', 'interview');

    const req = httpMock.expectOne(`${URL}/a1`);
    expect(req.request.body).toEqual({ status: 'interview' });
    req.flush(application('a1', 'interview', '2026-01-15'));
  });

  it('does not invent an application date when moving back to "saved"', () => {
    load([application('a1', 'applied', '2026-01-15')]);
    drag('applied', 'saved');
    expect(httpMock.expectOne(`${URL}/a1`).request.body).toEqual({ status: 'saved' });
  });

  it('puts the card back when the API fails', () => {
    load([application('a1', 'saved')]);
    drag('saved', 'applied');

    httpMock.expectOne(`${URL}/a1`).flush('x', { status: 500, statusText: 'Server Error' });

    const board = fixture.componentInstance.board();
    expect(board.saved.map((a) => a.id)).toEqual(['a1']);
    expect(board.applied.length).toBe(0);
  });
});
