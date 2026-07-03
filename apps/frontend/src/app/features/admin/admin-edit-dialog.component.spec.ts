import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AdminEditDialogComponent } from './admin-edit-dialog.component';

describe('AdminEditDialogComponent', () => {
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
        trunkLiters: 0, airbagCount: 0,
        hasAbs: false, hasEsp: false, hasCruiseControl: false,
      },
    });
    await fixture.whenStable();
    fixture.detectChanges();
    const toggles = fixture.nativeElement.querySelectorAll('app-toggle-field');
    expect(toggles.length).toBe(3);
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
        trunkLiters: 0, airbagCount: 0,
        hasAbs: false, hasEsp: false, hasCruiseControl: false,
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
        trunkLiters: 0, airbagCount: 0,
        hasAbs: false, hasEsp: false, hasCruiseControl: false,
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
        trunkLiters: 0, airbagCount: 0,
        hasAbs: false, hasEsp: false, hasCruiseControl: false,
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
});
