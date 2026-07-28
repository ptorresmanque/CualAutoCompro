import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { ModelsAdminComponent } from './models-admin.component';

const dialogMock = {
  open: () => ({ afterClosed: () => of(true) }),
};

describe('ModelsAdminComponent', () => {
  it('carga lista paginada desde /admin/models', async () => {
    TestBed.configureTestingModule({
      imports: [ModelsAdminComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: MatDialog, useValue: dialogMock }],
    });
    const fixture = TestBed.createComponent(ModelsAdminComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    for (const r of http.match(() => true)) {
      if (r.request.url.includes('/brands')) {
        r.flush({ data: [] });
      } else {
        r.flush({
          data: [{ id: 'm1', name: 'Corolla', segment: 'SEDAN', brand: { name: 'Toyota' } }],
          pagination: { page: 1, pageSize: 25, total: 1, totalPages: 1 },
          error: null,
        });
      }
    }
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));
    expect(fixture.componentInstance.crud.items().length).toBe(1);
    expect(fixture.componentInstance.crud.pagination().total).toBe(1);
  });

  it('openCreate muestra dialog', async () => {
    TestBed.configureTestingModule({
      imports: [ModelsAdminComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: MatDialog, useValue: dialogMock }],
    });
    const fixture = TestBed.createComponent(ModelsAdminComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    for (const r of http.match(() => true)) {
      if (r.request.url.includes('/brands')) r.flush({ data: [] });
      else r.flush({ data: [], pagination: { page: 1, pageSize: 25, total: 0, totalPages: 1 }, error: null });
    }
    await fixture.whenStable();
    fixture.componentInstance.crud.openCreate();
    expect(fixture.componentInstance.crud.dialogEntity()).toBeNull();
  });
});
