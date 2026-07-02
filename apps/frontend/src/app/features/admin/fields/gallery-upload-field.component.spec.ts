import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { GalleryUploadFieldComponent } from './gallery-upload-field.component';

describe('GalleryUploadFieldComponent', () => {
  function setup(initial: string[] | null = null) {
    TestBed.configureTestingModule({
      imports: [GalleryUploadFieldComponent, ReactiveFormsModule],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(GalleryUploadFieldComponent);
    const ctrl = new FormControl<string[] | null>(initial);
    fixture.componentRef.setInput('control', ctrl);
    fixture.detectChanges();
    return { fixture, ctrl, http: TestBed.inject(HttpTestingController) };
  }

  it('muestra empty state cuando el control está vacío', () => {
    const { fixture } = setup(null);
    const grid = fixture.nativeElement.querySelector('[data-testid="gallery-grid"]');
    expect(grid).toBeNull();
    const empty = fixture.nativeElement.textContent;
    expect(empty).toContain('Sin imágenes');
  });

  it('renderiza un thumb por cada URL existente', () => {
    const { fixture } = setup(['/uploads/a.png', '/uploads/b.png']);
    const thumbs = fixture.nativeElement.querySelectorAll('[data-testid="gallery-thumb"]');
    expect(thumbs.length).toBe(2);
  });

  it('al subir archivos, agrega las URLs devueltas al control y marca dirty', async () => {
    const { fixture, ctrl, http } = setup(['/uploads/existing.png']);
    const file1 = new File([new Uint8Array([1])], 'one.png', { type: 'image/png' });
    const file2 = new File([new Uint8Array([2])], 'two.png', { type: 'image/png' });
    const inputEl: HTMLInputElement = fixture.nativeElement.querySelector('input[type="file"]');
    Object.defineProperty(inputEl, 'files', { value: [file1, file2] });
    inputEl.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();

    // Uploads are sequential (for...of + await in the component), so flush one
    // request, drain the microtask, then the second request becomes available.
    const req1 = http.expectOne((r) => r.url.includes('/api/v1/admin/uploads'));
    req1.flush({ data: { url: '/uploads/one.png', filename: 'one.png', size: 1, mime: 'image/png' } });
    await new Promise((r) => setTimeout(r, 0));
    const req2 = http.expectOne((r) => r.url.includes('/api/v1/admin/uploads'));
    req2.flush({ data: { url: '/uploads/two.png', filename: 'two.png', size: 1, mime: 'image/png' } });
    await new Promise((r) => setTimeout(r, 0));
    fixture.detectChanges();

    expect(ctrl.value).toEqual(['/uploads/existing.png', '/uploads/one.png', '/uploads/two.png']);
    expect(ctrl.dirty).toBe(true);
  });

  it('removeAt quita la URL en el índice dado', () => {
    const { fixture, ctrl } = setup(['/uploads/a.png', '/uploads/b.png', '/uploads/c.png']);
    const removeButtons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll(
      '[data-testid="gallery-remove"]',
    );
    expect(removeButtons.length).toBe(3);
    removeButtons[1].click();
    expect(ctrl.value).toEqual(['/uploads/a.png', '/uploads/c.png']);
    expect(ctrl.dirty).toBe(true);
  });

  it('removeAt actualiza el DOM (regression: computed no invalidaba)', () => {
    // Regression for the bug where the `urls` computed depended only on the
    // input signal (which returns the same FormControl reference) and never
    // invalidated when setValue was called. The fix converts `urls` to a
    // method so the template re-reads the current value on every CD cycle.
    const { fixture, ctrl } = setup(['/uploads/a.png', '/uploads/b.png', '/uploads/c.png']);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelectorAll('[data-testid="gallery-thumb"]').length,
    ).toBe(3);

    const removeButtons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll(
      '[data-testid="gallery-remove"]',
    );
    removeButtons[1].click();
    fixture.detectChanges();

    // The FormControl value updated...
    expect(ctrl.value).toEqual(['/uploads/a.png', '/uploads/c.png']);
    // ...and the DOM reflects the new list.
    const remaining = fixture.nativeElement.querySelectorAll('[data-testid="gallery-thumb"]');
    expect(remaining.length).toBe(2);
    expect(remaining[0].getAttribute('src')).toContain('/uploads/a.png');
    expect(remaining[1].getAttribute('src')).toContain('/uploads/c.png');
  });

  it('si la subida falla, muestra error y no modifica el control', async () => {
    const { fixture, ctrl, http } = setup(['/uploads/existing.png']);
    const file = new File([new Uint8Array([1])], 'broken.png', { type: 'image/png' });
    const inputEl: HTMLInputElement = fixture.nativeElement.querySelector('input[type="file"]');
    Object.defineProperty(inputEl, 'files', { value: [file] });
    inputEl.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();

    const req = http.expectOne((r) => r.url.includes('/api/v1/admin/uploads'));
    req.error(new ProgressEvent('error'), { status: 500, statusText: 'Server Error' });
    // The catch runs after the for-loop's await rejects, which is queued
    // as a microtask. Drain it before reading the DOM.
    await new Promise((r) => setTimeout(r, 0));
    fixture.detectChanges();

    expect(ctrl.value).toEqual(['/uploads/existing.png']);
    const errEl = fixture.nativeElement.querySelector('[data-testid="gallery-error"]');
    expect(errEl).toBeTruthy();
    expect(errEl?.textContent).toContain('Http failure');
  });
});
