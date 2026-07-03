import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../../core/api.service';
import { toAbsoluteUploadUrl } from '../../../core/upload-url';

@Component({
  selector: 'app-image-upload-field',
  imports: [ReactiveFormsModule, MatButtonModule, MatIconModule],
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
    return toAbsoluteUploadUrl(this.control().value);
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
