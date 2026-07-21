import { signal } from '@angular/core';
import { Component, ViewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ComparisonsComponent } from './comparisons.component';
import { AuthService, type User } from '../../core/auth.service';

class AuthServiceStub {
  currentUser = signal<User | null>({ id: 'u1', email: 'u@test.cl', name: 'U', role: 'USER' });
}

@Component({
  selector: 'app-test-host',
  standalone: true,
  imports: [ComparisonsComponent],
  template: `<app-comparisons />`,
})
class TestHostComponent {
  @ViewChild(ComparisonsComponent) component!: ComparisonsComponent;
}

describe('ComparisonsComponent', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useClass: AuthServiceStub },
      ],
    });
  });

  afterEach(() => {
    http?.verify();
  });

  it('CTA "Ir al catálogo" del estado vacío apunta a /catalogo', async () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    http = TestBed.inject(HttpTestingController);
    http
      .expectOne((r) => r.url.includes('/api/v1/me/comparisons'))
      .flush({ data: [] });
    await fixture.componentInstance.component.initialLoad;
    fixture.detectChanges();

    const cta = fixture.nativeElement.querySelector(
      '[data-testid="empty-cta-catalog"]',
    ) as HTMLAnchorElement;
    expect(cta).not.toBeNull();
    expect(cta.getAttribute('href')).toBe('/catalogo');
    expect(cta.getAttribute('routerLink')).toBe('/catalogo');
  });
});
