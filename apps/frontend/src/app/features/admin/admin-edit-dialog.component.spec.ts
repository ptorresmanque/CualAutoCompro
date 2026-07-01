import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AdminEditDialogComponent } from './admin-edit-dialog.component';

describe('AdminEditDialogComponent', () => {
  it('carga el template del backend y arma el form', async () => {
    TestBed.configureTestingModule({
      imports: [AdminEditDialogComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(AdminEditDialogComponent);
    fixture.componentRef.setInput('entityKey', 'brand');
    fixture.componentRef.setInput('apiPath', 'brands');
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    const req = http.expectOne((r) => r.url.includes('/api/v1/admin/seed/template/brand'));
    req.flush({ data: { name: '', logoUrl: null } });
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));
    expect(fixture.componentInstance.form.contains('name')).toBe(true);
  });

  it('loadJson parsea y popula form', async () => {
    TestBed.configureTestingModule({
      imports: [AdminEditDialogComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(AdminEditDialogComponent);
    fixture.componentRef.setInput('entityKey', 'brand');
    fixture.componentRef.setInput('apiPath', 'brands');
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne((r) => r.url.includes('/api/v1/admin/seed/template/brand')).flush({ data: { name: '', logoUrl: null } });
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));
    fixture.componentInstance.switchTab('json');
    fixture.componentInstance.jsonText.set(JSON.stringify({ name: 'Toyota', logoUrl: null }));
    fixture.componentInstance.loadJson();
    expect(fixture.componentInstance.form.get('name')?.value).toBe('Toyota');
  });
});
