import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { toApiCallError } from './api-error';

/**
 * Desglose del costo anual de una versión, tal como lo devuelve
 * `GET /cost/version/:id?kmPerYear=`.
 */
export interface CostBreakdown {
  kmPerYear: number;
  fuelClp: number;
  maintenanceClp: number;
  circulationPermitClp: number;
  mandatoryInsuranceClp: number;
  voluntaryInsuranceClp: number;
  depreciationClp: number;
  totalClp: number;
  meta: {
    consumptionCityKmL: number | null;
    consumptionHighwayKmL: number | null;
    fuelType: string | null;
    fuelUnit: string | null;
    fuelPricePerUnit: number | null;
    cityShare: number;
    highwayShare: number;
    maintenanceMileages: number[];
  };
}

/** Kilómetros al año por defecto, usados por la ficha y por el comparador. */
export const DEFAULT_KM_PER_YEAR = 15_000;
export const MAX_KM_PER_YEAR = 200_000;

/** Deja `km` dentro del rango que acepta el backend. */
export function clampKmPerYear(value: number | string): number | null {
  const n = typeof value === 'string' ? Number.parseInt(value, 10) : value;
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(MAX_KM_PER_YEAR, n));
}

/**
 * Acceso al cálculo de costo anual. Vive en `core/` y no dentro de
 * `AnnualCostCardComponent` porque el comparador necesita lo mismo para las
 * versiones que está comparando: el costo de uso es justamente el dato que
 * decide entre dos autos de precio parecido.
 */
@Injectable({ providedIn: 'root' })
export class AnnualCostService {
  private api = inject(ApiService);

  /**
   * `getUnwrapped` y no `get`: el backend puede responder el sobre
   * `{ data: null, error }`, y `get` lo resolvía como éxito dejando la tarjeta
   * en blanco sin mostrar nunca el motivo.
   */
  async fetch(versionId: string, kmPerYear: number): Promise<CostBreakdown> {
    return this.api.getUnwrapped<CostBreakdown>(
      `/cost/version/${encodeURIComponent(versionId)}`,
      { kmPerYear },
    );
  }

  /**
   * Traduce el error de HttpClient al mensaje del backend. Sin esto, un 404
   * pintaba el mensaje genérico de HttpClient en vez del motivo real.
   */
  errorMessage(e: unknown): string {
    return toApiCallError(e)?.backend.message ?? (e as Error).message;
  }
}
