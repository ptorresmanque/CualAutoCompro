import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import type { ConfirmDialogData } from './confirm-dialog.types';

function buildFixture(data: Partial<ConfirmDialogData> = {}) {
  const fullData: ConfirmDialogData = {
    title: 'Confirmar',
    message: '¿Continuar?',
    ...data,
  };
  const closeSpy = vi.fn();
  TestBed.configureTestingModule({
    imports: [ConfirmDialogComponent, MatDialogModule, NoopAnimationsModule],
    providers: [
      { provide: MAT_DIALOG_DATA, useValue: fullData },
      { provide: MatDialogRef, useValue: { close: closeSpy } },
    ],
  });
  const fixture = TestBed.createComponent(ConfirmDialogComponent);
  fixture.detectChanges();
  return { fixture, closeSpy };
}

describe('ConfirmDialogComponent', () => {
  it('renders title and message from data', () => {
    const { fixture } = buildFixture({ title: 'Eliminar marca', message: '¿Eliminar marca "Toyota"?' });
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Eliminar marca');
    expect(root.textContent).toContain('¿Eliminar marca "Toyota"?');
  });

  it('uses default labels when none provided', () => {
    const { fixture } = buildFixture();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Confirmar');
    expect(root.textContent).toContain('Cancelar');
  });

  it('uses custom labels when provided', () => {
    const { fixture } = buildFixture({ title: 'Eliminar marca', message: '¿Eliminar?', confirmLabel: 'Eliminar', cancelLabel: 'Volver' });
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Eliminar');
    expect(root.textContent).toContain('Volver');
    expect(root.textContent).not.toContain('Confirmar');
  });

  it('closes with true on confirm click', () => {
    const { fixture, closeSpy } = buildFixture();
    const btn = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('[data-testid="confirm-accept"]');
    expect(btn).toBeTruthy();
    btn!.click();
    expect(closeSpy).toHaveBeenCalledWith(true);
  });

  it('closes with false on cancel click', () => {
    const { fixture, closeSpy } = buildFixture();
    const btn = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('[data-testid="confirm-cancel"]');
    expect(btn).toBeTruthy();
    btn!.click();
    expect(closeSpy).toHaveBeenCalledWith(false);
  });

  it('applies warn color when danger is true', () => {
    const { fixture } = buildFixture({ danger: true });
    const btn = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('[data-testid="confirm-accept"]');
    expect(btn!.className).toContain('mat-warn');
  });

  it('applies primary color when danger is false or omitted', () => {
    const { fixture } = buildFixture();
    const btn = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('[data-testid="confirm-accept"]');
    expect(btn!.className).not.toContain('mat-warn');
    expect(btn!.className).toContain('mat-primary');
  });
});