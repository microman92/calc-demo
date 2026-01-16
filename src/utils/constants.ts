// Структура данных для труб с разделением на медные и стальные
export interface TubeSize {
  type: 'copper' | 'steel';
  dn: string; // Диаметр номинальный (DN)
  inch: string; // Размер в дюймах
  mm: number; // Наружный диаметр в мм
  wallThicknesses: Record<number, number>; // Доступные толщины изоляции
}

export const ALL_TUBE_SIZES: TubeSize[] = [
  // Медные трубы (Cu)
  { type: 'copper', dn: 'DN8', inch: '1/4"', mm: 6, wallThicknesses: { 6: 486, 9: 342, 13: 216 } },
  { type: 'copper', dn: 'DN8', inch: '5/16"', mm: 8, wallThicknesses: { 6: 432, 9: 306, 13: 198 } },
  { type: 'copper', dn: 'DN10', inch: '3/8"', mm: 10, wallThicknesses: { 6: 378, 9: 270, 13: 180 } },
  { type: 'copper', dn: 'DN15', inch: '1/2"', mm: 12, wallThicknesses: { 6: 342, 9: 234, 13: 162 } },
  { type: 'copper', dn: 'DN15', inch: '5/8"', mm: 15, wallThicknesses: { 6: 270, 9: 198, 13: 144 } },
  { type: 'copper', dn: 'DN20', inch: '3/4"', mm: 18, wallThicknesses: { 6: 234, 9: 180, 13: 126, 19: 72, 25: 56 } },
  { type: 'copper', dn: 'DN20', inch: '7/8"', mm: 22, wallThicknesses: { 6: 198, 9: 162, 13: 108, 19: 72, 25: 48, 32: 32 } },
  { type: 'copper', dn: 'DN25', inch: '1"', mm: 25, wallThicknesses: { 6: 164, 9: 134, 13: 96, 19: 66, 25: 44, 32: 28 } },
  { type: 'copper', dn: 'DN25', inch: '1 1/8"', mm: 28, wallThicknesses: { 6: 132, 9: 108, 13: 84, 19: 60, 25: 40, 32: 24 } },
  { type: 'copper', dn: 'DN32', inch: '1 3/8"', mm: 35, wallThicknesses: { 6: 120, 9: 96, 13: 72, 19: 48, 25: 32, 32: 24 } },
  { type: 'copper', dn: 'DN40', inch: '1 5/8"', mm: 42, wallThicknesses: { 6: 108, 9: 88, 13: 56, 19: 40, 25: 24, 32: 22 } },

  // Стальные трубы (St) - согласно таблице EN 10220 / ISO 4200
  { type: 'steel', dn: 'DN6', inch: '1/8"', mm: 10.2, wallThicknesses: {} },
  { type: 'steel', dn: 'DN8', inch: '1/4"', mm: 13.5, wallThicknesses: {} },
  { type: 'steel', dn: 'DN10', inch: '3/8"', mm: 17.2, wallThicknesses: {} },
  { type: 'steel', dn: 'DN15', inch: '1/2"', mm: 21.3, wallThicknesses: { 6: 342, 9: 234, 13: 162 } },
  { type: 'steel', dn: 'DN20', inch: '3/4"', mm: 26.9, wallThicknesses: { 6: 234, 9: 180, 13: 126, 19: 72, 25: 56 } },
  { type: 'steel', dn: 'DN25', inch: '1"', mm: 33.7, wallThicknesses: { 6: 164, 9: 134, 13: 96, 19: 66, 25: 44, 32: 28 } },
  { type: 'steel', dn: 'DN32', inch: '1 1/4"', mm: 42.4, wallThicknesses: { 6: 108, 9: 88, 13: 56, 19: 40, 25: 24, 32: 22 } },
  { type: 'steel', dn: 'DN40', inch: '1 1/2"', mm: 48.3, wallThicknesses: { 9: 80, 13: 48, 19: 32, 25: 24, 32: 18 } },
  { type: 'steel', dn: 'DN50', inch: '2"', mm: 60.3, wallThicknesses: { 9: 56, 13: 40, 19: 32, 25: 18, 32: 14 } },
  { type: 'steel', dn: 'DN65', inch: '2 1/2"', mm: 76.1, wallThicknesses: { 9: 48, 13: 36, 19: 24, 25: 18, 32: 12 } },
  { type: 'steel', dn: 'DN80', inch: '3"', mm: 88.9, wallThicknesses: { 9: 42, 13: 30, 19: 24, 25: 16, 32: 12 } },
  { type: 'steel', dn: 'DN100', inch: '4"', mm: 114.3, wallThicknesses: { 9: 28, 13: 24, 19: 16, 25: 12, 32: 8 } },
];

export const MATERIALS = {
  'ROKAFLEX ST': {
    lambda: { '-20': 0.032, '0': 0.034, '20': 0.036, '40': 0.038, '60': 0.040 },
    density: { min: 41, max: 60 },
    mu: { min: 2000, max: 8000 }
  },
} as const;


// Data for sheet materials (SHEETS)
// Source: provided technical datasheets/tables in the task
export const SHEET_MATERIALS = {
  'ROKAFLEX ST': {
    // Thermal conductivity coefficient depending on temperature, W/m·K
    lambda: { '-20': 0.032, '0': 0.034, '20': 0.036, '40': 0.038, '60': 0.040 },
    mu: 7000, // water vapor diffusion resistance coefficient μ ≥ 7000
    temperatureRange: { min: -200, max: 110 },
  },
} as const;

// Area of one roll (m²/roll) for different thicknesses and roll widths
export const SHEET_ROLL_AREA_M2 = {
  width1m: { 6: 30, 9: 20, 10: 20, 13: 14, 19: 10, 25: 8, 32: 6, 40: 4, 50: 4 },
  width1_2m: { 6: 36, 9: 24, 10: 24, 13: 16.8, 19: 12, 25: 9.6, 32: 7.2, 40: 4.8, 50: 4.8 },
} as const;

// Cladding options for ROKAFLEX sheet materials
export const CLADDING_TYPES = {
  NONE: { code: '', label: 'not specified', emissivity: 0.93 }, // default value for rubber
  STD: { code: 'STD', label: 'no coating', emissivity: 0.93 }, // standard rubber emissivity
  AF: { code: 'AF', label: 'aluminum foil', emissivity: 0.05 }, // low foil emissivity
  AG: { code: 'AG', label: 'aluminum foil + PVC', emissivity: 0.05 }, // foil with protective PVC layer
  SA: { code: 'SA', label: 'self-adhesive layer', emissivity: 0.93 }, // emissivity same as base material
} as const;

export type CladdingCode = '' | 'STD' | 'AF' | 'AG' | 'SA';

// List of cladding options for select
export const CLADDING_OPTIONS = Object.values(CLADDING_TYPES).map(cladding => ({
  value: cladding.code,
  label: cladding.label,
}));

/**
 * Форматирует название трубы согласно требованиям:
 * - Медные: "1/2'' ( Cu ) - 12mm" (без DN)
 * - Стальные: "DN15 - 1/2'' (St) - 21,3mm" (с DN, запятая в мм)
 */
export const formatTubeName = (size: TubeSize): string => {
  const materialLabel = size.type === 'copper' ? 'Cu' : 'St';
  const mmFormatted = size.mm.toString().replace('.', ',');

  if (size.type === 'copper') {
    // Медные: без DN, с пробелами вокруг Cu
    return `${size.inch} ( ${materialLabel} ) - ${mmFormatted}mm`;
  } else {
    // Стальные: с DN, без пробелов вокруг St
    return `${size.dn} - ${size.inch} (${materialLabel}) - ${mmFormatted}mm`;
  }
};

