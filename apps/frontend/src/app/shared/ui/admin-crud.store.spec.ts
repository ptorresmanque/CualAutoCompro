import { Injector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { ENV } from '../../core/env';
import { AdminFeedbackService } from '../../core/admin-feedback.service';
import { AdminCrudStore, type AdminCrudConfig } from './admin-crud.store';
import type { BackendFieldError } from './admin-form-errors';

interface Row {
  id: string;
  name: string;
  segment: string;
}

const rows: Row[] = [
  { id: 'm1', name: 'Corolla', segment: 'SEDAN' },
  { id: 'm2', name: 'Yaris', segment: 'HATCHBACK' },
];

const pagedBody = (data: Row[] = rows) => ({
  data,
  pagination: { page: 1, pageSize: 25, total: data.length, totalPages: 1 },
  error: null,
});

let confirmResult = true;
const dialogMock = { open: () => ({ afterClosed: () => of(confirmResult) }) };
const feedbackMock = { success: () => undefined, error: () => undefined };

const baseConfig: AdminCrudConfig<Row> = {
  apiPath: '/admin/models',
  label: { singular: 'Modelo', created: 'creado', updated: 'actualizado', deleted: 'eliminado' },
  rowName: (r) => r.name,
  searchFields: (r) => [r.name, r.segment],
  sortAccessor: (r, k) => r[k as 'name' | 'segment'],
};

/** Deja correr los microtasks para que la continuación del await ya haya emitido su request. */
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

function makeStore(overrides: Partial<AdminCrudConfig<Row>> = {}): {
  store: AdminCrudStore<Row>;
  http: HttpTestingController;
} {
  confirmResult = true;
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: MatDialog, useValue: dialogMock },
      { provide: AdminFeedbackService, useValue: feedbackMock },
    ],
  });
  const injector = TestBed.inject(Injector);
  const store = runInInjectionContext(
    injector,
    () => new AdminCrudStore<Row>({ ...baseConfig, ...overrides }),
  );
  return { store, http: TestBed.inject(HttpTestingController) };
}

describe('AdminCrudStore — carga y paginación', () => {
  it('pide la página actual y vuelca data + pagination', async () => {
    const { store, http } = makeStore();
    const promise = store.load();

    const req = http.expectOne((r) => r.url === `${ENV.apiBase}/admin/models`);
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('pageSize')).toBe('25');
    req.flush(pagedBody());
    await promise;

    expect(store.items().length).toBe(2);
    expect(store.pagination().total).toBe(2);
    expect(store.loading()).toBe(false);
  });

  it('agrega q solo cuando hay búsqueda, y resetea a la página 1', async () => {
    const { store, http } = makeStore();

    store.onPageChange(3);
    const paged = http.expectOne((r) => r.url === `${ENV.apiBase}/admin/models`);
    expect(paged.request.params.get('page')).toBe('3');
    expect(paged.request.params.has('q')).toBe(false);
    paged.flush(pagedBody());

    store.onSearch('  yaris  ');
    const searched = http.expectOne((r) => r.url === `${ENV.apiBase}/admin/models`);
    expect(searched.request.params.get('q')).toBe('yaris');
    expect(searched.request.params.get('page')).toBe('1');
    searched.flush(pagedBody());
    await tick();
  });

  it('incluye extraParams en cada request', async () => {
    const { store, http } = makeStore({ extraParams: () => ({ versionId: 'v9' }) });
    const promise = store.load();
    const req = http.expectOne((r) => r.url === `${ENV.apiBase}/admin/models`);
    expect(req.request.params.get('versionId')).toBe('v9');
    req.flush(pagedBody());
    await promise;
  });

  it('no dispara ninguna request extra de opciones', async () => {
    const { store, http } = makeStore();
    const promise = store.load();
    const matched = http.match(() => true);
    expect(matched.length).toBe(1);
    matched[0].flush(pagedBody());
    await promise;
  });

  it('expone el error y lo limpia al reintentar', async () => {
    const { store, http } = makeStore();
    const promise = store.load();
    http.expectOne(() => true).flush(
      { data: null, error: { code: 'INTERNAL', message: 'Explotó' } },
      { status: 500, statusText: 'Server Error' },
    );
    await promise;
    expect(store.error()).toBe('Explotó');

    store.retry();
    expect(store.error()).toBeNull();
    http.expectOne(() => true).flush(pagedBody());
  });
});

describe('AdminCrudStore — filtro y orden en cliente', () => {
  const seed = async () => {
    const { store, http } = makeStore();
    const promise = store.load();
    http.expectOne(() => true).flush(pagedBody());
    await promise;
    return { store, http };
  };

  it('displayed filtra por searchFields sin volver al servidor', async () => {
    const { store } = await seed();
    store.setSearchText('yar');
    expect(store.displayed().map((r) => r.id)).toEqual(['m2']);
  });

  it('toggleSort alterna asc/desc sobre la misma clave', async () => {
    const { store } = await seed();
    store.toggleSort('name');
    expect(store.displayed().map((r) => r.name)).toEqual(['Corolla', 'Yaris']);
    store.toggleSort('name');
    expect(store.sortDir()).toBe('desc');
    expect(store.displayed().map((r) => r.name)).toEqual(['Yaris', 'Corolla']);
  });

  it('cambiar de clave vuelve a asc', async () => {
    const { store } = await seed();
    store.toggleSort('name');
    store.toggleSort('name');
    store.toggleSort('segment');
    expect(store.sortKey()).toBe('segment');
    expect(store.sortDir()).toBe('asc');
  });
});

describe('AdminCrudStore — diálogo', () => {
  it('openCreate deja modo create sin prefill', () => {
    const { store } = makeStore();
    store.openCreate();
    expect(store.dialogMode()).toBe('create');
    expect(store.dialogEntity()).toBeNull();
    expect(store.editingRow()).toBeNull();
  });

  it('openEdit deja modo edit con la fila proyectada', () => {
    const { store } = makeStore({
      toDialogEntity: (r) => ({ ...r, extra: 'x' }),
    });
    store.openEdit(rows[0]);
    expect(store.dialogMode()).toBe('edit');
    expect(store.editingRow()).toEqual(rows[0]);
    expect(store.dialogEntity()).toMatchObject({ name: 'Corolla', extra: 'x' });
  });

  it('openDuplicate prefill completo pero en modo create y sin id', () => {
    const { store } = makeStore();
    store.openDuplicate({ ...rows[0] });

    expect(store.dialogMode()).toBe('create');
    expect(store.editingRow()).toBeNull();
    expect(store.dialogEntity()).toMatchObject({ name: 'Corolla', segment: 'SEDAN' });
    expect(store.dialogEntity()).not.toHaveProperty('id');
  });

  it('closeDialog vuelve a closed', () => {
    const { store } = makeStore();
    store.openEdit(rows[0]);
    store.closeDialog();
    expect(store.dialogMode()).toBe('closed');
    expect(store.editingRow()).toBeNull();
  });
});

describe('AdminCrudStore — guardado', () => {
  it('en modo create hace POST y recarga', async () => {
    const { store, http } = makeStore();
    store.openCreate();
    const promise = store.save({ name: 'Hilux', segment: 'PICKUP' });

    const post = http.expectOne(
      (r) => r.method === 'POST' && r.url === `${ENV.apiBase}/admin/models`,
    );
    expect(post.request.body).toEqual({ name: 'Hilux', segment: 'PICKUP' });
    post.flush({ data: { id: 'm3' }, error: null });

    await tick();
    http.expectOne((r) => r.method === 'GET').flush(pagedBody());
    await promise;
    expect(store.dialogMode()).toBe('closed');
  });

  it('en modo edit hace PATCH sobre el id de la fila', async () => {
    const { store, http } = makeStore();
    store.openEdit(rows[0]);
    const promise = store.save({ name: 'Corolla Cross', segment: 'SUV' });

    const patch = http.expectOne(
      (r) => r.method === 'PATCH' && r.url === `${ENV.apiBase}/admin/models/m1`,
    );
    patch.flush({ data: { id: 'm1' }, error: null });
    await tick();
    http.expectOne((r) => r.method === 'GET').flush(pagedBody());
    await promise;
  });

  it('beforeSave puede quitar campos del payload', async () => {
    const { store, http } = makeStore({
      beforeSave: (value) => {
        const { dealerIds: _drop, ...rest } = value;
        return rest;
      },
    });
    store.openCreate();
    const promise = store.save({ name: 'X', dealerIds: ['d1'] });

    const post = http.expectOne((r) => r.method === 'POST');
    expect(post.request.body).toEqual({ name: 'X' });
    post.flush({ data: { id: 'm9' }, error: null });
    await tick();
    http.expectOne((r) => r.method === 'GET').flush(pagedBody());
    await promise;
  });

  it('afterSave recibe el id devuelto por el POST', async () => {
    const seen: string[] = [];
    const { store, http } = makeStore({
      afterSave: async ({ id }) => {
        seen.push(id);
      },
    });
    store.openCreate();
    const promise = store.save({ name: 'X' });

    http.expectOne((r) => r.method === 'POST').flush({ data: { id: 'nuevo-id' }, error: null });
    await tick();
    http.expectOne((r) => r.method === 'GET').flush(pagedBody());
    await promise;

    expect(seen).toEqual(['nuevo-id']);
  });

  it('afterSave recibe el id existente al editar', async () => {
    const seen: string[] = [];
    const { store, http } = makeStore({
      afterSave: async ({ id }) => {
        seen.push(id);
      },
    });
    store.openEdit(rows[1]);
    const promise = store.save({ name: 'X' });

    http.expectOne((r) => r.method === 'PATCH').flush({ data: { id: 'm2' }, error: null });
    await tick();
    http.expectOne((r) => r.method === 'GET').flush(pagedBody());
    await promise;

    expect(seen).toEqual(['m2']);
  });

  it('un 400 VALIDATION va a onValidationError y no al error general', async () => {
    const received: BackendFieldError[][] = [];
    const { store, http } = makeStore({
      onValidationError: (fields) => received.push(fields),
    });
    store.openCreate();
    const promise = store.save({ name: 'X' });

    http.expectOne((r) => r.method === 'POST').flush(
      {
        data: null,
        error: {
          code: 'VALIDATION',
          message: 'Datos inválidos',
          fields: [{ path: ['name'], message: 'Muy corto' }],
        },
      },
      { status: 400, statusText: 'Bad Request' },
    );
    await promise;

    expect(received).toEqual([[{ path: ['name'], message: 'Muy corto' }]]);
    expect(store.error()).toBeNull();
    // El diálogo sigue abierto para que el usuario corrija.
    expect(store.dialogMode()).toBe('create');
  });

  it('un error no-VALIDATION deja el mensaje general y no cierra el diálogo', async () => {
    const { store, http } = makeStore();
    store.openCreate();
    const promise = store.save({ name: 'X' });

    http.expectOne((r) => r.method === 'POST').flush(
      { data: null, error: { code: 'CONFLICT', message: 'Nombre duplicado' } },
      { status: 409, statusText: 'Conflict' },
    );
    await promise;

    expect(store.error()).toBe('Nombre duplicado');
    expect(store.dialogMode()).toBe('create');
  });
});

describe('AdminCrudStore — guardar y crear otro', () => {
  it('mantiene el diálogo abierto conservando solo los campos sticky', async () => {
    const { store, http } = makeStore({ stickyFields: ['segment'] });
    store.openCreate();
    const promise = store.saveAndNew({ name: 'Hilux', segment: 'PICKUP' });

    http.expectOne((r) => r.method === 'POST').flush({ data: { id: 'm3' }, error: null });
    await tick();
    http.expectOne((r) => r.method === 'GET').flush(pagedBody());
    await promise;

    expect(store.dialogMode()).toBe('create');
    expect(store.editingRow()).toBeNull();
    expect(store.dialogEntity()).toEqual({ segment: 'PICKUP' });
  });

  it('sin stickyFields deja el prefill vacío', async () => {
    const { store, http } = makeStore();
    store.openCreate();
    const promise = store.saveAndNew({ name: 'Hilux', segment: 'PICKUP' });

    http.expectOne((r) => r.method === 'POST').flush({ data: { id: 'm3' }, error: null });
    await tick();
    http.expectOne((r) => r.method === 'GET').flush(pagedBody());
    await promise;

    expect(store.dialogEntity()).toEqual({});
  });

  it('si el guardado falla no reinicia el formulario', async () => {
    const { store, http } = makeStore({ stickyFields: ['segment'] });
    store.openCreate();
    const promise = store.saveAndNew({ name: 'Hilux', segment: 'PICKUP' });

    http.expectOne((r) => r.method === 'POST').flush(
      { data: null, error: { code: 'CONFLICT', message: 'Duplicado' } },
      { status: 409, statusText: 'Conflict' },
    );
    await promise;

    expect(store.dialogEntity()).toBeNull();
    expect(store.error()).toBe('Duplicado');
  });
});

describe('AdminCrudStore — borrado', () => {
  it('confirma, borra y recarga', async () => {
    const { store, http } = makeStore();
    const promise = store.confirmDelete(rows[0]);

    // El DELETE sale recién después de que el confirm resuelve.
    await tick();
    http
      .expectOne((r) => r.method === 'DELETE' && r.url === `${ENV.apiBase}/admin/models/m1`)
      .flush({ data: { deleted: true }, error: null });

    await tick();
    http.expectOne((r) => r.method === 'GET').flush(pagedBody());
    await promise;
  });

  it('si el usuario cancela no emite request', async () => {
    const { store, http } = makeStore();
    confirmResult = false; // después de makeStore, que lo resetea a true
    await store.confirmDelete(rows[0]);
    await tick();
    http.expectNone(() => true);
  });
});
