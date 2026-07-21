import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { DealersAdminComponent } from './dealers-admin.component';

const dialogMock = {
  open: () => ({ afterClosed: () => of(true) }),
};

const flushPaged = (http: HttpTestingController, rows: unknown[]) => {
  for (const r of http.match(() => true)) {
    r.flush({
      data: rows,
      pagination: { page: 1, pageSize: 25, total: rows.length, totalPages: 1 },
      error: null,
    });
  }
};

describe('DealersAdminComponent', () => {
  it('carga lista paginada desde /admin/dealers', async () => {
    TestBed.configureTestingModule({
      imports: [DealersAdminComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: MatDialog, useValue: dialogMock }],
    });
    const fixture = TestBed.createComponent(DealersAdminComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    flushPaged(http, [{ id: 'd1', name: 'AutoMax', url: 'https://automax.example', logoUrl: null }]);
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));
    expect(fixture.componentInstance.items().length).toBe(1);
    expect(fixture.componentInstance.items()[0].url).toBe('https://automax.example');
    expect(fixture.componentInstance.pagination().total).toBe(1);
  });

  it('openCreate muestra dialog', async () => {
    TestBed.configureTestingModule({
      imports: [DealersAdminComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: MatDialog, useValue: dialogMock }],
    });
    const fixture = TestBed.createComponent(DealersAdminComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    flushPaged(http, []);
    await fixture.whenStable();
    fixture.componentInstance.openCreate();
    expect(fixture.componentInstance.dialogEntity()).toBeNull();
  });
});
