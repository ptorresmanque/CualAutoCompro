import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { BrandsAdminComponent } from './brands-admin.component';

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
});