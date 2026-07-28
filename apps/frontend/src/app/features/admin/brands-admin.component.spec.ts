import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { AdminFeedbackService } from '../../core/admin-feedback.service';
import { BrandsAdminComponent } from './brands-admin.component';

const dialogMock = {
  open: () => ({ afterClosed: () => of(true) }),
};

interface BrandRow {
  id: string;
  name: string;
  logoUrl: string | null;
  dealers?: { dealer: { id: string } }[];
  dealerIds?: string[];
}

const flushPaged = (http: HttpTestingController, rows: BrandRow[]) => {
  for (const r of http.match(() => true)) {
    r.flush({
      data: rows,
      pagination: { page: 1, pageSize: 25, total: rows.length, totalPages: 1 },
      error: null,
    });
  }
};

describe('BrandsAdminComponent', () => {
  it('carga lista paginada desde /admin/brands', async () => {
    TestBed.configureTestingModule({
      imports: [BrandsAdminComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(BrandsAdminComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    // match() consume los requests: hay que vaciar estos mismos, no volver a
    // buscarlos (por eso este test fallaba con items() vacío).
    const reqs = http.match((r) => r.url.endsWith('/admin/brands'));
    expect(reqs.length).toBeGreaterThan(0);
    for (const r of reqs) {
      r.flush({
        data: [{ id: 'b1', name: 'Toyota', logoUrl: null }],
        pagination: { page: 1, pageSize: 25, total: 1, totalPages: 1 },
        error: null,
      });
    }
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));
    expect(fixture.componentInstance.crud.items().length).toBe(1);
    expect(fixture.componentInstance.crud.pagination().total).toBe(1);
  });

  it('openCreate muestra dialog', async () => {
    TestBed.configureTestingModule({
      imports: [BrandsAdminComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(BrandsAdminComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    flushPaged(http, []);
    await fixture.whenStable();
    fixture.componentInstance.crud.openCreate();
    expect(fixture.componentInstance.crud.dialogEntity()).toBeNull();
  });

  it('ordena por nombre asc/desc', async () => {
    TestBed.configureTestingModule({
      imports: [BrandsAdminComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(BrandsAdminComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    flushPaged(http, [
      { id: 'b1', name: 'Zoe', logoUrl: null },
      { id: 'b2', name: 'Audi', logoUrl: null },
      { id: 'b3', name: 'Mazda', logoUrl: null },
    ]);
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));
    const cmp = fixture.componentInstance;
    expect(cmp.crud.sortKey()).toBeNull();
    expect(cmp.crud.displayed().map((b) => b.name)).toEqual(['Zoe', 'Audi', 'Mazda']);

    cmp.crud.toggleSort('name');
    expect(cmp.crud.sortKey()).toBe('name');
    expect(cmp.crud.sortDir()).toBe('asc');
    expect(cmp.crud.displayed().map((b) => b.name)).toEqual(['Audi', 'Mazda', 'Zoe']);

    cmp.crud.toggleSort('name');
    expect(cmp.crud.sortDir()).toBe('desc');
    expect(cmp.crud.displayed().map((b) => b.name)).toEqual(['Zoe', 'Mazda', 'Audi']);
  });

  it('al editar marca, PATCH envía dealerIds al backend', async () => {
    TestBed.configureTestingModule({
      imports: [BrandsAdminComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(BrandsAdminComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    flushPaged(http, [{ id: 'b1', name: 'Toyota', logoUrl: null }]);
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));

    const cmp = fixture.componentInstance;
    cmp.crud.openEdit({ id: 'b1', name: 'Toyota', logoUrl: null });

    void cmp.crud.save({
      name: 'Toyota Updated',
      logoUrl: null,
      dealerIds: ['d1', 'd2'],
    });

    const patchReqs = http.match((r) => r.method === 'PATCH' && r.url.endsWith('/admin/brands/b1'));
    expect(patchReqs.length).toBe(1);
    expect(patchReqs[0].request.body).toEqual({
      name: 'Toyota Updated',
      logoUrl: null,
      dealerIds: ['d1', 'd2'],
    });
    for (const r of patchReqs) {
      r.flush({ data: { id: 'b1', name: 'Toyota Updated', logoUrl: null }, error: null });
    }

    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));

    flushPaged(http, []);
    await fixture.whenStable();
  });

  it('openEdit proyecta dealers -> dealerIds', async () => {
    TestBed.configureTestingModule({
      imports: [BrandsAdminComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(BrandsAdminComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    flushPaged(http, []);
    await fixture.whenStable();

    const cmp = fixture.componentInstance;
    const row: BrandRow = {
      id: 'b1',
      name: 'Toyota',
      logoUrl: null,
      dealers: [{ dealer: { id: 'd1' } }, { dealer: { id: 'd2' } }],
    };
    cmp.crud.openEdit(row);

    const dialogEntity = cmp.crud.dialogEntity() as BrandRow | null;
    expect(dialogEntity).not.toBeNull();
    expect(dialogEntity!.dealerIds).toEqual(['d1', 'd2']);
  });

  it('al crear marca, POST no envía dealerIds', async () => {
    TestBed.configureTestingModule({
      imports: [BrandsAdminComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(BrandsAdminComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    flushPaged(http, []);
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));

    const cmp = fixture.componentInstance;
    cmp.crud.openCreate();

    void cmp.crud.save({ name: 'NuevaMarca', logoUrl: null, dealerIds: ['d1'] });

    const postReqs = http.match((r) => r.method === 'POST' && r.url.endsWith('/admin/brands'));
    expect(postReqs.length).toBe(1);
    expect(postReqs[0].request.body).toEqual({ name: 'NuevaMarca', logoUrl: null });
    expect((postReqs[0].request.body as Record<string, unknown>)['dealerIds']).toBeUndefined();
    for (const r of postReqs) {
      r.flush({ data: { id: 'bNew', name: 'NuevaMarca', logoUrl: null }, error: null });
    }

    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));

    flushPaged(http, []);
    await fixture.whenStable();
  });

  it('onSave en modo create llama feedback.success con "Marca <name> creada"', async () => {
    TestBed.configureTestingModule({
      imports: [BrandsAdminComponent, NoopAnimationsModule],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(BrandsAdminComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    flushPaged(http, []);
    await fixture.whenStable();

    const feedback = TestBed.inject(AdminFeedbackService);
    const successSpy = vi.spyOn(feedback, 'success');

    fixture.componentInstance.crud.openCreate();
    void fixture.componentInstance.crud.save({
      name: 'Toyota',
      logoUrl: null,
      dealerIds: ['d1'],
    });

    const postReq = http.expectOne((r) => r.url.endsWith('/api/v1/admin/brands'));
    expect(postReq.request.method).toBe('POST');
    postReq.flush({ data: { id: 'b1', name: 'Toyota', logoUrl: null }, error: null });
    await new Promise((r) => setTimeout(r, 0));

    expect(successSpy).toHaveBeenCalledWith('Marca "Toyota" creada');

    flushPaged(http, []);
  });

  it('confirmDelete llama feedback.success con "Marca <name> eliminada"', async () => {
    TestBed.configureTestingModule({
      imports: [BrandsAdminComponent, NoopAnimationsModule],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: MatDialog, useValue: dialogMock }],
    });
    const fixture = TestBed.createComponent(BrandsAdminComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    flushPaged(http, []);
    await fixture.whenStable();

    const feedback = TestBed.inject(AdminFeedbackService);
    const successSpy = vi.spyOn(feedback, 'success');

    void fixture.componentInstance.crud.confirmDelete({
      id: 'b1',
      name: 'Toyota',
      logoUrl: null,
    });
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));

    const delReq = http.expectOne((r) => r.url.endsWith('/api/v1/admin/brands/b1'));
    expect(delReq.request.method).toBe('DELETE');
    delReq.flush({ data: null, error: null });
    await new Promise((r) => setTimeout(r, 0));

    expect(successSpy).toHaveBeenCalledWith('Marca "Toyota" eliminada');

    flushPaged(http, []);
  });

  it('confirmDelete no llama al DELETE si el usuario cancela el dialog', async () => {
    const cancelMock = { open: () => ({ afterClosed: () => of(false) }) };
    TestBed.configureTestingModule({
      imports: [BrandsAdminComponent, NoopAnimationsModule],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: MatDialog, useValue: cancelMock }],
    });
    const fixture = TestBed.createComponent(BrandsAdminComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    flushPaged(http, []);
    await fixture.whenStable();

    await fixture.componentInstance.crud.confirmDelete({
      id: 'b1',
      name: 'Toyota',
      logoUrl: null,
    });

    const delReqs = http.match((r) => r.method === 'DELETE');
    expect(delReqs.length).toBe(0);
  });

  it('onPageChange actualiza page y vuelve a llamar al endpoint con page=<n>', async () => {
    TestBed.configureTestingModule({
      imports: [BrandsAdminComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(BrandsAdminComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    flushPaged(http, [{ id: 'b1', name: 'Toyota', logoUrl: null }]);
    await fixture.whenStable();

    fixture.componentInstance.crud.onPageChange(2);
    await fixture.whenStable();
    const req = http.expectOne(
      (r) => r.url.endsWith('/admin/brands') && r.params.get('page') === '2',
    );
    req.flush({
      data: [{ id: 'b1', name: 'Toyota', logoUrl: null }],
      pagination: { page: 2, pageSize: 25, total: 50, totalPages: 2 },
      error: null,
    });
    await fixture.whenStable();
    // load() vuelca la paginación en la continuación del await: hace falta
    // ceder un macrotask antes de leerla.
    await new Promise((r) => setTimeout(r, 0));
    expect(fixture.componentInstance.crud.pagination().page).toBe(2);
    expect(fixture.componentInstance.crud.pagination().total).toBe(50);
  });
});
