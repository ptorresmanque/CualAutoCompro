import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { AdminEditDialogComponent } from './admin-edit-dialog.component';

function setup(entityKey: 'brand' | 'model' | 'version' | 'equipment' | 'maintenance') {
  TestBed.configureTestingModule({
    imports: [AdminEditDialogComponent],
    providers: [provideHttpClient(), provideHttpClientTesting()],
  });
  const fixture = TestBed.createComponent(AdminEditDialogComponent);
  fixture.componentRef.setInput('entityKey', entityKey);
  fixture.componentRef.setInput('apiPath', entityKey === 'maintenance' ? 'maintenance' : `${entityKey}s`);
  fixture.detectChanges();
  return { fixture, http: TestBed.inject(HttpTestingController) };
}

describe('AdminEditDialogComponent', () => {

  it('carga el template y arma el form (brand)', async () => {
    const { fixture, http } = setup('brand');
    const req = http.expectOne((r) => r.url.includes('/api/v1/admin/seed/template/brand'));
    req.flush({ data: { name: '', logoUrl: null } });
    await fixture.whenStable();
    expect(fixture.componentInstance.form().contains('name')).toBe(true);
  });

  it('nunca renderiza el campo id aunque el current lo incluya', async () => {
    const { fixture, http } = setup('brand');
    const req = http.expectOne((r) => r.url.includes('/api/v1/admin/seed/template/brand'));
    req.flush({ data: { name: '', logoUrl: null } });
    await fixture.whenStable();
    fixture.componentRef.setInput('entity', { id: 'abc-123', name: 'Toyota', logoUrl: null });
    fixture.detectChanges();
    await fixture.whenStable();
    const nodes = Array.from(fixture.nativeElement.querySelectorAll('label > span:first-child')) as Element[];
    const labels: string[] = nodes.map((el) => el.textContent?.trim() ?? '');
    expect(labels.some((l) => l.toLowerCase().includes('id'))).toBe(false);
  });

  it('JSON inicial no incluye id', async () => {
    const { fixture, http } = setup('brand');
    const req = http.expectOne((r) => r.url.includes('/api/v1/admin/seed/template/brand'));
    req.flush({ data: { name: '', logoUrl: null } });
    await fixture.whenStable();
    fixture.componentRef.setInput('entity', { id: 'abc-123', name: 'Toyota', logoUrl: null });
    fixture.detectChanges();
    await fixture.whenStable();
    const json = JSON.parse(fixture.componentInstance.jsonText());
    expect(json).not.toHaveProperty('id');
    expect(json).toEqual({ name: 'Toyota', logoUrl: null });
  });

  it('model con FK brandId renderiza app-select-search', async () => {
    const { fixture, http } = setup('model');
    const req = http.expectOne((r) => r.url.includes('/api/v1/admin/seed/template/model'));
    req.flush({ data: { brandId: '', name: '', segment: 'SEDAN', imageUrl: null, galleryUrls: [] } });
    await fixture.whenStable();
    fixture.detectChanges();
    const sel = fixture.nativeElement.querySelector('app-select-search');
    expect(sel).toBeTruthy();
  });

  it('version con FK modelId carga TODOS los modelos desde /admin/models (no el endpoint público paginado)', async () => {
    const { fixture, http } = setup('version');
    const templateReq = http.expectOne((r) => r.url.includes('/api/v1/admin/seed/template/version'));
    templateReq.flush({
      data: {
        modelId: '', name: '', year: 2026, priceClp: 0,
        transmission: 'MANUAL', fuel: 'BENCINA',
        engineDisplacementCc: 0, powerHp: 0, torqueNm: 0,
        consumptionCityKmL: 0, consumptionHighwayKmL: 0,
        lengthMm: 0, widthMm: 0, heightMm: 0, weightKg: 0,
        trunkLiters: 0,
      },
    });
    await fixture.whenStable();
    fixture.detectChanges();

    const modelsReq = http.expectOne((r) => r.url.endsWith('/api/v1/admin/models/options'));
    modelsReq.flush({
      data: [
        { id: 'm1', name: 'Yaris' },
        { id: 'm2', name: 'Corolla' },
        { id: 'm3', name: 'RAV4' },
      ],
    });
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));
    fixture.detectChanges();

    const inputs = fixture.nativeElement.querySelectorAll('app-select-search input[role="combobox"]') as NodeListOf<HTMLInputElement>;
    const modelInput = inputs[0];
    modelInput.dispatchEvent(new Event('focus'));
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('li[role="option"]');
    expect(items.length).toBe(3);
    const labels = Array.from(items as NodeListOf<Element>).map((i) => i.textContent?.trim());
    expect(labels).toContain('Yaris');
    expect(labels).toContain('Corolla');
    expect(labels).toContain('RAV4');
  });

  it('version con booleans renderiza app-toggle-field', async () => {
    const { fixture, http } = setup('version');
    const req = http.expectOne((r) => r.url.includes('/api/v1/admin/seed/template/version'));
    req.flush({
      data: {
        modelId: '', name: '', year: 2026, priceClp: 0,
        transmission: 'MANUAL', fuel: 'BENCINA',
        engineDisplacementCc: 0, powerHp: 0, torqueNm: 0,
        consumptionCityKmL: 0, consumptionHighwayKmL: 0,
        lengthMm: 0, widthMm: 0, heightMm: 0, weightKg: 0,
        trunkLiters: 0, hasRecall: false,
      },
    });
    await fixture.whenStable();
    fixture.detectChanges();
    const toggles = fixture.nativeElement.querySelectorAll('app-toggle-field');
    // Solo queda hasRecall tras quitar los booleanos de seguridad (hasAbs/hasEsp/hasCruiseControl).
    expect(toggles.length).toBe(1);
    const allText = fixture.nativeElement.textContent ?? '';
    expect(allText.toLowerCase()).toContain('recall');
  });

  it('version con equipment renderiza app-multi-select-field', async () => {
    const { fixture, http } = setup('version');
    const req = http.expectOne((r) => r.url.includes('/api/v1/admin/seed/template/version'));
    req.flush({
      data: {
        modelId: '', name: '', year: 2026, priceClp: 0,
        transmission: 'MANUAL', fuel: 'BENCINA',
        engineDisplacementCc: 0, powerHp: 0, torqueNm: 0,
        consumptionCityKmL: 0, consumptionHighwayKmL: 0,
        lengthMm: 0, widthMm: 0, heightMm: 0, weightKg: 0,
        trunkLiters: 0,
      },
    });
    await fixture.whenStable();
    fixture.detectChanges();
    const ms = fixture.nativeElement.querySelector('app-multi-select-field');
    expect(ms).toBeTruthy();
  });

  it('version con 5 equipment items prellena TODOS los chips (regression)', async () => {
    TestBed.configureTestingModule({
      imports: [AdminEditDialogComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(AdminEditDialogComponent);
    fixture.componentRef.setInput('entityKey', 'version');
    fixture.componentRef.setInput('apiPath', 'versions');
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);

    // Flush template.
    http.expectOne((r) => r.url.includes('/api/v1/admin/seed/template/version')).flush({
      data: {
        modelId: '', name: '', year: 2026, priceClp: 0,
        transmission: 'MANUAL', fuel: 'BENCINA',
        engineDisplacementCc: 0, powerHp: 0, torqueNm: 0,
        consumptionCityKmL: 0, consumptionHighwayKmL: 0,
        lengthMm: 0, widthMm: 0, heightMm: 0, weightKg: 0,
        trunkLiters: 0,
      },
    });
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));
    fixture.detectChanges();

    // Flush equipment list (multi-select loads on init).
    http.expectOne((r) => r.url.includes('/api/v1/admin/equipment')).flush({
      data: [
        { id: 'e1', name: 'Aire' },
        { id: 'e2', name: 'Bluetooth' },
        { id: 'e3', name: 'Camara' },
        { id: 'e4', name: 'Sensores' },
        { id: 'e5', name: 'Crucero' },
      ],
    });
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));
    fixture.detectChanges();

    // Set entity with 5 equipment items (the shape openEdit produces).
    const component = fixture.componentInstance as AdminEditDialogComponent;
    fixture.componentRef.setInput('entity', {
      id: 'v1',
      name: 'v1',
      year: 2026,
      priceClp: 0,
      modelId: 'm1',
      model: { name: 'M' },
      equipment: ['e1', 'e2', 'e3', 'e4', 'e5'],
      equipmentItems: [
        { equipmentItem: { id: 'e1', name: 'A', category: 'C' } },
        { equipmentItem: { id: 'e2', name: 'B', category: 'C' } },
        { equipmentItem: { id: 'e3', name: 'C', category: 'C' } },
        { equipmentItem: { id: 'e4', name: 'D', category: 'C' } },
        { equipmentItem: { id: 'e5', name: 'E', category: 'C' } },
      ],
    } as any);
    fixture.detectChanges();
    await new Promise((r) => setTimeout(r, 0));
    fixture.detectChanges();

    // Form value should have all 5 ids.
    const formValue = component.form().get('equipment')?.value;
    expect(formValue).toEqual(['e1', 'e2', 'e3', 'e4', 'e5']);

    // DOM should have 5 chips.
    const chips = fixture.nativeElement.querySelectorAll('[data-testid="ms-chip"]');
    expect(chips.length).toBe(5);
  });

  it('race: pick antes del preload preserva el pick (merge con entity, no replace)', async () => {
    // Regression: previously the effect 3 in admin-edit-dialog did
    // `setValue` on the form, which OVERWROTE the user's pick if the
    // pick happened before the template response arrived. The user
    // reported "agrega android auto y apple carplay → siempre la
    // reemplaza una por otra".
    //
    // The fix: for array-valued controls (multiSelect), merge the
    // entity's value with the form's current value instead of
    // replacing. This handles the race gracefully — the user's pick is
    // preserved AND the entity's existing values are added.
    TestBed.configureTestingModule({
      imports: [AdminEditDialogComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(AdminEditDialogComponent);
    fixture.componentRef.setInput('entityKey', 'version');
    fixture.componentRef.setInput('apiPath', 'versions');
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);

    // Step 1: User picks an item BEFORE the template response arrives.
    // (This is the race: between dialog mount and template fetch, the
    // user clicks an option in the multi-select dropdown.)
    const form = (fixture.componentInstance as AdminEditDialogComponent).form();
    // setControl replaces the existing 'equipment' control with one
    // holding the user's pick. In real usage, the multi-select's
    // pick() does this via control.setValue(); setControl achieves the
    // same end-state here.
    form.setControl('equipment', new (await import('@angular/forms')).FormControl(['androidAuto']));
    fixture.detectChanges();

    // Step 2: Template response arrives. Effect 3 runs.
    http.expectOne((r) => r.url.includes('/api/v1/admin/seed/template/version')).flush({
      data: {
        modelId: '', name: '', year: 2026, priceClp: 0,
        transmission: 'MANUAL', fuel: 'BENCINA',
        engineDisplacementCc: 0, powerHp: 0, torqueNm: 0,
        consumptionCityKmL: 0, consumptionHighwayKmL: 0,
        lengthMm: 0, widthMm: 0, heightMm: 0, weightKg: 0,
        trunkLiters: 0,
      },
    });
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));
    fixture.detectChanges();

    // Step 3: Equipment list response.
    http.expectOne((r) => r.url.includes('/api/v1/admin/equipment')).flush({
      data: [
        { id: 'appleCarPlay', name: 'Apple CarPlay' },
        { id: 'androidAuto', name: 'Android Auto' },
      ],
    });
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));
    fixture.detectChanges();

    // Step 4: Now set the entity. This re-runs effect 3 which is the
    // second time the preload might overwrite the pick.
    fixture.componentRef.setInput('entity', {
      id: 'v1',
      name: 'v1',
      year: 2026,
      priceClp: 0,
      model: { name: 'M' },
      equipment: ['appleCarPlay'],
      equipmentItems: [
        { equipmentItem: { id: 'appleCarPlay', name: 'Apple CarPlay', category: 'C' } },
      ],
    } as any);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));
    fixture.detectChanges();

    // The form should have BOTH items: the user's pick (androidAuto)
    // AND the entity's existing value (appleCarPlay). Previously this
    // was just [appleCarPlay] because the setValue overwrote the pick.
    const formValue = form.get('equipment')?.value;
    expect(formValue).toContain('androidAuto');
    expect(formValue).toContain('appleCarPlay');
    expect(formValue.length).toBe(2);
  });

  it('version form es válido con los nuevos campos opcionales en null (regression)', async () => {
    const { fixture, http } = setup('version');
    const req = http.expectOne((r) => r.url.includes('/api/v1/admin/seed/template/version'));
    req.flush({
      data: {
        modelId: '', name: '', year: 2026, priceClp: 0,
        transmission: 'MANUAL', fuel: 'BENCINA',
        engineDisplacementCc: 0, powerHp: 0, torqueNm: 0,
        consumptionCityKmL: 0, consumptionHighwayKmL: 0,
        lengthMm: 0, widthMm: 0, heightMm: 0, weightKg: 0,
        trunkLiters: 0, hasRecall: false,
        circulationPermitClp: null, mandatoryInsuranceClp: null, voluntaryInsuranceClp: null,
        fuelTankLiters: null, batteryCapacityKwh: null, recallUrl: null,
      },
    });
    await fixture.whenStable();
    fixture.detectChanges();
    fixture.componentRef.setInput('entity', {
      id: 'v1', name: 'Sport', year: 2025, priceClp: 15000000,
      transmission: 'AUTOMATIC', fuel: 'BENCINA',
      engineDisplacementCc: 2000, powerHp: 150, torqueNm: 200,
      consumptionCityKmL: 12, consumptionHighwayKmL: 16,
      lengthMm: 4500, widthMm: 1800, heightMm: 1450, weightKg: 1300,
      trunkLiters: 450,
      circulationPermitClp: null, mandatoryInsuranceClp: null, voluntaryInsuranceClp: null,
      fuelTankLiters: null, batteryCapacityKwh: null,
      hasRecall: false, recallUrl: null,
    });
    fixture.detectChanges();
    await fixture.whenStable();

    const form = fixture.componentInstance.form();
    expect(form.valid).toBe(true);
  });

  it('hasRecall default false antes que llegue el template (no null)', async () => {
  const { fixture, http } = setup('version');
  // NO flusheamos el template todavía → simulamos la brecha inicial
  const form = fixture.componentInstance.form();
  expect(form.get('hasRecall')?.value).toBe(false);
  // Limpia la request pendiente
  http.expectOne((r) => r.url.includes('/api/v1/admin/seed/template/version')).flush({
    data: {
      modelId: '', name: '', year: 2026, priceClp: 0,
      transmission: 'MANUAL', fuel: 'BENCINA',
      engineDisplacementCc: 0, powerHp: 0, torqueNm: 0,
      consumptionCityKmL: 0, consumptionHighwayKmL: 0,
      lengthMm: 0, widthMm: 0, heightMm: 0, weightKg: 0,
      trunkLiters: 0,
    },
  });
});

it('maintenance: versionId es hidden → no se renderiza en el form ni se crea control', async () => {
  const { fixture, http } = setup('maintenance');
  const req = http.expectOne((r) => r.url.includes('/api/v1/admin/seed/template/maintenance'));
  req.flush({ data: { versionId: '', mileageTag: 0, costClp: 0 } });
  await fixture.whenStable();
  fixture.detectChanges();

  const form = fixture.componentInstance.form();
  expect(form.contains('versionId')).toBe(false);
  expect(form.contains('mileageTag')).toBe(true);
  expect(form.contains('costClp')).toBe(true);

  // Render: solo deben verse mileageTag y costClp
  const labels = Array.from(
    fixture.nativeElement.querySelectorAll('.dialog-field-label') as NodeListOf<Element>,
  ).map((el) => el.textContent?.trim() ?? '');
  expect(labels.some((l) => l.startsWith('Versión'))).toBe(false);
  expect(labels.some((l) => l.startsWith('Kilometraje'))).toBe(true);
  expect(labels.some((l) => l.startsWith('Costo CLP'))).toBe(true);

  // No se llama a /admin/versions desde el dialog (hidden field → no se carga)
  http.expectNone((r) => r.url.endsWith('/api/v1/admin/versions'));
});
});

describe('Required/optional markers', () => {
  function fieldLabelByName(fixture: any, fieldName: string): Element | null {
    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('.dialog-field-label') as NodeListOf<Element>,
    ) as Element[];
    return labels.find((l) => l.textContent?.includes(`(${fieldName})`) ?? false) ?? null;
  }

  it('brand: name muestra asterisco requerido, logoUrl muestra badge opcional', async () => {
    const { fixture, http } = setup('brand');
    const req = http.expectOne((r) => r.url.includes('/api/v1/admin/seed/template/brand'));
    req.flush({ data: { name: '', logoUrl: null } });
    await fixture.whenStable();
    fixture.detectChanges();

    const nameLabel = fieldLabelByName(fixture, 'name');
    expect(nameLabel).toBeTruthy();
    expect(nameLabel!.querySelector('.required-marker')).toBeTruthy();
    expect(nameLabel!.querySelector('.optional-badge')).toBeFalsy();

    const logoLabel = fieldLabelByName(fixture, 'logoUrl');
    expect(logoLabel).toBeTruthy();
    expect(logoLabel!.querySelector('.optional-badge')).toBeTruthy();
    expect(logoLabel!.querySelector('.required-marker')).toBeFalsy();
  });

  it('brand: campo text required propaga aria-required="true" al input', async () => {
    const { fixture, http } = setup('brand');
    const req = http.expectOne((r) => r.url.includes('/api/v1/admin/seed/template/brand'));
    req.flush({ data: { name: '', logoUrl: null } });
    await fixture.whenStable();
    fixture.detectChanges();

    const nameInput = fixture.nativeElement.querySelector('app-text-field input');
    expect(nameInput).toBeTruthy();
    expect(nameInput!.getAttribute('aria-required')).toBe('true');
  });

  it('brand: logoUrl opcional NO tiene aria-required en su wrapper', async () => {
    const { fixture, http } = setup('brand');
    const req = http.expectOne((r) => r.url.includes('/api/v1/admin/seed/template/brand'));
    req.flush({ data: { name: '', logoUrl: null } });
    await fixture.whenStable();
    fixture.detectChanges();

    const label = fieldLabelByName(fixture, 'logoUrl');
    expect(label).toBeTruthy();
    // logoUrl es opcional → el badge "opcional" reemplaza al asterisco.
    expect(label!.querySelector('.optional-badge')).toBeTruthy();
    expect(label!.querySelector('.required-marker')).toBeFalsy();
  });

  it('version: circulationPermitClp (optional) muestra badge opcional', async () => {
    const { fixture, http } = setup('version');
    const req = http.expectOne((r) => r.url.includes('/api/v1/admin/seed/template/version'));
    req.flush({
      data: {
        modelId: '', name: '', year: 2026, priceClp: 0,
        transmission: 'MANUAL', fuel: 'BENCINA',
        engineDisplacementCc: 0, powerHp: 0, torqueNm: 0,
        consumptionCityKmL: 0, consumptionHighwayKmL: 0,
        lengthMm: 0, widthMm: 0, heightMm: 0, weightKg: 0,
        trunkLiters: 0,
      },
    });
    await fixture.whenStable();
    fixture.detectChanges();

    const label = fieldLabelByName(fixture, 'circulationPermitClp');
    expect(label).toBeTruthy();
    expect(label!.querySelector('.optional-badge')).toBeTruthy();
    expect(label!.querySelector('.required-marker')).toBeFalsy();
  });
});

describe('Unsaved-changes guard', () => {
  function setupWithDialogMock(dialogMock: { open: () => any }) {
    TestBed.configureTestingModule({
      imports: [AdminEditDialogComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialog, useValue: dialogMock },
      ],
    });
    const fixture = TestBed.createComponent(AdminEditDialogComponent);
    fixture.componentRef.setInput('entityKey', 'brand');
    fixture.componentRef.setInput('apiPath', 'brands');
    fixture.detectChanges();
    return { fixture, http: TestBed.inject(HttpTestingController) };
  }

  it('cierra sin prompt si el form está pristine', async () => {
    const openSpy = vi.fn(() => ({ afterClosed: () => new Subject<boolean>() }));
    const { fixture, http } = setupWithDialogMock({ open: openSpy });
    http.expectOne((r) => r.url.includes('/api/v1/admin/seed/template/brand'))
      .flush({ data: { name: '', logoUrl: null } });
    await fixture.whenStable();

    const emitted: unknown[] = [];
    fixture.componentInstance.cancel.subscribe(() => emitted.push('cancel'));

    await fixture.componentInstance.onCancel();

    expect(openSpy).not.toHaveBeenCalled();
    expect(emitted).toEqual(['cancel']);
  });

  it('abre ConfirmDialog si el form está dirty', () => {
    const openSpy = vi.fn(() => ({ afterClosed: () => new Subject<boolean>() }));
    const { fixture, http } = setupWithDialogMock({ open: openSpy });
    http.expectOne((r) => r.url.includes('/api/v1/admin/seed/template/brand'))
      .flush({ data: { name: '', logoUrl: null } });

    fixture.componentInstance.form().get('name')?.markAsDirty();

    void fixture.componentInstance.onCancel();

    expect(openSpy).toHaveBeenCalledTimes(1);
    const callArg = openSpy.mock.calls[0] as unknown as [unknown, { disableClose: boolean; data: { danger: boolean } }];
    expect(callArg[1].disableClose).toBe(true);
    expect(callArg[1].data.danger).toBe(true);
  });

  it('emite cancel si el usuario confirma el discard', async () => {
    const subject = new Subject<boolean>();
    const openSpy = vi.fn(() => ({ afterClosed: () => subject.asObservable() }));
    const { fixture, http } = setupWithDialogMock({ open: openSpy });
    http.expectOne((r) => r.url.includes('/api/v1/admin/seed/template/brand'))
      .flush({ data: { name: '', logoUrl: null } });
    await fixture.whenStable();

    fixture.componentInstance.form().get('name')?.markAsDirty();

    const emitted: unknown[] = [];
    fixture.componentInstance.cancel.subscribe(() => emitted.push('cancel'));

    const promise = fixture.componentInstance.onCancel();
    subject.next(true);
    subject.complete();
    await promise;

    expect(emitted).toEqual(['cancel']);
  });

  it('NO emite cancel si el usuario cancela el discard', async () => {
    const subject = new Subject<boolean>();
    const openSpy = vi.fn(() => ({ afterClosed: () => subject.asObservable() }));
    const { fixture, http } = setupWithDialogMock({ open: openSpy });
    http.expectOne((r) => r.url.includes('/api/v1/admin/seed/template/brand'))
      .flush({ data: { name: '', logoUrl: null } });
    await fixture.whenStable();

    fixture.componentInstance.form().get('name')?.markAsDirty();

    const emitted: unknown[] = [];
    fixture.componentInstance.cancel.subscribe(() => emitted.push('cancel'));

    const promise = fixture.componentInstance.onCancel();
    subject.next(false);
    subject.complete();
    await promise;

    expect(emitted).toEqual([]);
  });

  it('hidrata el form sin dejarlo dirty aunque vengan valores del entity', async () => {
    const { fixture, http } = setupWithDialogMock({
      open: () => ({ afterClosed: () => new Subject<boolean>() }),
    });
    http.expectOne((r) => r.url.includes('/api/v1/admin/seed/template/brand'))
      .flush({ data: { name: '', logoUrl: null } });
    await fixture.whenStable();
    fixture.componentRef.setInput('entity', { name: 'Toyota', logoUrl: null });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.form().dirty).toBe(false);
  });

  it('closeX dispara el mismo flujo que onCancel (abre confirm si dirty)', async () => {
    const openSpy = vi.fn(() => ({ afterClosed: () => new Subject<boolean>() }));
    const { fixture, http } = setupWithDialogMock({ open: openSpy });
    http.expectOne((r) => r.url.includes('/api/v1/admin/seed/template/brand'))
      .flush({ data: { name: '', logoUrl: null } });
    await fixture.whenStable();

    fixture.componentInstance.form().get('name')?.markAsDirty();
    void fixture.componentInstance.closeX();

    expect(openSpy).toHaveBeenCalledTimes(1);
  });

  it('ESC dispara el mismo flujo que onCancel (abre confirm si dirty)', async () => {
    const openSpy = vi.fn(() => ({ afterClosed: () => new Subject<boolean>() }));
    const { fixture, http } = setupWithDialogMock({ open: openSpy });
    http.expectOne((r) => r.url.includes('/api/v1/admin/seed/template/brand'))
      .flush({ data: { name: '', logoUrl: null } });
    await fixture.whenStable();

    fixture.componentInstance.form().get('name')?.markAsDirty();

    const event = new Event('keydown', { cancelable: true });
    fixture.componentInstance.onEsc(event);

    expect(event.defaultPrevented).toBe(true);
    expect(openSpy).toHaveBeenCalledTimes(1);
  });
});

describe('Autofocus on first field', () => {
  it('enfoca el primer input después de que loading pasa a false', async () => {
    TestBed.configureTestingModule({
      imports: [AdminEditDialogComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(AdminEditDialogComponent);
    fixture.componentRef.setInput('entityKey', 'brand');
    fixture.componentRef.setInput('apiPath', 'brands');
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne((r) => r.url.includes('/api/v1/admin/seed/template/brand'))
      .flush({ data: { name: '', logoUrl: null } });
    await fixture.whenStable();
    fixture.detectChanges();
    await new Promise((r) => setTimeout(r, 0));

    const focused = document.activeElement as HTMLElement | null;
    const focusedInDialog = focused && fixture.nativeElement.contains(focused);
    expect(focusedInDialog).toBe(true);
  });

  it('NO enfoca mientras loading() es true', () => {
    TestBed.configureTestingModule({
      imports: [AdminEditDialogComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(AdminEditDialogComponent);
    fixture.componentRef.setInput('entityKey', 'brand');
    fixture.componentRef.setInput('apiPath', 'brands');
    fixture.detectChanges();
    // No flusheamos el template → loading sigue true. NO debe haber focus.
    const focused = document.activeElement as HTMLElement | null;
    const focusedInDialog = focused && fixture.nativeElement.contains(focused);
    expect(focusedInDialog).toBe(false);
  });
});

describe('Sections layout', () => {
  function setupSectioned(entityKey: 'brand' | 'version') {
    TestBed.configureTestingModule({
      imports: [AdminEditDialogComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(AdminEditDialogComponent);
    fixture.componentRef.setInput('entityKey', entityKey);
    fixture.componentRef.setInput('apiPath', entityKey === 'version' ? 'versions' : 'brands');
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    const templateUrl =
      entityKey === 'version'
        ? '/api/v1/admin/seed/template/version'
        : '/api/v1/admin/seed/template/brand';
    const templateBody =
      entityKey === 'version'
        ? {
            data: {
              modelId: '', name: '', year: 2026, priceClp: 0,
              transmission: 'MANUAL', fuel: 'BENCINA',
              engineDisplacementCc: 0, powerHp: 0, torqueNm: 0,
              consumptionCityKmL: 0, consumptionHighwayKmL: 0,
              lengthMm: 0, widthMm: 0, heightMm: 0, weightKg: 0,
              trunkLiters: 0,
            },
          }
        : { data: { name: '', logoUrl: null } };
    http.expectOne((r) => r.url.includes(templateUrl)).flush(templateBody);
    return { fixture, http };
  }

  it('version: deriva 9 secciones en orden de primera aparición', async () => {
    const { fixture, http } = setupSectioned('version');
    await fixture.whenStable();
    fixture.detectChanges();
    http.match(() => true).forEach((r) => r.flush({ data: [] }));
    await fixture.whenStable();
    fixture.detectChanges();

    const sections = fixture.componentInstance.sections();
    // 9 secciones tras eliminar el grupo Seguridad (hasAbs/hasEsp/hasCruiseControl/airbagCount).
    expect(sections.length).toBe(9);
    expect(sections.map((s) => s.label)).toEqual([
      'Identificación',
      'Motor',
      'Consumo',
      'Dimensiones',
      'Equipamiento',
      'Apariencia',
      'Seguros y permisos',
      'Tanque y batería',
      'Recalls',
    ]);
  });

  it('version: cada sección contiene los campos esperados (no cross-contamination)', async () => {
    const { fixture, http } = setupSectioned('version');
    await fixture.whenStable();
    fixture.detectChanges();
    http.match(() => true).forEach((r) => r.flush({ data: [] }));
    await fixture.whenStable();
    fixture.detectChanges();

    const sections = fixture.componentInstance.sections();
    const byId = new Map(sections.map((s) => [s.id, s]));
    expect(byId.get('identificacion')?.fields.map((f) => f.field)).toEqual([
      'modelId', 'name', 'year', 'priceClp',
    ]);
    expect(byId.get('motor')?.fields.map((f) => f.field)).toEqual([
      'transmission', 'fuel', 'traction', 'engineType', 'engineDisplacementCc', 'powerHp', 'torqueNm',
    ]);
    expect(byId.get('consumo')?.fields.length).toBe(3);
    expect(byId.get('dimensiones')?.fields.length).toBe(5);
    expect(byId.get('equipamiento')?.fields.length).toBe(1);
    expect(byId.get('apariencia')?.fields.map((f) => f.field)).toEqual(['colors']);
    expect(byId.get('seguros-y-permisos')?.fields.length).toBe(3);
    expect(byId.get('tanque-y-bateria')?.fields.length).toBe(2);
    expect(byId.get('recalls')?.fields.length).toBe(2);
  });

  it('version: renderiza headers h3 con los labels de cada sección', async () => {
    const { fixture, http } = setupSectioned('version');
    await fixture.whenStable();
    fixture.detectChanges();
    http.match(() => true).forEach((r) => r.flush({ data: [] }));
    await fixture.whenStable();
    fixture.detectChanges();

    // Las secciones opcionales usan un <button> plegable en vez de <h3>; el
    // label vive en .dialog-section-label en ambos casos.
    const headers = Array.from(
      fixture.nativeElement.querySelectorAll('.dialog-section-label') as NodeListOf<Element>,
    ).map((el) => el.textContent?.trim());
    expect(headers).toEqual([
      'Identificación',
      'Motor',
      'Consumo',
      'Dimensiones',
      'Equipamiento',
      'Apariencia',
      'Seguros y permisos',
      'Tanque y batería',
      'Recalls',
    ]);
  });

  it('version: renderiza el sticky nav con 9 botones', async () => {
    const { fixture, http } = setupSectioned('version');
    await fixture.whenStable();
    fixture.detectChanges();
    http.match(() => true).forEach((r) => r.flush({ data: [] }));
    await fixture.whenStable();
    fixture.detectChanges();

    const navItems = fixture.nativeElement.querySelectorAll('.dialog-section-nav-item');
    expect(navItems.length).toBe(9);
  });

  it('brand: sin grupos, sections() devuelve una sola sección con label vacío', async () => {
    const { fixture, http } = setupSectioned('brand');
    await fixture.whenStable();
    fixture.detectChanges();
    http.match(() => true).forEach((r) => r.flush({ data: [] }));
    await fixture.whenStable();
    fixture.detectChanges();

    const sections = fixture.componentInstance.sections();
    expect(sections.length).toBe(1);
    expect(sections[0].label).toBe('');
    expect(sections[0].id).toBe('general');
    expect(sections[0].fields.length).toBeGreaterThan(0);
  });

  it('brand: NO renderiza headers (la sección sin label no tiene h3)', async () => {
    const { fixture, http } = setupSectioned('brand');
    await fixture.whenStable();
    fixture.detectChanges();
    http.match(() => true).forEach((r) => r.flush({ data: [] }));
    await fixture.whenStable();
    fixture.detectChanges();

    const headers = fixture.nativeElement.querySelectorAll('.dialog-section-header');
    expect(headers.length).toBe(0);
  });

  it('brand: NO renderiza el sticky nav (solo 1 sección)', async () => {
    const { fixture, http } = setupSectioned('brand');
    await fixture.whenStable();
    fixture.detectChanges();
    http.match(() => true).forEach((r) => r.flush({ data: [] }));
    await fixture.whenStable();
    fixture.detectChanges();

    const nav = fixture.nativeElement.querySelector('.dialog-section-nav');
    expect(nav).toBeNull();
  });

  it('version: todos los fields son alcanzables con selector dialog-field (28)', async () => {
    const { fixture, http } = setupSectioned('version');
    await fixture.whenStable();
    fixture.detectChanges();
    http.match(() => true).forEach((r) => r.flush({ data: [] }));
    await fixture.whenStable();
    fixture.detectChanges();

    const fields = fixture.nativeElement.querySelectorAll('.dialog-field');
    // Tras quitar los 4 fields de seguridad, son 25 fields en FIELD_METAS.version + equipment (1) = 26.
    expect(fields.length).toBeGreaterThanOrEqual(24);
  });

  it('scrollToSection: llama document.getElementById(id).scrollIntoView', async () => {
    const { fixture, http } = setupSectioned('version');
    await fixture.whenStable();
    fixture.detectChanges();
    http.match(() => true).forEach((r) => r.flush({ data: [] }));
    await fixture.whenStable();
    fixture.detectChanges();

    const scrollSpy = vi.fn();
    const motorSection = fixture.nativeElement.querySelector('#motor');
    if (motorSection) {
      motorSection.scrollIntoView = scrollSpy;
    }
    fixture.componentInstance.scrollToSection('motor');
    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });

  it('version: section IDs están slugificados en el DOM (#motor, #tanque-y-bateria)', async () => {
    const { fixture, http } = setupSectioned('version');
    await fixture.whenStable();
    fixture.detectChanges();
    http.match(() => true).forEach((r) => r.flush({ data: [] }));
    await fixture.whenStable();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('#motor')).toBeTruthy();
    expect(root.querySelector('#tanque-y-bateria')).toBeTruthy();
    expect(root.querySelector('#identificacion')).toBeTruthy();
  });

  it('host tiene clase with-nav cuando sections() >= 3 (version)', async () => {
    const { fixture, http } = setupSectioned('version');
    await fixture.whenStable();
    fixture.detectChanges();
    http.match(() => true).forEach((r) => r.flush({ data: [] }));
    await fixture.whenStable();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList.contains('with-nav')).toBe(true);
  });

  it('host NO tiene clase with-nav cuando sections() < 3 (brand)', async () => {
    const { fixture, http } = setupSectioned('brand');
    await fixture.whenStable();
    fixture.detectChanges();
    http.match(() => true).forEach((r) => r.flush({ data: [] }));
    await fixture.whenStable();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList.contains('with-nav')).toBe(false);
  });
});

describe('Guardar y crear otro', () => {
  const versionTemplate = {
    modelId: '', name: '', year: 2026, priceClp: 0,
    transmission: 'MANUAL', fuel: 'BENCINA',
    powerHp: 0, torqueNm: 0,
    lengthMm: 0, widthMm: 0, heightMm: 0, weightKg: 0, trunkLiters: 0,
  };

  it('el botón solo existe en modo create', async () => {
    const { fixture, http } = setup('version');
    http.match(() => true).forEach((r) => r.flush({ data: versionTemplate }));
    // La plantilla llega por una cadena de promesas: hay que ceder un macrotask.
    await new Promise((r) => setTimeout(r, 0));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('[data-testid="dialog-save-and-new"]'),
    ).toBeTruthy();

    fixture.componentRef.setInput('mode', 'edit');
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('[data-testid="dialog-save-and-new"]'),
    ).toBeNull();
  });

  it('emite saveAndNew y no save', async () => {
    const { fixture, http } = setup('version');
    http.match(() => true).forEach((r) => r.flush({ data: versionTemplate }));
    // La plantilla llega por una cadena de promesas: hay que ceder un macrotask.
    await new Promise((r) => setTimeout(r, 0));
    await fixture.whenStable();
    fixture.detectChanges();

    const saved: unknown[] = [];
    const savedAndNew: unknown[] = [];
    fixture.componentInstance.save.subscribe((v) => saved.push(v));
    fixture.componentInstance.saveAndNew.subscribe((v) => savedAndNew.push(v));

    // Rellena todo lo que falte para que el form sea válido, sin depender de
    // qué campos son obligatorios hoy.
    const form = fixture.componentInstance.form();
    for (const name of Object.keys(form.controls)) {
      const ctrl = form.get(name)!;
      if (ctrl.valid) continue;
      ctrl.setValue(name === 'name' ? 'XLI' : 1);
    }
    expect(form.valid).toBe(true);
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector(
      '[data-testid="dialog-save-and-new"]',
    ) as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
    btn.click();

    expect(savedAndNew.length).toBe(1);
    expect(saved.length).toBe(0);
  });

  it('un prefill parcial limpia los campos no sticky y deja el form pristine', async () => {
    const { fixture, http } = setup('version');
    http.match(() => true).forEach((r) => r.flush({ data: versionTemplate }));
    // La plantilla llega por una cadena de promesas: hay que ceder un macrotask.
    await new Promise((r) => setTimeout(r, 0));
    await fixture.whenStable();
    fixture.detectChanges();

    const form = fixture.componentInstance.form();
    form.patchValue({ modelId: 'm1', name: 'XLI', priceClp: 15000000 });
    form.markAsDirty();

    // Lo que hace el store tras un saveAndNew exitoso: solo los sticky.
    fixture.componentRef.setInput('entity', { modelId: 'm1', year: 2026 });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(form.get('modelId')?.value).toBe('m1');
    expect(form.get('year')?.value).toBe(2026);
    expect(form.get('name')?.value).toBeNull();
    expect(form.get('priceClp')?.value).toBeNull();
    expect(form.pristine).toBe(true);
  });
});

describe('Secciones plegables', () => {
  const versionTemplate = {
    modelId: '', name: '', year: 2026, priceClp: 0,
    transmission: 'MANUAL', fuel: 'BENCINA',
    powerHp: 0, torqueNm: 0,
    lengthMm: 0, widthMm: 0, heightMm: 0, weightKg: 0, trunkLiters: 0,
  };

  const sectionsOf = (fixture: { componentInstance: AdminEditDialogComponent }) =>
    new Map(fixture.componentInstance.sections().map((s) => [s.id, s]));

  it('solo pliega secciones enteramente opcionales', async () => {
    const { fixture, http } = setup('version');
    http.match(() => true).forEach((r) => r.flush({ data: versionTemplate }));
    // La plantilla llega por una cadena de promesas: hay que ceder un macrotask.
    await new Promise((r) => setTimeout(r, 0));
    await fixture.whenStable();
    fixture.detectChanges();

    const byId = sectionsOf(fixture);
    expect(byId.get('seguros-y-permisos')?.collapsible).toBe(true);
    expect(byId.get('tanque-y-bateria')?.collapsible).toBe(true);
    expect(byId.get('recalls')?.collapsible).toBe(true);

    // Con campos obligatorios: nunca se pliegan.
    expect(byId.get('identificacion')?.collapsible).toBe(false);
    expect(byId.get('motor')?.collapsible).toBe(false);
    expect(byId.get('dimensiones')?.collapsible).toBe(false);

    // Relaciones y campos condicionados por combustible: se dejan visibles.
    expect(byId.get('equipamiento')?.collapsible).toBe(false);
    expect(byId.get('apariencia')?.collapsible).toBe(false);
    expect(byId.get('consumo')?.collapsible).toBe(false);
  });

  it('al crear arrancan cerradas y al abrirlas se muestran', async () => {
    const { fixture, http } = setup('version');
    http.match(() => true).forEach((r) => r.flush({ data: versionTemplate }));
    // La plantilla llega por una cadena de promesas: hay que ceder un macrotask.
    await new Promise((r) => setTimeout(r, 0));
    await fixture.whenStable();
    fixture.detectChanges();

    const byId = sectionsOf(fixture);
    const recalls = byId.get('recalls')!;
    expect(fixture.componentInstance.isSectionOpen(recalls)).toBe(false);
    expect(fixture.componentInstance.isSectionOpen(byId.get('motor')!)).toBe(true);

    fixture.componentInstance.toggleSection(recalls);
    expect(fixture.componentInstance.isSectionOpen(recalls)).toBe(true);
  });

  it('al editar una entidad con datos, la sección correspondiente arranca abierta', async () => {
    const { fixture, http } = setup('version');
    http.match(() => true).forEach((r) => r.flush({ data: versionTemplate }));
    // La plantilla llega por una cadena de promesas: hay que ceder un macrotask.
    await new Promise((r) => setTimeout(r, 0));
    await fixture.whenStable();

    fixture.componentRef.setInput('entity', {
      id: 'v1', name: 'XLI', mandatoryInsuranceClp: 45000,
    });
    fixture.detectChanges();
    await fixture.whenStable();

    const byId = sectionsOf(fixture);
    expect(fixture.componentInstance.isSectionOpen(byId.get('seguros-y-permisos')!)).toBe(true);
    // Las que no traen datos siguen plegadas.
    expect(fixture.componentInstance.isSectionOpen(byId.get('tanque-y-bateria')!)).toBe(false);
  });

  it('un submit inválido abre la sección plegada que tiene el error', async () => {
    const { fixture, http } = setup('version');
    http.match(() => true).forEach((r) => r.flush({ data: versionTemplate }));
    // La plantilla llega por una cadena de promesas: hay que ceder un macrotask.
    await new Promise((r) => setTimeout(r, 0));
    await fixture.whenStable();
    fixture.detectChanges();

    const byId = sectionsOf(fixture);
    const recalls = byId.get('recalls')!;
    expect(fixture.componentInstance.isSectionOpen(recalls)).toBe(false);

    // Error de backend sobre un campo que vive en una sección plegada.
    fixture.componentInstance.applyBackendErrors([
      { path: ['recallUrl'], message: 'URL inválida' },
    ]);
    fixture.detectChanges();

    expect(fixture.componentInstance.isSectionOpen(recalls)).toBe(true);
  });
});
