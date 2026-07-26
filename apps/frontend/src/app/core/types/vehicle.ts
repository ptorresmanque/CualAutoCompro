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

export interface VehicleLite {
  id: string;
  name: string;
  segment: string;
  brand: { name: string; id?: string };
  imageUrl?: string | null;
  galleryUrls?: string[];
  minPrice: number | null;
  defaultVersion?: VehicleVersion | null;
  versions: VehicleVersion[];
}
