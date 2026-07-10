import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

const DEFAULT_SUCCESS_DURATION = 3000;
const DEFAULT_ERROR_DURATION = 5000;

@Injectable({ providedIn: 'root' })
export class AdminFeedbackService {
  private snackBar = inject(MatSnackBar);

  success(message: string, duration = DEFAULT_SUCCESS_DURATION): void {
    this.snackBar.open(message, 'Cerrar', {
      duration,
      panelClass: 'snack-success',
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
    });
  }

  error(message: string, duration = DEFAULT_ERROR_DURATION): void {
    this.snackBar.open(message, 'Cerrar', {
      duration,
      panelClass: 'snack-error',
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
    });
  }
}