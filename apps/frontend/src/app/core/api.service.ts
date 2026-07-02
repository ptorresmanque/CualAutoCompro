import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ENV } from './env';

export type QueryParams = Record<string, string | number | boolean>;

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  async get<T>(path: string, params?: QueryParams): Promise<T> {
    let httpParams: HttpParams | undefined;
    if (params) {
      httpParams = new HttpParams();
      for (const [key, value] of Object.entries(params)) {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return firstValueFrom(
      this.http.get<T>(`${ENV.apiBase}${path}`, {
        withCredentials: true,
        params: httpParams,
      }),
    );
  }

  post<T>(path: string, body: unknown): Promise<T> {
    return firstValueFrom(
      this.http.post<T>(`${ENV.apiBase}${path}`, body, {
        withCredentials: true,
      }),
    );
  }

  patch<T>(path: string, body: unknown): Promise<T> {
    return firstValueFrom(
      this.http.patch<T>(`${ENV.apiBase}${path}`, body, {
        withCredentials: true,
      }),
    );
  }

  delete<T>(path: string): Promise<T> {
    return firstValueFrom(
      this.http.delete<T>(`${ENV.apiBase}${path}`, {
        withCredentials: true,
      }),
    );
  }

  async upload(
    file: File,
  ): Promise<{ data: { url: string; filename: string; size: number; mime: string } }> {
    const fd = new FormData();
    fd.append('file', file);
    return firstValueFrom(
      this.http.post<{
        data: { url: string; filename: string; size: number; mime: string };
      }>(`${ENV.apiBase}/admin/uploads`, fd, { withCredentials: true }),
    );
  }
}
