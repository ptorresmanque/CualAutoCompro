import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../../core/api.service';
import { ENV } from '../../../core/env';

@Component({
  selector: 'app-image-upload-field',
  imports: [ReactiveFormsModule],
  templateUrl: './image-upload-field.component.html',
  styleUrl: './image-upload-field.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageUploadFieldComponent {
  private api = inject(ApiService);

  readonly control = input.required<FormControl<string | null>>();
  readonly uploading = signal(false);
  readonly error = signal<string | null>(null);

  previewUrl(): string | null {
    const v = this.control().value;
    if (!v) return null;
    if (v.startsWith('http')) return v;
    return `${ENV.apiBase.replace(/\/api\/v1$/, '')}${v}`;
  }

  async onFileChange(ev: Event): Promise<void> {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploading.set(true);
    this.error.set(null);
    try {
      const res = await this.api.upload(file);
      this.control().setValue(res.data.url);
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.uploading.set(false);
      input.value = '';
    }
  }

  clear(): void {
    this.control().setValue(null);
  }
}