import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LoadingService } from '../../core/loading.service';

@Component({
  selector: 'app-loading-bar',
  imports: [MatProgressBarModule],
  templateUrl: './loading-bar.component.html',
  styleUrl: './loading-bar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingBarComponent {
  private readonly service = inject(LoadingService);
  readonly loading = this.service.loading;
}
