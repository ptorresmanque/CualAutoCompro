import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { loadingInterceptor } from './loading.interceptor';
import { LoadingService } from './loading.service';

describe('loadingInterceptor', () => {
  it('returns to loading=false after a /api request settles', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withFetch(), withInterceptors([loadingInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    const http = TestBed.inject(HttpClient);
    const ctrl = TestBed.inject(HttpTestingController);
    const loading = TestBed.inject(LoadingService);

    expect(loading.loading()).toBe(false);

    let resolved = false;
    http.get('/api/v1/whatever').subscribe({
      next: () => (resolved = true),
      error: () => (resolved = true),
    });

    const req = ctrl.expectOne('/api/v1/whatever');
    req.flush({ data: null, error: null });

    // Allow finalization (decrement) to run.
    await new Promise((r) => setTimeout(r, 0));
    expect(resolved).toBe(true);
    expect(loading.loading()).toBe(false);
  });

  it('does not affect the loading counter for non-API requests', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withFetch(), withInterceptors([loadingInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    const http = TestBed.inject(HttpClient);
    const ctrl = TestBed.inject(HttpTestingController);
    const loading = TestBed.inject(LoadingService);

    expect(loading.loading()).toBe(false);

    http.get('/assets/logo.png', { responseType: 'blob' }).subscribe();
    const req = ctrl.expectOne('/assets/logo.png');
    req.flush(new Blob());

    await new Promise((r) => setTimeout(r, 0));
    expect(loading.loading()).toBe(false);
  });
});
