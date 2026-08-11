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

  it('openEdit proyecta equipmentItems a los ids del multi-select', async () => {
    TestBed.configureTestingModule({
      imports: [ModelsAdminComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: MatDialog, useValue: dialogMock }],
    });
    const fixture = TestBed.createComponent(ModelsAdminComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    const row = {
      id: 'm1',
      name: 'Corolla',
      segment: 'SEDAN',
      brand: { name: 'Toyota' },
      equipmentItems: [{ equipmentItem: { id: 'e1', name: 'ABS', category: 'Seguridad' } }],
    };
    for (const r of http.match(() => true)) {
      if (r.request.url.includes('/brands')) r.flush({ data: [] });
      else r.flush({ data: [row], pagination: { page: 1, pageSize: 25, total: 1, totalPages: 1 }, error: null });
    }
    await fixture.whenStable();

    fixture.componentInstance.crud.openEdit(row as never);

    const entity = fixture.componentInstance.crud.dialogEntity() as Record<string, unknown>;
    expect(entity['equipment']).toEqual(['e1']);
  });

  it('al guardar sincroniza el equipamiento de serie por PUT y no lo manda en el PATCH', async () => {
    TestBed.configureTestingModule({
      imports: [ModelsAdminComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: MatDialog, useValue: dialogMock }],
    });
    const fixture = TestBed.createComponent(ModelsAdminComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    const row = { id: 'm1', name: 'Corolla', segment: 'SEDAN', brand: { name: 'Toyota' }, equipmentItems: [] };
    for (const r of http.match(() => true)) {
      if (r.request.url.includes('/brands')) r.flush({ data: [] });
      else r.flush({ data: [row], pagination: { page: 1, pageSize: 25, total: 1, totalPages: 1 }, error: null });
    }
    await fixture.whenStable();

    const component = fixture.componentInstance;
    component.crud.openEdit(row as never);
    const savePromise = component.crud.save({
      brandId: 'b1',
      name: 'Corolla',
      segment: 'SEDAN',
      equipment: ['e1', 'e2'],
    });

    const patch = http.expectOne((r) => r.url.includes('/api/v1/admin/models/m1') && r.method === 'PATCH');
    expect(patch.request.body.equipment).toBeUndefined();
    patch.flush({ data: { id: 'm1' }, error: null });

    await new Promise((r) => setTimeout(r, 0));
    const put = http.expectOne((r) => r.url.includes('/api/v1/admin/equipment/model/m1') && r.method === 'PUT');
    expect(put.request.body).toEqual({ itemIds: ['e1', 'e2'] });
    put.flush({ data: { attached: 2, detached: 0 }, error: null });

    await new Promise((r) => setTimeout(r, 0));
    http.match(() => true).forEach((r) => r.flush({ data: [], error: null }));
    await savePromise;
  });

  it('marca en rojo el modelo sin imagen principal y sin galería', async () => {
    TestBed.configureTestingModule({
      imports: [ModelsAdminComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: MatDialog, useValue: dialogMock }],
    });
    const fixture = TestBed.createComponent(ModelsAdminComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    const rows = [
      { id: 'm1', name: 'Corolla', segment: 'SEDAN', brand: { name: 'Toyota' }, imageUrl: null, galleryUrls: [] },
      { id: 'm2', name: 'Yaris', segment: 'HATCHBACK', brand: { name: 'Toyota' }, imageUrl: '/uploads/a.jpg', galleryUrls: ['/uploads/b.jpg', '/uploads/c.jpg'] },
    ];
    for (const r of http.match(() => true)) {
      if (r.request.url.includes('/brands')) r.flush({ data: [] });
      else r.flush({ data: rows, pagination: { page: 1, pageSize: 25, total: 2, totalPages: 1 }, error: null });
    }
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));
    fixture.detectChanges();

    const cells = (rowIdx: number) =>
      Array.from(
        fixture.nativeElement.querySelectorAll('tbody tr')[rowIdx].querySelectorAll('td'),
      ) as HTMLElement[];

    // Columnas: Nombre, Marca, Segmento, Imagen, Galería, Acciones.
    const [sinImagen, sinGaleria] = [cells(0)[3], cells(0)[4]];
    expect(sinImagen.textContent?.trim()).toBe('No');
    expect(sinImagen.classList).toContain('text-danger');
    expect(sinGaleria.textContent?.trim()).toBe('0');
    expect(sinGaleria.classList).toContain('text-danger');

    const [conImagen, conGaleria] = [cells(1)[3], cells(1)[4]];
    expect(conImagen.textContent?.trim()).toBe('Sí');
    expect(conImagen.classList).not.toContain('text-danger');
    expect(conGaleria.textContent?.trim()).toBe('2');
    expect(conGaleria.classList).not.toContain('text-danger');
  });
});
