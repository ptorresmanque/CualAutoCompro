import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { NgStyle } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { VehicleVersion } from '../../core/types/vehicle';
import { AuthService } from '../../core/auth.service';
import { toAbsoluteUploadUrl } from '../../core/upload-url';
import { slugify } from '../../core/slug';
import { versionFieldLabel } from '../../core/types/version-labels';
import { fuelLabel, segmentLabel, transmissionLabel } from '../../core/types/catalog-labels';

export interface VehicleCardInput {
  id: string;
  name: string;
  segment: string;
  brand: { name: string };
  imageUrl?: string | null;
  minPrice: number | null;
  defaultVersion?: VehicleVersion | null;
  versions: VehicleVersion[];
}

@Component({
  selector: 'app-vehicle-card',
  imports: [NgStyle, RouterLink, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './vehicle-card.component.html',
  styleUrl: './vehicle-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VehicleCardComponent {
  private auth = inject(AuthService);

  readonly model = input.required<VehicleCardInput>();
  readonly featured = input<boolean>(false);
  readonly added = input<boolean>(false);
  readonly maxReached = input<boolean>(false);
  readonly selectedVersionId = input<string | null>(null);
  readonly isFavorite = input<boolean>(false);
  readonly compareLabel = input<string>('Comparar');
  readonly forceShowChips = input<boolean>(false);
  readonly compareTapped = output<VehicleVersion>();
  readonly versionSelected = output<VehicleVersion>();
  readonly favoriteToggled = output<VehicleVersion>();

  readonly canFavorite = computed(() => this.auth.currentUser() !== null);
  readonly versionFieldLabel = versionFieldLabel;

  readonly favoriteIcon = computed(() =>
    this.isFavorite() ? 'favorite' : 'favorite_border',
  );

  private readonly _hovered = signal(false);
  readonly hovered = this._hovered.asReadonly();

  readonly hasDefaultVersion = computed(() =>
    Boolean(this.model().defaultVersion?.id) || this.model().versions.length > 0,
  );

  readonly hasMultipleVersions = computed(() => this.model().versions.length > 1);

  readonly selectedVersion = computed<VehicleVersion | null>(() => {
    const id = this.selectedVersionId();
    if (id) {
      const found = this.model().versions.find((v) => v.id === id);
      if (found) return found;
    }
    return this.model().versions[0] ?? null;
  });

  readonly segmentLabel = computed(() => segmentLabel(this.model().segment));
  readonly selectedFuelLabel = computed(() => fuelLabel(this.selectedVersion()?.fuel));
  readonly selectedTransmissionLabel = computed(() =>
    transmissionLabel(this.selectedVersion()?.transmission),
  );
  readonly priceFormatted = computed(() => {
    const v = this.selectedVersion();
    if (v) return new Intl.NumberFormat('es-CL').format(v.priceClp);
    const minPrice = this.model().minPrice;
    return minPrice != null ? new Intl.NumberFormat('es-CL').format(minPrice) : '';
  });

  readonly imageStyle = computed(() => {
    const url = toAbsoluteUploadUrl(this.model().imageUrl);
    return url ? { 'background-image': `url("${url}")` } : {};
  });

  readonly comparabilityLabel = computed(() => {
    const v = this.selectedVersion();
    if (this.added()) {
      return `Quitar ${this.model().name} ${v?.name ?? ''} de la comparación`;
    }
    return v
      ? `Agregar ${this.model().name} ${v.name} ${v.year} a la comparación`
      : '';
  });

  // `slugify` y no `toLowerCase()`: el backend resuelve la ficha comparando
  // `slugify(brand.name)` / `slugify(model.name)`, así que con toLowerCase
  // cualquier nombre con espacio o acento no matcheaba el endpoint rápido y
  // caía al fallback legacy de tres requests. Ver core/slug.ts.
  readonly detailUrl = computed(() => {
    const m = this.model();
    return ['/brand', slugify(m.brand.name), 'model', slugify(m.name)];
  });

  onCompare(event: Event): void {
    event.stopPropagation();
    if (!this.hasDefaultVersion()) return;
    this.compareTapped.emit(this.selectedVersion() ?? this.model().defaultVersion!);
  }

  onFavorite(event: Event): void {
    event.stopPropagation();
    if (!this.canFavorite()) return;
    const v = this.selectedVersion();
    if (!v) return;
    this.favoriteToggled.emit(v);
  }

  onSelectVersion(event: Event, v: VehicleVersion): void {
    event.stopPropagation();
    this.versionSelected.emit(v);
  }

  onMouseEnter(): void {
    this._hovered.set(true);
  }
  onMouseLeave(): void {
    this._hovered.set(false);
  }
}
