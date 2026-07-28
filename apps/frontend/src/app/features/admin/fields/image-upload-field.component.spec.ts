import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ImageUploadFieldComponent } from './image-upload-field.component';

describe('ImageUploadFieldComponent', () => {
  it('muestra preview cuando control.value es una URL', () => {
    TestBed.configureTestingModule({ imports: [ImageUploadFieldComponent] });
    const fixture = TestBed.createComponent(ImageUploadFieldComponent);
    const ctrl = new FormControl<string | null>('/uploads/2026-07/abc.png');
    fixture.componentRef.setInput('control', ctrl);
    fixture.detectChanges();
    const img: HTMLImageElement = fixture.nativeElement.querySelector('img[data-testid="preview"]');
    expect(img.src).toContain('/uploads/2026-07/abc.png');
  });

  it('al seleccionar un archivo, sube y asigna la URL al control', async () => {
    TestBed.configureTestingModule({
      imports: [ImageUploadFieldComponent, ReactiveFormsModule],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(ImageUploadFieldComponent);
    const ctrl = new FormControl<string | null>(null);
    fixture.componentRef.setInput('control', ctrl);
    fixture.detectChanges();
    const file = new File([new Uint8Array([1, 2, 3])], 'photo.png', { type: 'image/png' });
    const inputEl: HTMLInputElement = fixture.nativeElement.querySelector('input[type="file"]');
    Object.defineProperty(inputEl, 'files', { value: [file] });
    inputEl.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();
    const http = TestBed.inject(HttpTestingController);
    const req = http.expectOne((r) => r.url.includes('/api/v1/admin/uploads'));
    req.flush({ data: { url: '/uploads/2026-07/xyz.png', filename: 'xyz.png', size: 3, mime: 'image/png' } });
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
    fixture.detectChanges();
    expect(ctrl.value).toBe('/uploads/2026-07/xyz.png');
  });

  it('muestra el mensaje del backend cuando el upload devuelve 400', async () => {
    TestBed.configureTestingModule({
      imports: [ImageUploadFieldComponent, ReactiveFormsModule],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(ImageUploadFieldComponent);
    const ctrl = new FormControl<string | null>(null);
    fixture.componentRef.setInput('control', ctrl);
    fixture.detectChanges();
    const file = new File([new Uint8Array([1, 2, 3])], 'raro.png', { type: 'image/png' });
    const inputEl: HTMLInputElement = fixture.nativeElement.querySelector('input[type="file"]');
    Object.defineProperty(inputEl, 'files', { value: [file] });
    inputEl.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();
    const http = TestBed.inject(HttpTestingController);
    const req = http.expectOne((r) => r.url.includes('/api/v1/admin/uploads'));
    req.flush(
      {
        data: null,
        error: { code: 'BAD_REQUEST', message: 'El archivo no es una imagen válida' },
      },
      { status: 400, statusText: 'Bad Request' },
    );
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
    fixture.detectChanges();
    expect(ctrl.value).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('El archivo no es una imagen válida');
  });

  it('botón borrar pone el control en null', () => {
    TestBed.configureTestingModule({ imports: [ImageUploadFieldComponent] });
    const fixture = TestBed.createComponent(ImageUploadFieldComponent);
    const ctrl = new FormControl<string | null>('/uploads/x.png');
    fixture.componentRef.setInput('control', ctrl);
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button[data-testid="clear"]');
    btn.click();
    expect(ctrl.value).toBeNull();
  });
});