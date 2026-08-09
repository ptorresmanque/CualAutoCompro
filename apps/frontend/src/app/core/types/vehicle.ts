export interface VehicleVersion {
  id: string;
  modelId?: string;
  name: string;
  year: number;
  priceClp: number;
  transmission?: string | null;
  fuel?: string | null;
  traction?: string | null;
  engineType?: string | null;
  engineDisplacementCc?: number | null;
  powerHp?: number | null;
  torqueNm?: number | null;
  consumptionCityKmL?: number | null;
  consumptionHighwayKmL?: number | null;
}
