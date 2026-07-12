import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import type { ConfirmDialogData } from './confirm-dialog.types';

@Component({
  selector: 'app-confirm-dialog',
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  private ref = inject(MatDialogRef<ConfirmDialogComponent, boolean>);
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);

  get confirmLabel(): string {
    return this.data.confirmLabel ?? 'Confirmar';
  }

  get cancelLabel(): string {
    return this.data.cancelLabel ?? 'Cancelar';
  }

  get confirmColor(): 'primary' | 'warn' {
    return this.data.danger ? 'warn' : 'primary';
  }

  confirm(): void {
    this.ref.close(true);
  }

  cancel(): void {
    this.ref.close(false);
  }
}