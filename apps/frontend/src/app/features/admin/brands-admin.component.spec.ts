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

describe('BrandsAdminComponent', () => {
  it('carga lista desde /admin/brands (fallback /brands en test)', async () => {
    TestBed.configureTestingModule({
      imports: [BrandsAdminComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(BrandsAdminComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    const reqs = http.match(() => true);
    expect(reqs.length).toBeGreaterThan(0);
    for (const r of reqs) r.flush({ data: [{ id: 'b1', name: 'Toyota', logoUrl: null }] });
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));
    expect(fixture.componentInstance.items().length).toBeGreaterThan(0);
  });

  it('openCreate muestra dialog', async () => {
    TestBed.configureTestingModule({
      imports: [BrandsAdminComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(BrandsAdminComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    const reqs = http.match(() => true);
    for (const r of reqs) r.flush({ data: [] });
    await fixture.whenStable();
    fixture.componentInstance.openCreate();
    expect(fixture.componentInstance.dialogEntity()).toBeNull();
  });

  it('ordena por nombre asc/desc', async () => {
    TestBed.configureTestingModule({
      imports: [BrandsAdminComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(BrandsAdminComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    for (const r of http.match(() => true)) {
      r.flush({
        data: [
          { id: 'b1', name: 'Zoe', logoUrl: null },
          { id: 'b2', name: 'Audi', logoUrl: null },
          { id: 'b3', name: 'Mazda', logoUrl: null },
        ],
      });
    }
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));
    const cmp = fixture.componentInstance;
    expect(cmp.sortKey()).toBeNull();
    expect(cmp.displayed().map((b) => b.name)).toEqual(['Zoe', 'Audi', 'Mazda']);

    cmp.toggleSort('name');
    expect(cmp.sortKey()).toBe('name');
    expect(cmp.sortDir()).toBe('asc');
    expect(cmp.displayed().map((b) => b.name)).toEqual(['Audi', 'Mazda', 'Zoe']);

    cmp.toggleSort('name');
    expect(cmp.sortDir()).toBe('desc');
    expect(cmp.displayed().map((b) => b.name)).toEqual(['Zoe', 'Mazda', 'Audi']);
  });

  it('al editar marca, PATCH envía dealerIds al backend', async () => {
    TestBed.configureTestingModule({
      imports: [BrandsAdminComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(BrandsAdminComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    for (const r of http.match(() => true)) {
      r.flush({ data: [{ id: 'b1', name: 'Toyota', logoUrl: null }] });
    }
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));

    const cmp = fixture.componentInstance;
    cmp.openEdit({ id: 'b1', name: 'Toyota', logoUrl: null });

    void cmp.onSave({
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
      r.flush({ data: { id: 'b1', name: 'Toyota Updated', logoUrl: null } });
    }

    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));

    for (const r of http.match(() => true)) r.flush({ data: [] });
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
    for (const r of http.match(() => true)) {
      r.flush({ data: [] });
    }
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));

    const cmp = fixture.componentInstance;
    const row: BrandRow = {
      id: 'b1',
      name: 'Toyota',
      logoUrl: null,
      dealers: [{ dealer: { id: 'd1' } }, { dealer: { id: 'd2' } }],
    };
    cmp.openEdit(row);

    const dialogEntity = cmp.dialogEntity() as BrandRow | null;
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
    for (const r of http.match(() => true)) {
      r.flush({ data: [] });
    }
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));

    const cmp = fixture.componentInstance;
    cmp.openCreate();

    void cmp.onSave({ name: 'NuevaMarca', logoUrl: null, dealerIds: ['d1'] });

    const postReqs = http.match((r) => r.method === 'POST' && r.url.endsWith('/admin/brands'));
    expect(postReqs.length).toBe(1);
    expect(postReqs[0].request.body).toEqual({ name: 'NuevaMarca', logoUrl: null });
    expect((postReqs[0].request.body as Record<string, unknown>)['dealerIds']).toBeUndefined();
    for (const r of postReqs) {
      r.flush({ data: { id: 'bNew', name: 'NuevaMarca', logoUrl: null } });
    }

    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));

    for (const r of http.match(() => true)) r.flush({ data: [] });
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
    for (const r of http.match(() => true)) r.flush({ data: [] });
    await fixture.whenStable();

    const feedback = TestBed.inject(AdminFeedbackService);
    const successSpy = vi.spyOn(feedback, 'success');

    fixture.componentInstance.dialogEntity.set(null);
    void fixture.componentInstance.onSave({
      name: 'Toyota',
      logoUrl: null,
      dealerIds: ['d1'],
    });

    const postReq = http.expectOne((r) => r.url.endsWith('/api/v1/admin/brands'));
    expect(postReq.request.method).toBe('POST');
    postReq.flush({ data: { id: 'b1', name: 'Toyota', logoUrl: null } });
    await new Promise((r) => setTimeout(r, 0));

    expect(successSpy).toHaveBeenCalledWith('Marca "Toyota" creada');

    // Cleanup: drain the load() reload so the test doesn't leak pending requests
    for (const r of http.match(() => true)) r.flush({ data: [] });
  });

  it('confirmDelete llama feedback.success con "Marca <name> eliminada"', async () => {
    TestBed.configureTestingModule({
      imports: [BrandsAdminComponent, NoopAnimationsModule],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: MatDialog, useValue: dialogMock }],
    });
    const fixture = TestBed.createComponent(BrandsAdminComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    for (const r of http.match(() => true)) r.flush({ data: [] });
    await fixture.whenStable();

    const feedback = TestBed.inject(AdminFeedbackService);
    const successSpy = vi.spyOn(feedback, 'success');

    void fixture.componentInstance.confirmDelete({
      id: 'b1',
      name: 'Toyota',
      logoUrl: null,
    });
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));

    const delReq = http.expectOne((r) => r.url.endsWith('/api/v1/admin/brands/b1'));
    expect(delReq.request.method).toBe('DELETE');
    delReq.flush({ data: null });
    await new Promise((r) => setTimeout(r, 0));

    expect(successSpy).toHaveBeenCalledWith('Marca "Toyota" eliminada');

    // Cleanup: drain the load() reload
    for (const r of http.match(() => true)) r.flush({ data: [] });
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
    for (const r of http.match(() => true)) r.flush({ data: [] });
    await fixture.whenStable();

    await fixture.componentInstance.confirmDelete({
      id: 'b1',
      name: 'Toyota',
      logoUrl: null,
    });

    const delReqs = http.match((r) => r.method === 'DELETE');
    expect(delReqs.length).toBe(0);
  });
});