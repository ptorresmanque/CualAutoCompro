import { TestBed } from '@angular/core/testing';
import {
  provideHttpClient,
  withInterceptors,
  HttpClient,
} from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';
import { ENV } from './env';

describe('authInterceptor', () => {
  let http: HttpClient;
  let mock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    mock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => mock.verify());

  it('añade withCredentials en requests contra apiBase', () => {
    http.get(`${ENV.apiBase}/auth/me`).subscribe();
    const req = mock.expectOne(`${ENV.apiBase}/auth/me`);
    expect(req.request.withCredentials).toBe(true);
    req.flush({ data: null });
  });

  it('no añade withCredentials en requests fuera de apiBase', () => {
    http.get('https://example.com/other').subscribe();
    const req = mock.expectOne('https://example.com/other');
    expect(req.request.withCredentials).toBe(false);
    req.flush({});
  });
});
