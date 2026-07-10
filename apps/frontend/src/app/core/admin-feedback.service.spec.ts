import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminFeedbackService } from './admin-feedback.service';

describe('AdminFeedbackService', () => {
  it('success abre snackbar con panelClass snack-success y duración 3000ms por defecto', () => {
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule],
    });
    const feedback = TestBed.inject(AdminFeedbackService);
    const snackBar = TestBed.inject(MatSnackBar);
    const openSpy = vi.spyOn(snackBar, 'open');

    feedback.success('Marca Toyota creada');

    expect(openSpy).toHaveBeenCalledWith(
      'Marca Toyota creada',
      'Cerrar',
      expect.objectContaining({
        duration: 3000,
        panelClass: 'snack-success',
      }),
    );
  });

  it('error abre snackbar con panelClass snack-error y duración 5000ms por defecto', () => {
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule],
    });
    const feedback = TestBed.inject(AdminFeedbackService);
    const snackBar = TestBed.inject(MatSnackBar);
    const openSpy = vi.spyOn(snackBar, 'open');

    feedback.error('No se pudo guardar');

    expect(openSpy).toHaveBeenCalledWith(
      'No se pudo guardar',
      'Cerrar',
      expect.objectContaining({
        duration: 5000,
        panelClass: 'snack-error',
      }),
    );
  });

  it('permite sobreescribir la duración', () => {
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule],
    });
    const feedback = TestBed.inject(AdminFeedbackService);
    const snackBar = TestBed.inject(MatSnackBar);
    const openSpy = vi.spyOn(snackBar, 'open');

    feedback.success('rápido', 1000);
    feedback.error('largo', 10000);

    expect(openSpy.mock.calls[0]?.[2]).toEqual(expect.objectContaining({ duration: 1000 }));
    expect(openSpy.mock.calls[1]?.[2]).toEqual(expect.objectContaining({ duration: 10000 }));
  });
});