import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../../core/api.service';
import { toApiCallError } from '../../../core/api-error';
import { toAbsoluteUploadUrl } from '../../../core/upload-url';

@Component({
  selector: 'app-gallery-upload-field',
  imports: [ReactiveFormsModule, MatButtonModule, MatIconModule],
  templateUrl: './gallery-upload-field.component.html',
  styleUrl: './gallery-upload-field.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalleryUploadFieldComponent {
  private api = inject(ApiService);

  readonly control = input.required<FormControl<string[] | null>>();
  readonly uploading = signal(false);
  readonly error = signal<string | null>(null);

  urls(): string[] {
    const v = this.control().value;
    return Array.isArray(v) ? v : [];
  }

  previewUrl(url: string): string {
    return toAbsoluteUploadUrl(url) ?? url;
  }

  trackByUrl = (_: number, url: string): string => url;

  async onFileChange(ev: Event): Promise<void> {
    const input = ev.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (files.length === 0) return;
    this.uploading.set(true);
    this.error.set(null);
    const next: string[] = [...this.urls()];
    try {
      for (const file of files) {
        const res = await this.api.upload(file);
        next.push(res.data.url);
      }
      this.control().setValue(next);
      this.control().markAsDirty();
    } catch (e) {
      // Ver nota en image-upload-field: el mensaje de `HttpErrorResponse` es
      // genérico y oculta el motivo real del 400 que manda el backend.
      this.error.set(
        toApiCallError(e)?.message ?? 'No se pudo subir la imagen. Intenta nuevamente.',
      );
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
