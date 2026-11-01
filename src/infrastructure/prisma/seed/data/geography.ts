/**
 * Costa Rica territorial division (provincias y cantones).
 *
 * Source: INEC (Instituto Nacional de Estadística y Censos) /
 * División Territorial Administrativa (DTA) de Costa Rica.
 *
 * Code convention:
 *  - Province id = INEC province code (1-7).
 *  - Canton id   = provinceCode * 100 + cantonCode
 *                  (e.g. 101 = San José, 216 = Río Cuarto).
 *
 * This file is the versioned source of truth: edit it and redeploy when the
 * division changes. The seed upserts by id, so renames propagate.
 */

export interface ProvinceSeed {
  id: number;
  name: string;
}

export interface CantonSeed {
  id: number;
  provinceId: number;
  name: string;
}

export const PROVINCES: ProvinceSeed[] = [
  { id: 1, name: "San José" },
  { id: 2, name: "Alajuela" },
  { id: 3, name: "Cartago" },
  { id: 4, name: "Heredia" },
  { id: 5, name: "Guanacaste" },
  { id: 6, name: "Puntarenas" },
  { id: 7, name: "Limón" },
];

const CANTON_NAMES_BY_PROVINCE: Record<number, string[]> = {
  1: [
    "San José", "Escazú", "Desamparados", "Puriscal", "Tarrazú", "Aserrí",
    "Mora", "Goicoechea", "Santa Ana", "Alajuelita", "Vázquez de Coronado",
    "Acosta", "Tibás", "Moravia", "Montes de Oca", "Turrubares", "Dota",
    "Curridabat", "Pérez Zeledón", "León Cortés Castro",
  ],
  2: [
    "Alajuela", "San Ramón", "Grecia", "San Mateo", "Atenas", "Naranjo",
    "Palmares", "Poás", "Orotina", "San Carlos", "Zarcero", "Sarchí",
    "Upala", "Los Chiles", "Guatuso", "Río Cuarto",
  ],
  3: [
    "Cartago", "Paraíso", "La Unión", "Jiménez", "Turrialba", "Alvarado",
    "Oreamuno", "El Guarco",
  ],
  4: [
    "Heredia", "Barva", "Santo Domingo", "Santa Bárbara", "San Rafael",
    "San Isidro", "Belén", "Flores", "San Pablo", "Sarapiquí",
  ],
  5: [
    "Liberia", "Nicoya", "Santa Cruz", "Bagaces", "Carrillo", "Cañas",
    "Abangares", "Tilarán", "Nandayure", "La Cruz", "Hojancha",
  ],
  6: [
    "Puntarenas", "Esparza", "Buenos Aires", "Montes de Oro", "Osa",
    "Quepos", "Golfito", "Coto Brus", "Parrita", "Corredores", "Garabito",
    "Monteverde", "Puerto Jiménez",
  ],
  7: ["Limón", "Pococí", "Siquirres", "Talamanca", "Matina", "Guácimo"],
};

export const CANTONS: CantonSeed[] = Object.entries(CANTON_NAMES_BY_PROVINCE)
  .flatMap(([provinceKey, names]) => {
    const provinceId = Number(provinceKey);
    return names.map((name, index) => ({
      id: provinceId * 100 + (index + 1),
      provinceId,
      name,
    }));
  })
  .sort((a, b) => a.id - b.id);
