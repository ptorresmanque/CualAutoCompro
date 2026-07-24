// Catálogo inicial para el seed de cualautocompro.
//
// DISCLAIMER: Las especificaciones (potencia, torque, consumo, precios) son
// aproximaciones del mercado chileno 2024 basadas en información pública de
// los sitios oficiales de cada marca. No constituyen una fuente autoritativa
// y pueden diferir de las fichas técnicas vigentes. Usar solo con fines de
// desarrollo y demostración.
//
// El módulo exporta un objeto `catalog` con cinco secciones:
//   - brands           → upsert por nombre
//   - models           → upsert por (brandName, name)
//   - versions         → create (id resoluble vía brandName/modelName/name)
//   - equipmentItems   → upsert por nombre + category
//   - versionEquipment → join table (referencias por nombre)
//   - maintenanceCosts → referencias por nombre + mileageTag

type Segment = "SEDAN" | "SUV" | "HATCHBACK" | "PICKUP" | "CROSSOVER" | "COMMERCIAL";
type Transmission = "MANUAL" | "AUTOMATIC" | "CVT" | "DCT";
type Fuel = "BENCINA" | "DIESEL" | "HYBRID" | "ELECTRIC";

export type BrandSeed = { name: string; logoUrl: string | null };
function galleryUrls(name) {
  const slug = name.replace(/\s+/g, "+");
  return [
    `https://placehold.co/1280x720/008080/ffffff?text=${slug}+Frontal`,
    `https://placehold.co/1280x720/006565/ffffff?text=${slug}+Lateral`,
    `https://placehold.co/1280x720/93f2f2/006565?text=${slug}+Interior`,
    `https://placehold.co/1280x720/c6e9e9/006565?text=${slug}+Posterior`,
  ];
}

export type ModelSeed = {
  brandName: string;
  name: string;
  segment: Segment;
  imageUrl: string | null;
  galleryUrls: string[];
};
export type VersionSeed = {
  brandName: string;
  modelName: string;
  name: string;
  year: number;
  priceClp: number;
  transmission: Transmission;
  fuel: Fuel;
  engineDisplacementCc: number;
  powerHp: number;
  torqueNm: number;
  consumptionCityKmL: number;
  consumptionHighwayKmL: number;
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  weightKg: number;
  trunkLiters: number;
};
export type EquipmentItemSeed = { name: string; category: string };
export type VersionEquipmentSeed = {
  brandName: string;
  modelName: string;
  versionName: string;
  equipmentName: string;
};
export type MaintenanceCostSeed = {
  brandName: string;
  modelName: string;
  versionName: string;
  mileageTag: number;
  costClp: number;
};

export const catalog = {
  brands: [
    { name: "Toyota", logoUrl: null },
    { name: "Chevrolet", logoUrl: null },
    { name: "Hyundai", logoUrl: null },
    { name: "Kia", logoUrl: null },
    { name: "Mazda", logoUrl: null },
    { name: "Nissan", logoUrl: null },
    { name: "Suzuki", logoUrl: null },
    { name: "Subaru", logoUrl: null },
    { name: "Ford", logoUrl: null },
    { name: "Volkswagen", logoUrl: null },
  ] satisfies BrandSeed[],

  models: [
    { brandName: "Toyota", name: "Corolla", segment: "SEDAN", imageUrl: null,
      galleryUrls: galleryUrls("Corolla"),
    },
    { brandName: "Toyota", name: "RAV4", segment: "SUV", imageUrl: null,
      galleryUrls: galleryUrls("RAV4"),
    },
    { brandName: "Toyota", name: "Hilux", segment: "PICKUP", imageUrl: null,
      galleryUrls: galleryUrls("Hilux"),
    },
    { brandName: "Chevrolet", name: "Sail", segment: "SEDAN", imageUrl: null,
      galleryUrls: galleryUrls("Sail"),
    },
    { brandName: "Chevrolet", name: "Tracker", segment: "SUV", imageUrl: null,
      galleryUrls: galleryUrls("Tracker"),
    },
    { brandName: "Chevrolet", name: "Onix", segment: "HATCHBACK", imageUrl: null,
      galleryUrls: galleryUrls("Onix"),
    },
    { brandName: "Hyundai", name: "Accent", segment: "SEDAN", imageUrl: null,
      galleryUrls: galleryUrls("Accent"),
    },
    { brandName: "Hyundai", name: "Tucson", segment: "SUV", imageUrl: null,
      galleryUrls: galleryUrls("Tucson"),
    },
    { brandName: "Hyundai", name: "Kona", segment: "SUV", imageUrl: null,
      galleryUrls: galleryUrls("Kona"),
    },
    { brandName: "Kia", name: "Rio", segment: "HATCHBACK", imageUrl: null,
      galleryUrls: galleryUrls("Rio"),
    },
    { brandName: "Kia", name: "Sportage", segment: "SUV", imageUrl: null,
      galleryUrls: galleryUrls("Sportage"),
    },
    { brandName: "Kia", name: "Morning", segment: "HATCHBACK", imageUrl: null,
      galleryUrls: galleryUrls("Morning"),
    },
    { brandName: "Mazda", name: "CX-5", segment: "SUV", imageUrl: null,
      galleryUrls: galleryUrls("CX-5"),
    },
    { brandName: "Mazda", name: "Mazda3", segment: "SEDAN", imageUrl: null,
      galleryUrls: galleryUrls("Mazda3"),
    },
    { brandName: "Mazda", name: "CX-3", segment: "SUV", imageUrl: null,
      galleryUrls: galleryUrls("CX-3"),
    },
    { brandName: "Nissan", name: "Versa", segment: "SEDAN", imageUrl: null,
      galleryUrls: galleryUrls("Versa"),
    },
    { brandName: "Nissan", name: "Kicks", segment: "SUV", imageUrl: null,
      galleryUrls: galleryUrls("Kicks"),
    },
    { brandName: "Nissan", name: "X-Trail", segment: "SUV", imageUrl: null,
      galleryUrls: galleryUrls("X-Trail"),
    },
    { brandName: "Suzuki", name: "Swift", segment: "HATCHBACK", imageUrl: null,
      galleryUrls: galleryUrls("Swift"),
    },
    { brandName: "Suzuki", name: "Vitara", segment: "SUV", imageUrl: null,
      galleryUrls: galleryUrls("Vitara"),
    },
    { brandName: "Suzuki", name: "Jimny", segment: "SUV", imageUrl: null,
      galleryUrls: galleryUrls("Jimny"),
    },
    { brandName: "Subaru", name: "Forester", segment: "SUV", imageUrl: null,
      galleryUrls: galleryUrls("Forester"),
    },
    { brandName: "Subaru", name: "XV", segment: "SUV", imageUrl: null,
      galleryUrls: galleryUrls("XV"),
    },
    { brandName: "Subaru", name: "Impreza", segment: "SEDAN", imageUrl: null,
      galleryUrls: galleryUrls("Impreza"),
    },
    { brandName: "Ford", name: "Ranger", segment: "PICKUP", imageUrl: null,
      galleryUrls: galleryUrls("Ranger"),
    },
    { brandName: "Ford", name: "Escape", segment: "SUV", imageUrl: null,
      galleryUrls: galleryUrls("Escape"),
    },
    { brandName: "Ford", name: "Territory", segment: "SUV", imageUrl: null,
      galleryUrls: galleryUrls("Territory"),
    },
    { brandName: "Volkswagen", name: "Golf", segment: "HATCHBACK", imageUrl: null,
      galleryUrls: galleryUrls("Golf"),
    },
    { brandName: "Volkswagen", name: "T-Cross", segment: "SUV", imageUrl: null,
      galleryUrls: galleryUrls("T-Cross"),
    },
    { brandName: "Volkswagen", name: "Nivus", segment: "SUV", imageUrl: null,
      galleryUrls: galleryUrls("Nivus"),
    },
  ] satisfies ModelSeed[],

  versions: [
    // Toyota Corolla (SEDAN) — 3 versiones
    { brandName: "Toyota", modelName: "Corolla", name: "XLI 1.8", year: 2024, priceClp: 16990000, transmission: "CVT", fuel: "BENCINA", engineDisplacementCc: 1798, powerHp: 138, torqueNm: 175, consumptionCityKmL: 12.5, consumptionHighwayKmL: 17.8, lengthMm: 4630, widthMm: 1780, heightMm: 1455, weightKg: 1320, trunkLiters: 471
    },
    { brandName: "Toyota", modelName: "Corolla", name: "XEI 1.8", year: 2024, priceClp: 18590000, transmission: "CVT", fuel: "BENCINA", engineDisplacementCc: 1798, powerHp: 138, torqueNm: 175, consumptionCityKmL: 12.3, consumptionHighwayKmL: 17.6, lengthMm: 4630, widthMm: 1780, heightMm: 1455, weightKg: 1330, trunkLiters: 471
    },
    { brandName: "Toyota", modelName: "Corolla", name: "SEG Hybrid 1.8", year: 2024, priceClp: 22990000, transmission: "CVT", fuel: "HYBRID", engineDisplacementCc: 1798, powerHp: 122, torqueNm: 142, consumptionCityKmL: 21.5, consumptionHighwayKmL: 23.4, lengthMm: 4630, widthMm: 1780, heightMm: 1455, weightKg: 1380, trunkLiters: 471
    },
    // Toyota RAV4 (SUV) — 2 versiones
    { brandName: "Toyota", modelName: "RAV4", name: "2.0 XLE", year: 2024, priceClp: 24990000, transmission: "CVT", fuel: "BENCINA", engineDisplacementCc: 1987, powerHp: 170, torqueNm: 203, consumptionCityKmL: 11.2, consumptionHighwayKmL: 15.4, lengthMm: 4600, widthMm: 1855, heightMm: 1685, weightKg: 1610, trunkLiters: 580
    },
    { brandName: "Toyota", modelName: "RAV4", name: "2.5 Hybrid Limited", year: 2024, priceClp: 32990000, transmission: "CVT", fuel: "HYBRID", engineDisplacementCc: 2487, powerHp: 222, torqueNm: 221, consumptionCityKmL: 18.7, consumptionHighwayKmL: 20.1, lengthMm: 4600, widthMm: 1855, heightMm: 1685, weightKg: 1740, trunkLiters: 580
    },
    // Toyota Hilux (PICKUP) — 3 versiones
    { brandName: "Toyota", modelName: "Hilux", name: "2.4 DX 4x4", year: 2024, priceClp: 21990000, transmission: "MANUAL", fuel: "DIESEL", engineDisplacementCc: 2393, powerHp: 150, torqueNm: 400, consumptionCityKmL: 9.5, consumptionHighwayKmL: 12.8, lengthMm: 5325, widthMm: 1855, heightMm: 1815, weightKg: 2055, trunkLiters: 0
    },
    { brandName: "Toyota", modelName: "Hilux", name: "2.8 SRV 4x4", year: 2024, priceClp: 28990000, transmission: "AUTOMATIC", fuel: "DIESEL", engineDisplacementCc: 2755, powerHp: 204, torqueNm: 500, consumptionCityKmL: 9.1, consumptionHighwayKmL: 12.3, lengthMm: 5325, widthMm: 1855, heightMm: 1815, weightKg: 2105, trunkLiters: 0
    },
    { brandName: "Toyota", modelName: "Hilux", name: "2.8 GR-S 4x4", year: 2024, priceClp: 35490000, transmission: "AUTOMATIC", fuel: "DIESEL", engineDisplacementCc: 2755, powerHp: 224, torqueNm: 550, consumptionCityKmL: 8.8, consumptionHighwayKmL: 12.0, lengthMm: 5325, widthMm: 1855, heightMm: 1815, weightKg: 2120, trunkLiters: 0
    },

    // Chevrolet Sail (SEDAN) — 2 versiones
    { brandName: "Chevrolet", modelName: "Sail", name: "1.5 LS", year: 2024, priceClp: 9990000, transmission: "MANUAL", fuel: "BENCINA", engineDisplacementCc: 1485, powerHp: 98, torqueNm: 142, consumptionCityKmL: 13.5, consumptionHighwayKmL: 18.2, lengthMm: 4245, widthMm: 1695, heightMm: 1505, weightKg: 1115, trunkLiters: 410
    },
    { brandName: "Chevrolet", modelName: "Sail", name: "1.5 LT", year: 2024, priceClp: 11490000, transmission: "MANUAL", fuel: "BENCINA", engineDisplacementCc: 1485, powerHp: 98, torqueNm: 142, consumptionCityKmL: 13.2, consumptionHighwayKmL: 17.9, lengthMm: 4245, widthMm: 1695, heightMm: 1505, weightKg: 1130, trunkLiters: 410
    },
    // Chevrolet Tracker (SUV) — 2 versiones
    { brandName: "Chevrolet", modelName: "Tracker", name: "1.2T LT", year: 2024, priceClp: 15990000, transmission: "AUTOMATIC", fuel: "BENCINA", engineDisplacementCc: 1199, powerHp: 132, torqueNm: 190, consumptionCityKmL: 13.8, consumptionHighwayKmL: 18.5, lengthMm: 4270, widthMm: 1795, heightMm: 1605, weightKg: 1330, trunkLiters: 393
    },
    { brandName: "Chevrolet", modelName: "Tracker", name: "1.2T Premier", year: 2024, priceClp: 18490000, transmission: "AUTOMATIC", fuel: "BENCINA", engineDisplacementCc: 1199, powerHp: 132, torqueNm: 190, consumptionCityKmL: 13.5, consumptionHighwayKmL: 18.2, lengthMm: 4270, widthMm: 1795, heightMm: 1605, weightKg: 1345, trunkLiters: 393
    },
    // Chevrolet Onix (HATCHBACK) — 2 versiones
    { brandName: "Chevrolet", modelName: "Onix", name: "1.0T LT", year: 2024, priceClp: 12990000, transmission: "MANUAL", fuel: "BENCINA", engineDisplacementCc: 999, powerHp: 116, torqueNm: 160, consumptionCityKmL: 14.6, consumptionHighwayKmL: 19.8, lengthMm: 4163, widthMm: 1735, heightMm: 1475, weightKg: 1185, trunkLiters: 275
    },
    { brandName: "Chevrolet", modelName: "Onix", name: "1.0T Premier", year: 2024, priceClp: 14990000, transmission: "AUTOMATIC", fuel: "BENCINA", engineDisplacementCc: 999, powerHp: 116, torqueNm: 160, consumptionCityKmL: 14.3, consumptionHighwayKmL: 19.4, lengthMm: 4163, widthMm: 1735, heightMm: 1475, weightKg: 1200, trunkLiters: 275
    },

    // Hyundai Accent (SEDAN) — 2 versiones
    { brandName: "Hyundai", modelName: "Accent", name: "1.5 GL", year: 2024, priceClp: 11490000, transmission: "MANUAL", fuel: "BENCINA", engineDisplacementCc: 1497, powerHp: 100, torqueNm: 144, consumptionCityKmL: 13.8, consumptionHighwayKmL: 18.4, lengthMm: 4440, widthMm: 1729, heightMm: 1475, weightKg: 1180, trunkLiters: 480
    },
    { brandName: "Hyundai", modelName: "Accent", name: "1.5 GLS", year: 2024, priceClp: 13490000, transmission: "AUTOMATIC", fuel: "BENCINA", engineDisplacementCc: 1497, powerHp: 100, torqueNm: 144, consumptionCityKmL: 13.4, consumptionHighwayKmL: 18.0, lengthMm: 4440, widthMm: 1729, heightMm: 1475, weightKg: 1195, trunkLiters: 480
    },
    // Hyundai Tucson (SUV) — 3 versiones
    { brandName: "Hyundai", modelName: "Tucson", name: "2.0 GL", year: 2024, priceClp: 19490000, transmission: "AUTOMATIC", fuel: "BENCINA", engineDisplacementCc: 1999, powerHp: 156, torqueNm: 192, consumptionCityKmL: 11.4, consumptionHighwayKmL: 15.7, lengthMm: 4630, widthMm: 1865, heightMm: 1665, weightKg: 1555, trunkLiters: 620
    },
    { brandName: "Hyundai", modelName: "Tucson", name: "2.0 GLS", year: 2024, priceClp: 22490000, transmission: "AUTOMATIC", fuel: "BENCINA", engineDisplacementCc: 1999, powerHp: 156, torqueNm: 192, consumptionCityKmL: 11.1, consumptionHighwayKmL: 15.4, lengthMm: 4630, widthMm: 1865, heightMm: 1665, weightKg: 1570, trunkLiters: 620
    },
    { brandName: "Hyundai", modelName: "Tucson", name: "2.0 Limited", year: 2024, priceClp: 26990000, transmission: "AUTOMATIC", fuel: "BENCINA", engineDisplacementCc: 1999, powerHp: 156, torqueNm: 192, consumptionCityKmL: 10.9, consumptionHighwayKmL: 15.1, lengthMm: 4630, widthMm: 1865, heightMm: 1665, weightKg: 1585, trunkLiters: 620
    },
    // Hyundai Kona (SUV) — 2 versiones
    { brandName: "Hyundai", modelName: "Kona", name: "1.6T", year: 2024, priceClp: 18990000, transmission: "DCT", fuel: "BENCINA", engineDisplacementCc: 1591, powerHp: 195, torqueNm: 265, consumptionCityKmL: 12.5, consumptionHighwayKmL: 16.8, lengthMm: 4205, widthMm: 1800, heightMm: 1565, weightKg: 1410, trunkLiters: 374
    },
    { brandName: "Hyundai", modelName: "Kona", name: "2.0", year: 2024, priceClp: 16990000, transmission: "AUTOMATIC", fuel: "BENCINA", engineDisplacementCc: 1999, powerHp: 147, torqueNm: 180, consumptionCityKmL: 12.8, consumptionHighwayKmL: 17.2, lengthMm: 4205, widthMm: 1800, heightMm: 1565, weightKg: 1395, trunkLiters: 374
    },

    // Kia Rio (HATCHBACK) — 2 versiones
    { brandName: "Kia", modelName: "Rio", name: "1.4 LX", year: 2024, priceClp: 10490000, transmission: "MANUAL", fuel: "BENCINA", engineDisplacementCc: 1368, powerHp: 100, torqueNm: 136, consumptionCityKmL: 14.0, consumptionHighwayKmL: 18.6, lengthMm: 4065, widthMm: 1725, heightMm: 1450, weightKg: 1165, trunkLiters: 325
    },
    { brandName: "Kia", modelName: "Rio", name: "1.4 EX", year: 2024, priceClp: 12490000, transmission: "AUTOMATIC", fuel: "BENCINA", engineDisplacementCc: 1368, powerHp: 100, torqueNm: 136, consumptionCityKmL: 13.6, consumptionHighwayKmL: 18.2, lengthMm: 4065, widthMm: 1725, heightMm: 1450, weightKg: 1180, trunkLiters: 325
    },
    // Kia Sportage (SUV) — 3 versiones
    { brandName: "Kia", modelName: "Sportage", name: "2.0 LX", year: 2024, priceClp: 18990000, transmission: "AUTOMATIC", fuel: "BENCINA", engineDisplacementCc: 1999, powerHp: 155, torqueNm: 192, consumptionCityKmL: 11.6, consumptionHighwayKmL: 15.9, lengthMm: 4660, widthMm: 1865, heightMm: 1665, weightKg: 1565, trunkLiters: 591
    },
    { brandName: "Kia", modelName: "Sportage", name: "2.0 EX", year: 2024, priceClp: 21990000, transmission: "AUTOMATIC", fuel: "BENCINA", engineDisplacementCc: 1999, powerHp: 155, torqueNm: 192, consumptionCityKmL: 11.3, consumptionHighwayKmL: 15.6, lengthMm: 4660, widthMm: 1865, heightMm: 1665, weightKg: 1580, trunkLiters: 591
    },
    { brandName: "Kia", modelName: "Sportage", name: "2.0 GT-Line", year: 2024, priceClp: 26490000, transmission: "AUTOMATIC", fuel: "BENCINA", engineDisplacementCc: 1999, powerHp: 155, torqueNm: 192, consumptionCityKmL: 11.1, consumptionHighwayKmL: 15.3, lengthMm: 4660, widthMm: 1865, heightMm: 1665, weightKg: 1595, trunkLiters: 591
    },
    // Kia Morning (HATCHBACK) — 2 versiones
    { brandName: "Kia", modelName: "Morning", name: "1.2 LX", year: 2024, priceClp: 8990000, transmission: "MANUAL", fuel: "BENCINA", engineDisplacementCc: 1197, powerHp: 84, torqueNm: 122, consumptionCityKmL: 14.8, consumptionHighwayKmL: 19.6, lengthMm: 3675, widthMm: 1625, heightMm: 1485, weightKg: 985, trunkLiters: 255
    },
    { brandName: "Kia", modelName: "Morning", name: "1.4 EX", year: 2024, priceClp: 10990000, transmission: "AUTOMATIC", fuel: "BENCINA", engineDisplacementCc: 1368, powerHp: 100, torqueNm: 136, consumptionCityKmL: 14.2, consumptionHighwayKmL: 19.0, lengthMm: 3675, widthMm: 1625, heightMm: 1485, weightKg: 1005, trunkLiters: 255
    },

    // Mazda CX-5 (SUV) — 2 versiones
    { brandName: "Mazda", modelName: "CX-5", name: "2.5 Touring", year: 2024, priceClp: 22990000, transmission: "AUTOMATIC", fuel: "BENCINA", engineDisplacementCc: 2488, powerHp: 187, torqueNm: 252, consumptionCityKmL: 11.4, consumptionHighwayKmL: 15.6, lengthMm: 4575, widthMm: 1842, heightMm: 1675, weightKg: 1645, trunkLiters: 506
    },
    { brandName: "Mazda", modelName: "CX-5", name: "2.5 Grand Touring", year: 2024, priceClp: 26990000, transmission: "AUTOMATIC", fuel: "BENCINA", engineDisplacementCc: 2488, powerHp: 187, torqueNm: 252, consumptionCityKmL: 11.1, consumptionHighwayKmL: 15.3, lengthMm: 4575, widthMm: 1842, heightMm: 1675, weightKg: 1660, trunkLiters: 506
    },
    // Mazda Mazda3 (SEDAN) — 2 versiones
    { brandName: "Mazda", modelName: "Mazda3", name: "2.0 Touring", year: 2024, priceClp: 17990000, transmission: "AUTOMATIC", fuel: "BENCINA", engineDisplacementCc: 1998, powerHp: 153, torqueNm: 200, consumptionCityKmL: 12.6, consumptionHighwayKmL: 17.0, lengthMm: 4660, widthMm: 1795, heightMm: 1445, weightKg: 1395, trunkLiters: 450
    },
    { brandName: "Mazda", modelName: "Mazda3", name: "2.5 Grand Touring", year: 2024, priceClp: 21990000, transmission: "AUTOMATIC", fuel: "BENCINA", engineDisplacementCc: 2488, powerHp: 186, torqueNm: 252, consumptionCityKmL: 12.0, consumptionHighwayKmL: 16.5, lengthMm: 4660, widthMm: 1795, heightMm: 1445, weightKg: 1415, trunkLiters: 450
    },
    // Mazda CX-3 (SUV) — 2 versiones
    { brandName: "Mazda", modelName: "CX-3", name: "2.0 Touring", year: 2024, priceClp: 15990000, transmission: "AUTOMATIC", fuel: "BENCINA", engineDisplacementCc: 1998, powerHp: 148, torqueNm: 192, consumptionCityKmL: 13.0, consumptionHighwayKmL: 17.5, lengthMm: 4275, widthMm: 1765, heightMm: 1535, weightKg: 1290, trunkLiters: 350
    },
    { brandName: "Mazda", modelName: "CX-3", name: "2.0 Grand Touring", year: 2024, priceClp: 18490000, transmission: "AUTOMATIC", fuel: "BENCINA", engineDisplacementCc: 1998, powerHp: 148, torqueNm: 192, consumptionCityKmL: 12.7, consumptionHighwayKmL: 17.2, lengthMm: 4275, widthMm: 1765, heightMm: 1535, weightKg: 1305, trunkLiters: 350
    },

    // Nissan Versa (SEDAN) — 2 versiones
    { brandName: "Nissan", modelName: "Versa", name: "1.6 Sense", year: 2024, priceClp: 11990000, transmission: "MANUAL", fuel: "BENCINA", engineDisplacementCc: 1598, powerHp: 118, torqueNm: 154, consumptionCityKmL: 13.6, consumptionHighwayKmL: 18.3, lengthMm: 4495, widthMm: 1740, heightMm: 1465, weightKg: 1145, trunkLiters: 482
    },
    { brandName: "Nissan", modelName: "Versa", name: "1.6 Advance CVT", year: 2024, priceClp: 14490000, transmission: "CVT", fuel: "BENCINA", engineDisplacementCc: 1598, powerHp: 118, torqueNm: 154, consumptionCityKmL: 13.2, consumptionHighwayKmL: 17.9, lengthMm: 4495, widthMm: 1740, heightMm: 1465, weightKg: 1160, trunkLiters: 482
    },
    // Nissan Kicks (SUV) — 2 versiones
    { brandName: "Nissan", modelName: "Kicks", name: "1.6 Sense", year: 2024, priceClp: 14990000, transmission: "MANUAL", fuel: "BENCINA", engineDisplacementCc: 1598, powerHp: 120, torqueNm: 155, consumptionCityKmL: 13.8, consumptionHighwayKmL: 18.4, lengthMm: 4305, widthMm: 1760, heightMm: 1590, weightKg: 1220, trunkLiters: 432
    },
    { brandName: "Nissan", modelName: "Kicks", name: "1.6 Exclusive CVT", year: 2024, priceClp: 17990000, transmission: "CVT", fuel: "BENCINA", engineDisplacementCc: 1598, powerHp: 120, torqueNm: 155, consumptionCityKmL: 13.4, consumptionHighwayKmL: 18.0, lengthMm: 4305, widthMm: 1760, heightMm: 1590, weightKg: 1235, trunkLiters: 432
    },
    // Nissan X-Trail (SUV) — 2 versiones
    { brandName: "Nissan", modelName: "X-Trail", name: "2.5 Sense CVT", year: 2024, priceClp: 23490000, transmission: "CVT", fuel: "BENCINA", engineDisplacementCc: 2488, powerHp: 181, torqueNm: 245, consumptionCityKmL: 10.9, consumptionHighwayKmL: 14.9, lengthMm: 4690, widthMm: 1820, heightMm: 1740, weightKg: 1625, trunkLiters: 565
    },
    { brandName: "Nissan", modelName: "X-Trail", name: "2.5 Exclusive CVT 4WD", year: 2024, priceClp: 28990000, transmission: "CVT", fuel: "BENCINA", engineDisplacementCc: 2488, powerHp: 181, torqueNm: 245, consumptionCityKmL: 10.6, consumptionHighwayKmL: 14.5, lengthMm: 4690, widthMm: 1820, heightMm: 1740, weightKg: 1660, trunkLiters: 565
    },

    // Suzuki Swift (HATCHBACK) — 2 versiones
    { brandName: "Suzuki", modelName: "Swift", name: "1.2 GL", year: 2024, priceClp: 9990000, transmission: "MANUAL", fuel: "BENCINA", engineDisplacementCc: 1197, powerHp: 83, torqueNm: 113, consumptionCityKmL: 15.2, consumptionHighwayKmL: 20.0, lengthMm: 3845, widthMm: 1735, heightMm: 1495, weightKg: 970, trunkLiters: 265
    },
    { brandName: "Suzuki", modelName: "Swift", name: "1.2 GLX", year: 2024, priceClp: 11490000, transmission: "AUTOMATIC", fuel: "BENCINA", engineDisplacementCc: 1197, powerHp: 83, torqueNm: 113, consumptionCityKmL: 14.8, consumptionHighwayKmL: 19.6, lengthMm: 3845, widthMm: 1735, heightMm: 1495, weightKg: 985, trunkLiters: 265
    },
    // Suzuki Vitara (SUV) — 2 versiones
    { brandName: "Suzuki", modelName: "Vitara", name: "1.6 GL", year: 2024, priceClp: 14990000, transmission: "MANUAL", fuel: "BENCINA", engineDisplacementCc: 1586, powerHp: 115, torqueNm: 156, consumptionCityKmL: 13.4, consumptionHighwayKmL: 17.9, lengthMm: 4175, widthMm: 1775, heightMm: 1610, weightKg: 1230, trunkLiters: 375
    },
    { brandName: "Suzuki", modelName: "Vitara", name: "1.6 GLX", year: 2024, priceClp: 16990000, transmission: "AUTOMATIC", fuel: "BENCINA", engineDisplacementCc: 1586, powerHp: 115, torqueNm: 156, consumptionCityKmL: 13.0, consumptionHighwayKmL: 17.5, lengthMm: 4175, widthMm: 1775, heightMm: 1610, weightKg: 1245, trunkLiters: 375
    },
    // Suzuki Jimny (SUV) — 2 versiones
    { brandName: "Suzuki", modelName: "Jimny", name: "1.5 GL", year: 2024, priceClp: 17490000, transmission: "MANUAL", fuel: "BENCINA", engineDisplacementCc: 1462, powerHp: 102, torqueNm: 130, consumptionCityKmL: 13.6, consumptionHighwayKmL: 17.5, lengthMm: 3645, widthMm: 1645, heightMm: 1725, weightKg: 1110, trunkLiters: 85
    },
    { brandName: "Suzuki", modelName: "Jimny", name: "1.5 GLX", year: 2024, priceClp: 19490000, transmission: "AUTOMATIC", fuel: "BENCINA", engineDisplacementCc: 1462, powerHp: 102, torqueNm: 130, consumptionCityKmL: 13.2, consumptionHighwayKmL: 17.1, lengthMm: 3645, widthMm: 1645, heightMm: 1725, weightKg: 1125, trunkLiters: 85
    },

    // Subaru Forester (SUV) — 2 versiones
    { brandName: "Subaru", modelName: "Forester", name: "2.5i AWD", year: 2024, priceClp: 24990000, transmission: "CVT", fuel: "BENCINA", engineDisplacementCc: 2498, powerHp: 185, torqueNm: 239, consumptionCityKmL: 10.5, consumptionHighwayKmL: 14.4, lengthMm: 4640, widthMm: 1815, heightMm: 1730, weightKg: 1565, trunkLiters: 509
    },
    { brandName: "Subaru", modelName: "Forester", name: "2.5i AWD XT", year: 2024, priceClp: 28990000, transmission: "CVT", fuel: "BENCINA", engineDisplacementCc: 2498, powerHp: 241, torqueNm: 350, consumptionCityKmL: 10.0, consumptionHighwayKmL: 13.8, lengthMm: 4640, widthMm: 1815, heightMm: 1730, weightKg: 1595, trunkLiters: 509
    },
    // Subaru XV (SUV) — 2 versiones
    { brandName: "Subaru", modelName: "XV", name: "2.0i AWD", year: 2024, priceClp: 18990000, transmission: "CVT", fuel: "BENCINA", engineDisplacementCc: 1995, powerHp: 156, torqueNm: 196, consumptionCityKmL: 11.4, consumptionHighwayKmL: 15.4, lengthMm: 4485, widthMm: 1800, heightMm: 1615, weightKg: 1450, trunkLiters: 385
    },
    { brandName: "Subaru", modelName: "XV", name: "2.0i AWD EyeSight", year: 2024, priceClp: 21990000, transmission: "CVT", fuel: "BENCINA", engineDisplacementCc: 1995, powerHp: 156, torqueNm: 196, consumptionCityKmL: 11.1, consumptionHighwayKmL: 15.1, lengthMm: 4485, widthMm: 1800, heightMm: 1615, weightKg: 1465, trunkLiters: 385
    },
    // Subaru Impreza (SEDAN) — 2 versiones
    { brandName: "Subaru", modelName: "Impreza", name: "2.0i AWD", year: 2024, priceClp: 16990000, transmission: "CVT", fuel: "BENCINA", engineDisplacementCc: 1995, powerHp: 156, torqueNm: 196, consumptionCityKmL: 11.6, consumptionHighwayKmL: 15.6, lengthMm: 4640, widthMm: 1775, heightMm: 1455, weightKg: 1410, trunkLiters: 460
    },
    { brandName: "Subaru", modelName: "Impreza", name: "2.0i AWD EyeSight", year: 2024, priceClp: 19490000, transmission: "CVT", fuel: "BENCINA", engineDisplacementCc: 1995, powerHp: 156, torqueNm: 196, consumptionCityKmL: 11.3, consumptionHighwayKmL: 15.3, lengthMm: 4640, widthMm: 1775, heightMm: 1455, weightKg: 1425, trunkLiters: 460
    },

    // Ford Ranger (PICKUP) — 3 versiones
    { brandName: "Ford", modelName: "Ranger", name: "2.0 XL 4x4", year: 2024, priceClp: 22990000, transmission: "MANUAL", fuel: "DIESEL", engineDisplacementCc: 1996, powerHp: 170, torqueNm: 405, consumptionCityKmL: 9.7, consumptionHighwayKmL: 13.2, lengthMm: 5370, widthMm: 1918, heightMm: 1884, weightKg: 2155, trunkLiters: 0
    },
    { brandName: "Ford", modelName: "Ranger", name: "2.0 XLT 4x4", year: 2024, priceClp: 26990000, transmission: "AUTOMATIC", fuel: "DIESEL", engineDisplacementCc: 1996, powerHp: 170, torqueNm: 405, consumptionCityKmL: 9.4, consumptionHighwayKmL: 12.9, lengthMm: 5370, widthMm: 1918, heightMm: 1884, weightKg: 2170, trunkLiters: 0
    },
    { brandName: "Ford", modelName: "Ranger", name: "3.0 V6 Limited 4x4", year: 2024, priceClp: 38990000, transmission: "AUTOMATIC", fuel: "DIESEL", engineDisplacementCc: 2996, powerHp: 250, torqueNm: 600, consumptionCityKmL: 8.9, consumptionHighwayKmL: 12.2, lengthMm: 5370, widthMm: 1918, heightMm: 1884, weightKg: 2265, trunkLiters: 0
    },
    // Ford Escape (SUV) — 2 versiones
    { brandName: "Ford", modelName: "Escape", name: "2.0 EcoBoost SE", year: 2024, priceClp: 21490000, transmission: "AUTOMATIC", fuel: "BENCINA", engineDisplacementCc: 1999, powerHp: 250, torqueNm: 380, consumptionCityKmL: 10.7, consumptionHighwayKmL: 14.5, lengthMm: 4585, widthMm: 1882, heightMm: 1682, weightKg: 1665, trunkLiters: 475
    },
    { brandName: "Ford", modelName: "Escape", name: "2.0 EcoBoost Titanium", year: 2024, priceClp: 25490000, transmission: "AUTOMATIC", fuel: "BENCINA", engineDisplacementCc: 1999, powerHp: 250, torqueNm: 380, consumptionCityKmL: 10.4, consumptionHighwayKmL: 14.1, lengthMm: 4585, widthMm: 1882, heightMm: 1682, weightKg: 1680, trunkLiters: 475
    },
    // Ford Territory (SUV) — 2 versiones
    { brandName: "Ford", modelName: "Territory", name: "1.8 EcoBoost SEL", year: 2024, priceClp: 19990000, transmission: "AUTOMATIC", fuel: "BENCINA", engineDisplacementCc: 1799, powerHp: 185, torqueNm: 320, consumptionCityKmL: 11.2, consumptionHighwayKmL: 15.0, lengthMm: 4630, widthMm: 1875, heightMm: 1708, weightKg: 1585, trunkLiters: 448
    },
    { brandName: "Ford", modelName: "Territory", name: "1.8 EcoBoost Titanium", year: 2024, priceClp: 23490000, transmission: "AUTOMATIC", fuel: "BENCINA", engineDisplacementCc: 1799, powerHp: 185, torqueNm: 320, consumptionCityKmL: 10.9, consumptionHighwayKmL: 14.7, lengthMm: 4630, widthMm: 1875, heightMm: 1708, weightKg: 1600, trunkLiters: 448
    },

    // Volkswagen Golf (HATCHBACK) — 2 versiones
    { brandName: "Volkswagen", modelName: "Golf", name: "1.4 TSI Comfortline", year: 2024, priceClp: 18990000, transmission: "AUTOMATIC", fuel: "BENCINA", engineDisplacementCc: 1395, powerHp: 150, torqueNm: 250, consumptionCityKmL: 12.8, consumptionHighwayKmL: 17.5, lengthMm: 4284, widthMm: 1789, heightMm: 1456, weightKg: 1295, trunkLiters: 380
    },
    { brandName: "Volkswagen", modelName: "Golf", name: "1.4 TSI Highline", year: 2024, priceClp: 22490000, transmission: "AUTOMATIC", fuel: "BENCINA", engineDisplacementCc: 1395, powerHp: 150, torqueNm: 250, consumptionCityKmL: 12.5, consumptionHighwayKmL: 17.2, lengthMm: 4284, widthMm: 1789, heightMm: 1456, weightKg: 1310, trunkLiters: 380
    },
    // Volkswagen T-Cross (SUV) — 2 versiones
    { brandName: "Volkswagen", modelName: "T-Cross", name: "1.6 Comfortline", year: 2024, priceClp: 13990000, transmission: "AUTOMATIC", fuel: "BENCINA", engineDisplacementCc: 1598, powerHp: 110, torqueNm: 155, consumptionCityKmL: 13.2, consumptionHighwayKmL: 17.6, lengthMm: 4218, widthMm: 1760, heightMm: 1584, weightKg: 1270, trunkLiters: 420
    },
    { brandName: "Volkswagen", modelName: "T-Cross", name: "1.6 Highline", year: 2024, priceClp: 15990000, transmission: "AUTOMATIC", fuel: "BENCINA", engineDisplacementCc: 1598, powerHp: 110, torqueNm: 155, consumptionCityKmL: 12.9, consumptionHighwayKmL: 17.3, lengthMm: 4218, widthMm: 1760, heightMm: 1584, weightKg: 1285, trunkLiters: 420
    },
    // Volkswagen Nivus (SUV) — 2 versiones
    { brandName: "Volkswagen", modelName: "Nivus", name: "1.0 TSI Comfortline", year: 2024, priceClp: 13990000, transmission: "AUTOMATIC", fuel: "BENCINA", engineDisplacementCc: 999, powerHp: 116, torqueNm: 200, consumptionCityKmL: 14.2, consumptionHighwayKmL: 18.8, lengthMm: 4266, widthMm: 1757, heightMm: 1493, weightKg: 1255, trunkLiters: 415
    },
    { brandName: "Volkswagen", modelName: "Nivus", name: "1.0 TSI Highline", year: 2024, priceClp: 16490000, transmission: "AUTOMATIC", fuel: "BENCINA", engineDisplacementCc: 999, powerHp: 116, torqueNm: 200, consumptionCityKmL: 13.9, consumptionHighwayKmL: 18.5, lengthMm: 4266, widthMm: 1757, heightMm: 1493, weightKg: 1270, trunkLiters: 415
    },
  ] satisfies VersionSeed[],

  // 15 items populares. Repartidos en 38 version-equipment joins (~2.5 promedio).
  equipmentItems: [
    { name: "Climatizador", category: "Confort" },
    { name: "Bluetooth", category: "Conectividad" },
    { name: "Cámara de retroceso", category: "Seguridad" },
    { name: "Sensores traseros", category: "Seguridad" },
    { name: "Apple CarPlay", category: "Conectividad" },
    { name: "Android Auto", category: "Conectividad" },
    { name: "Tapiz de cuero", category: "Confort" },
    { name: "Asientos eléctricos", category: "Confort" },
    { name: "Sunroof", category: "Confort" },
    { name: "Control de clima dual", category: "Confort" },
    { name: "Sensor de lluvia", category: "Confort" },
    { name: "Encendido automático de luces", category: "Confort" },
    { name: "Cuadro digital", category: "Conectividad" },
    { name: "Carga inalámbrica", category: "Conectividad" },
    { name: "Asientos calefaccionados", category: "Confort" },
  ] satisfies EquipmentItemSeed[],

  // Distribución por version (38 joins totales).
  // Comunes (5/5/4): Climatizador, Bluetooth, Cámara de retroceso.
  // Medios  (3 c/u): Sensores traseros, Apple CarPlay, Android Auto, Control de clima dual, Encendido automático de luces, Cuadro digital.
  // Premium (2 c/u): Tapiz de cuero, Asientos eléctricos, Sunroof.
  // Exclusivos (1 c/u): Sensor de lluvia, Carga inalámbrica, Asientos calefaccionados.
  versionEquipment: [
    // Climatizador — 5 versiones
    { brandName: "Toyota", modelName: "Corolla", versionName: "XEI 1.8", equipmentName: "Climatizador" },
    { brandName: "Toyota", modelName: "RAV4", versionName: "2.0 XLE", equipmentName: "Climatizador" },
    { brandName: "Hyundai", modelName: "Tucson", versionName: "2.0 GLS", equipmentName: "Climatizador" },
    { brandName: "Mazda", modelName: "CX-5", versionName: "2.5 Touring", equipmentName: "Climatizador" },
    { brandName: "Volkswagen", modelName: "Golf", versionName: "1.4 TSI Highline", equipmentName: "Climatizador" },

    // Bluetooth — 5 versiones
    { brandName: "Toyota", modelName: "Hilux", versionName: "2.8 SRV 4x4", equipmentName: "Bluetooth" },
    { brandName: "Hyundai", modelName: "Accent", versionName: "1.5 GLS", equipmentName: "Bluetooth" },
    { brandName: "Kia", modelName: "Sportage", versionName: "2.0 EX", equipmentName: "Bluetooth" },
    { brandName: "Nissan", modelName: "Kicks", versionName: "1.6 Exclusive CVT", equipmentName: "Bluetooth" },
    { brandName: "Chevrolet", modelName: "Tracker", versionName: "1.2T LT", equipmentName: "Bluetooth" },

    // Cámara de retroceso — 4 versiones
    { brandName: "Subaru", modelName: "Forester", versionName: "2.5i AWD", equipmentName: "Cámara de retroceso" },
    { brandName: "Nissan", modelName: "X-Trail", versionName: "2.5 Sense CVT", equipmentName: "Cámara de retroceso" },
    { brandName: "Ford", modelName: "Escape", versionName: "2.0 EcoBoost SE", equipmentName: "Cámara de retroceso" },
    { brandName: "Mazda", modelName: "CX-3", versionName: "2.0 Touring", equipmentName: "Cámara de retroceso" },

    // Sensores traseros — 3 versiones
    { brandName: "Toyota", modelName: "RAV4", versionName: "2.5 Hybrid Limited", equipmentName: "Sensores traseros" },
    { brandName: "Hyundai", modelName: "Tucson", versionName: "2.0 Limited", equipmentName: "Sensores traseros" },
    { brandName: "Kia", modelName: "Sportage", versionName: "2.0 GT-Line", equipmentName: "Sensores traseros" },

    // Apple CarPlay — 3 versiones
    { brandName: "Toyota", modelName: "Corolla", versionName: "SEG Hybrid 1.8", equipmentName: "Apple CarPlay" },
    { brandName: "Mazda", modelName: "Mazda3", versionName: "2.5 Grand Touring", equipmentName: "Apple CarPlay" },
    { brandName: "Volkswagen", modelName: "T-Cross", versionName: "1.6 Highline", equipmentName: "Apple CarPlay" },

    // Android Auto — 3 versiones
    { brandName: "Toyota", modelName: "Hilux", versionName: "2.8 GR-S 4x4", equipmentName: "Android Auto" },
    { brandName: "Kia", modelName: "Morning", versionName: "1.4 EX", equipmentName: "Android Auto" },
    { brandName: "Volkswagen", modelName: "Nivus", versionName: "1.0 TSI Highline", equipmentName: "Android Auto" },

    // Tapiz de cuero — 2 versiones
    { brandName: "Hyundai", modelName: "Tucson", versionName: "2.0 Limited", equipmentName: "Tapiz de cuero" },
    { brandName: "Mazda", modelName: "CX-5", versionName: "2.5 Grand Touring", equipmentName: "Tapiz de cuero" },

    // Asientos eléctricos — 2 versiones
    { brandName: "Subaru", modelName: "Forester", versionName: "2.5i AWD XT", equipmentName: "Asientos eléctricos" },
    { brandName: "Ford", modelName: "Ranger", versionName: "3.0 V6 Limited 4x4", equipmentName: "Asientos eléctricos" },

    // Sunroof — 2 versiones
    { brandName: "Toyota", modelName: "RAV4", versionName: "2.5 Hybrid Limited", equipmentName: "Sunroof" },
    { brandName: "Volkswagen", modelName: "Golf", versionName: "1.4 TSI Highline", equipmentName: "Sunroof" },

    // Control de clima dual — 2 versiones
    { brandName: "Hyundai", modelName: "Tucson", versionName: "2.0 GLS", equipmentName: "Control de clima dual" },
    { brandName: "Nissan", modelName: "X-Trail", versionName: "2.5 Exclusive CVT 4WD", equipmentName: "Control de clima dual" },

    // Encendido automático de luces — 2 versiones
    { brandName: "Toyota", modelName: "Corolla", versionName: "XEI 1.8", equipmentName: "Encendido automático de luces" },
    { brandName: "Mazda", modelName: "CX-5", versionName: "2.5 Touring", equipmentName: "Encendido automático de luces" },

    // Cuadro digital — 2 versiones
    { brandName: "Toyota", modelName: "Hilux", versionName: "2.8 GR-S 4x4", equipmentName: "Cuadro digital" },
    { brandName: "Ford", modelName: "Ranger", versionName: "3.0 V6 Limited 4x4", equipmentName: "Cuadro digital" },

    // Sensor de lluvia — 1 versión (exclusivo)
    { brandName: "Subaru", modelName: "XV", versionName: "2.0i AWD EyeSight", equipmentName: "Sensor de lluvia" },

    // Carga inalámbrica — 1 versión (exclusivo)
    { brandName: "Volkswagen", modelName: "Nivus", versionName: "1.0 TSI Highline", equipmentName: "Carga inalámbrica" },

    // Asientos calefaccionados — 1 versión (exclusivo)
    { brandName: "Subaru", modelName: "Forester", versionName: "2.5i AWD XT", equipmentName: "Asientos calefaccionados" },
  ] satisfies VersionEquipmentSeed[],
};

// Generador de maintenance costs por versión.
// 4 puntos de servicio típicos en Chile: 10000, 30000, 60000, 100000 km.
// El costo escala con el desplazamiento del motor y el tipo de combustible.
export function generateMaintenanceCosts(version: VersionSeed): MaintenanceCostSeed[] {
  const base = version.fuel === "DIESEL" ? 110000 : version.fuel === "HYBRID" ? 85000 : 90000;
  const sizeFactor = 1 + version.engineDisplacementCc / 4000;
  return [
    { brandName: version.brandName, modelName: version.modelName, versionName: version.name, mileageTag: 10000, costClp: Math.round(base * sizeFactor * 1.0) },
    { brandName: version.brandName, modelName: version.modelName, versionName: version.name, mileageTag: 30000, costClp: Math.round(base * sizeFactor * 1.7) },
    { brandName: version.brandName, modelName: version.modelName, versionName: version.name, mileageTag: 60000, costClp: Math.round(base * sizeFactor * 2.5) },
    { brandName: version.brandName, modelName: version.modelName, versionName: version.name, mileageTag: 100000, costClp: Math.round(base * sizeFactor * 3.4) },
  ];
}