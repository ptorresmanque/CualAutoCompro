import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { VersionsAdminComponent } from './versions-admin.component';

const dialogMock = {
  open: () => ({ afterClosed: () => of(true) }),
};

const tick = () => new Promise((r) => setTimeout(r, 0));

const rowWithRelations = {
  id: 'v1',
  name: 'XLI',
  year: 2026,
  priceClp: 15_000_000,
  model: { name: 'Corolla' },
  equipmentItems: [
    { equipmentItem: { id: 'e1', name: 'A', category: 'C' } },
    { equipmentItem: { id: 'e2', name: 'B', category: 'C' } },
  ],
  colorItems: [{ color: { id: 'c1', name: 'Rojo', hex: '#F00' } }],
};

function setup() {
  TestBed.configureTestingModule({
    imports: [VersionsAdminComponent],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: MatDialog, useValue: dialogMock },
    ],
  });
  const fixture = TestBed.createComponent(VersionsAdminComponent);
  fixture.detectChanges();
  return { fixture, http: TestBed.inject(HttpTestingController) };
}

const flushList = (
  http: HttpTestingController,
  data: unknown[] = [rowWithRelations],
): void => {
  http.expectOne((r) => r.url.includes('/api/v1/admin/versions')).flush({
    data,
    pagination: { page: 1, pageSize: 25, total: data.length, totalPages: 1 },
    error: null,
  });
};

describe('VersionsAdminComponent', () => {
  it('carga la lista paginada desde /admin/versions', async () => {
    const { fixture, http } = setup();
    flushList(http);
    await fixture.whenStable();
    await tick();

    expect(fixture.componentInstance.crud.items().length).toBe(1);
    expect(fixture.componentInstance.crud.pagination().total).toBe(1);
  });

  it('la carga inicial no pide opciones que nadie usa', async () => {
    const { fixture, http } = setup();
    const reqs = http.match(() => true);
    // Antes acá salía también un GET a /models cuyo resultado no se leía.
    expect(reqs.length).toBe(1);
    expect(reqs[0].request.url).toContain('/admin/versions');
    reqs[0].flush({
      data: [],
      pagination: { page: 1, pageSize: 25, total: 0, totalPages: 1 },
      error: null,
    });
    await fixture.whenStable();
  });

  it('openEdit proyecta las relaciones a los ids que consumen los multi-select', async () => {
    const { fixture, http } = setup();
    flushList(http);
    await fixture.whenStable();

    fixture.componentInstance.crud.openEdit(rowWithRelations as never);

    const entity = fixture.componentInstance.crud.dialogEntity() as Record<string, unknown>;
    expect(entity['equipment']).toEqual(['e1', 'e2']);
    expect(entity['colors']).toEqual(['c1']);
    expect(fixture.componentInstance.crud.dialogMode()).toBe('edit');
  });

  it('openEdit marca como heredado solo el equipamiento con source MODEL o BRAND', async () => {
    const { fixture, http } = setup();
    const row = {
      ...rowWithRelations,
      equipmentItems: [
        { equipmentItem: { id: 'e1', name: 'A', category: 'C' }, source: 'VERSION', sourceName: null },
        { equipmentItem: { id: 'e2', name: 'B', category: 'C' }, source: 'BRAND', sourceName: 'Toyota' },
        { equipmentItem: { id: 'e3', name: 'C', category: 'C' }, source: 'MODEL', sourceName: 'Corolla' },
      ],
    };
    flushList(http, [row]);
    await fixture.whenStable();

    fixture.componentInstance.crud.openEdit(row as never);

    const entity = fixture.componentInstance.crud.dialogEntity() as Record<string, unknown>;
    expect(entity['equipment']).toEqual(['e1', 'e2', 'e3']);
    expect(entity['equipmentInherited']).toEqual({
      e2: 'Heredado de la marca Toyota',
      e3: 'Heredado del modelo Corolla',
    });
  });

  it('sin source (payload viejo) nada queda marcado como heredado', async () => {
    const { fixture, http } = setup();
    flushList(http);
    await fixture.whenStable();

    fixture.componentInstance.crud.openEdit(rowWithRelations as never);

    const entity = fixture.componentInstance.crud.dialogEntity() as Record<string, unknown>;
    expect(entity['equipmentInherited']).toEqual({});
  });

  it('openCreate abre el diálogo vacío en modo create', async () => {
    const { fixture, http } = setup();
    flushList(http, []);
    await fixture.whenStable();

    fixture.componentInstance.crud.openCreate();
    expect(fixture.componentInstance.crud.dialogEntity()).toBeNull();
    expect(fixture.componentInstance.crud.dialogMode()).toBe('create');
  });

  it('openDuplicate precarga todo menos el id y guarda como alta nueva', async () => {
    const { fixture, http } = setup();
    flushList(http);
    await fixture.whenStable();

    fixture.componentInstance.crud.openDuplicate(rowWithRelations as never);

    const entity = fixture.componentInstance.crud.dialogEntity() as Record<string, unknown>;
    expect(entity['name']).toBe('XLI');
    expect(entity['equipment']).toEqual(['e1', 'e2']);
    expect(entity).not.toHaveProperty('id');
    expect(fixture.componentInstance.crud.dialogMode()).toBe('create');
    expect(fixture.componentInstance.crud.editingRow()).toBeNull();
  });

  it('al guardar emite un PUT por relación con la selección completa', async () => {
    const { fixture, http } = setup();
    flushList(http);
    await fixture.whenStable();

    const component = fixture.componentInstance;
    component.crud.openEdit(rowWithRelations as never);

    const savePromise = component.crud.save({
      modelId: 'm1',
      name: 'XLI',
      year: 2026,
      priceClp: 15_000_000,
      transmission: 'MANUAL',
      fuel: 'BENCINA',
      equipment: ['e2', 'e3'],
      colors: ['c1', 'c2'],
    });

    // 1) PATCH de la versión, sin los campos de relación.
    const patch = http.expectOne(
      (r) => r.url.includes('/api/v1/admin/versions/v1') && r.method === 'PATCH',
    );
    expect(patch.request.body.equipment).toBeUndefined();
    expect(patch.request.body.equipmentInherited).toBeUndefined();
    expect(patch.request.body.colors).toBeUndefined();
    patch.flush({ data: { id: 'v1' }, error: null });

    // 2) Un único PUT por relación, con la selección entera. Antes esto era
    //    un request por ítem, en serie.
    await tick();
    const eq = http.expectOne(
      (r) => r.url.includes('/api/v1/admin/equipment/version/v1') && r.method === 'PUT',
    );
    expect(eq.request.body).toEqual({ itemIds: ['e2', 'e3'] });
    eq.flush({ data: { attached: 1, detached: 1 }, error: null });

    const co = http.expectOne(
      (r) => r.url.includes('/api/v1/admin/colors/version/v1') && r.method === 'PUT',
    );
    expect(co.request.body).toEqual({ colorIds: ['c1', 'c2'] });
    co.flush({ data: { attached: 1, detached: 0 }, error: null });

    // 3) Recarga de la lista.
    await tick();
    flushList(http);
    await savePromise;

    expect(component.crud.dialogMode()).toBe('closed');
  });

  it('sin selección manda listas vacías, que desasocian todo', async () => {
    const { fixture, http } = setup();
    flushList(http);
    await fixture.whenStable();

    const component = fixture.componentInstance;
    component.crud.openEdit(rowWithRelations as never);
    const savePromise = component.crud.save({ name: 'XLI' });

    http.expectOne((r) => r.method === 'PATCH').flush({ data: { id: 'v1' }, error: null });
    await tick();

    const puts = http.match((r) => r.method === 'PUT');
    expect(puts.map((r) => r.request.body)).toEqual([{ itemIds: [] }, { colorIds: [] }]);
    puts.forEach((r) => r.flush({ data: { attached: 0, detached: 2 }, error: null }));

    // Drena la recarga y las opciones que monta el diálogo, sin asertar sobre
    // ellas: lo que importa acá son los bodies de los PUT.
    await tick();
    http.match(() => true).forEach((r) => r.flush({ data: [], error: null }));
    await savePromise;
  });
});
