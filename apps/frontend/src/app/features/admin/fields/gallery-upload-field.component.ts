import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../../core/api.service';
import { ENV } from '../../../core/env';

@Component({
  selector: 'app-gallery-upload-field',
  imports: [ReactiveFormsModule],
  templateUrl: './gallery-upload-field.component.html',
  styleUrl: './gallery-upload-field.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalleryUploadFieldComponent {
  private api = inject(ApiService);

  readonly control = input.required<FormControl<string[] | null>>();
  readonly uploading = signal(false);
  readonly error = signal<string | null>(null);

  readonly urls = computed<string[]>(() => {
    const v = this.control().value;
    return Array.isArray(v) ? v : [];
  });

  previewUrl(url: string): string {
    if (url.startsWith('http')) return url;
    return `${ENV.apiBase.replace(/\/api\/v1$/, '')}${url}`;
  }

  trackByUrl = (_: number, url: string): string => url;

  async onFileChange(ev: Event): Promise<void> {
    const input = ev.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (files.length === 0) return;
    this.uploading.set(true);
    this.error.set(null);
    const current = this.urls();
    const next: string[] = [...current];
    try {
      for (const file of files) {
        const res = await this.api.upload(file);
        next.push(res.data.url);
      }
      this.control().setValue(next);
      this.control().markAsDirty();
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.uploading.set(false);
      input.value = '';
    }
  }

  removeAt(index: number): void {
    const current = this.urls();
    if (index < 0 || index >= current.length) return;
    const next = current.slice();
    next.splice(index, 1);
    this.control().setValue(next);
    this.control().markAsDirty();
  }
}
