import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { MaintenanceAdminComponent } from './maintenance-admin.component';

describe('MaintenanceAdminComponent', () => {
  it('carga lista de versiones y permite crear tras seleccionar', async () => {
    TestBed.configureTestingModule({
      imports: [MaintenanceAdminComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(MaintenanceAdminComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    const reqs = http.match(() => true);
    expect(reqs.length).toBeGreaterThan(0);
    for (const r of reqs) {
      r.flush({ data: { total: 1, items: [{ id: 'v1', name: 'XLI', model: { name: 'Corolla' } }], page: 1, pageSize: 50 } });
    }
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));
    expect(fixture.componentInstance.versions().length).toBeGreaterThan(0);
    fixture.componentInstance.onVersionChange('v1');
    await fixture.whenStable();
    const mainReqs = http.match(() => true);
    for (const r of mainReqs) r.flush({ data: [] });
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));
    fixture.componentInstance.openCreate();
    expect(fixture.componentInstance.dialogEntity()).toBeNull();
  });
});
