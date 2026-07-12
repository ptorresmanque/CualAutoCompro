import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ENV } from './env';
import { unwrap, type ApiResponse } from './api-error';

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

  /**
   * Like `get()` but unwraps the `ApiResponse<T>` envelope and throws
   * `ApiCallError` if `error !== null`. Use this for new code that wants
   * typed access to backend errors (especially `error.fields`).
   */
  async getUnwrapped<T>(path: string, params?: QueryParams): Promise<T> {
    const response = await this.get<ApiResponse<T>>(path, params);
    return unwrap(response);
  }

  post<T>(path: string, body: unknown): Promise<T> {
    return firstValueFrom(
      this.http.post<T>(`${ENV.apiBase}${path}`, body, {
        withCredentials: true,
      }),
    );
  }

  /**
   * Like `post()` but unwraps the `ApiResponse<T>` envelope and throws
   * `ApiCallError` if `error !== null`.
   */
  async postUnwrapped<T>(path: string, body: unknown): Promise<T> {
    const response = await this.post<ApiResponse<T>>(path, body);
    return unwrap(response);
  }

  patch<T>(path: string, body: unknown): Promise<T> {
    return firstValueFrom(
      this.http.patch<T>(`${ENV.apiBase}${path}`, body, {
        withCredentials: true,
      }),
    );
  }

  /**
   * Like `patch()` but unwraps the `ApiResponse<T>` envelope and throws
   * `ApiCallError` if `error !== null`.
   */
  async patchUnwrapped<T>(path: string, body: unknown): Promise<T> {
    const response = await this.patch<ApiResponse<T>>(path, body);
    return unwrap(response);
  }

  delete<T>(path: string): Promise<T> {
    return firstValueFrom(
      this.http.delete<T>(`${ENV.apiBase}${path}`, {
        withCredentials: true,
      }),
    );
  }

  /**
   * Like `delete()` but unwraps the `ApiResponse<T>` envelope and throws
   * `ApiCallError` if `error !== null`.
   */
  async deleteUnwrapped<T>(path: string): Promise<T> {
    const response = await this.delete<ApiResponse<T>>(path);
    return unwrap(response);
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
