/**
 * Алгоритм расчёта коэффициента теплопередачи h,
 * приближенный к поведению калькулятора K-FLEX.
 *
 * Основан на обратной инженерии и документации из шаблонного проекта:
 * - конвекция: alpha_conv = C * ΔT^n с поправкой по диаметру
 * - радиация: линейная форма закона Стефана–Больцмана
 * - без коэффициента безопасности 0.75
 */

export type Orientation = 'horizontal' | 'vertical';

export interface KFlexHParams {
  /** Температура окружающей среды, °C */
  T_amb: number;
  /** Температура среды в трубе, °C */
  T_medium: number;
  /** Коэффициент излучения (эмиссивность), 0..1 */
  epsilon: number;
  /** Ориентация трубы */
  orientation?: Orientation;
  /** Наружный диаметр трубы, mm */
  tubeDiameter?: number;
  /** Толщина изоляции, mm */
  insulationThickness?: number;
}

/**
 * Расчёт h по приближённому алгоритму K‑FLEX.
 *
 * Важное допущение: поправка по диаметру делается относительно
 * эталонного случая D_ref = 43 мм (труба 25 мм + изоляция 9 мм).
 * 
 * Для конденсации используется немного другой коэффициент конвекции,
 * чтобы лучше соответствовать референсу K‑FLEX.
 */
export function calculateKFlexH(params: KFlexHParams & { forCondensation?: boolean }): number {
  const {
    T_amb,
    T_medium,
    epsilon,
    orientation = 'horizontal',
    tubeDiameter,
    insulationThickness,
    forCondensation = false,
  } = params;

  if (epsilon < 0 || epsilon > 1) {
    throw new Error('Эмиссивность должна быть в диапазоне [0, 1]');
  }

  const deltaT = Math.max(Math.abs(T_medium - T_amb), 1);

  // --- Конвекция ---
  // Для конденсации K‑FLEX использует коэффициенты, зависящие от deltaT:
  // Калибровка по референсным данным:
  // - deltaT = 30K (25/-5): h ≈ 10.1 → baseCoeff ≈ 1.60
  // - deltaT = 65K (25/-40): h ≈ 9.68 → baseCoeff ≈ 1.44
  // Линейная интерполяция: baseCoeff = 1.646 - 0.0057 * (deltaT - 30)
  let baseCoeff: number;
  if (forCondensation) {
    // Точная линейная зависимость, калиброванная по референсным точкам
    const deltaFrom30 = deltaT - 30;
    const adaptiveCoeff = orientation === 'horizontal'
      ? 1.646 - 0.0057 * deltaFrom30  // точная линейная зависимость
      : 1.8 - 0.0063 * deltaFrom30;
    // Минимальные границы для экстремальных случаев
    baseCoeff = Math.max(adaptiveCoeff, orientation === 'horizontal' ? 1.44 : 1.58);
  } else {
    baseCoeff = orientation === 'horizontal' ? 1.646 : 1.8;
  }
  const power = orientation === 'horizontal' ? 0.33 : 0.25;
  const alphaConvBase = baseCoeff * Math.pow(deltaT, power);

  let alphaConv = alphaConvBase;

  if (
    typeof tubeDiameter === 'number' &&
    typeof insulationThickness === 'number' &&
    tubeDiameter > 0 &&
    insulationThickness >= 0
  ) {
    // Наружный диаметр изоляции, м
    const D_outer = (tubeDiameter + 2 * insulationThickness) / 1000;

    // Эталонный диаметр (25 мм труба + 9 мм изоляция)
    const D_ref = 0.043; // м

    // Слабая степенная поправка по диаметру
    // Для конденсации поправка немного сильнее
    const powerCorrection = forCondensation ? 0.15 : 0.1;
    const correction = Math.pow(D_ref / D_outer, powerCorrection);
    alphaConv = alphaConvBase * correction;
  }

  // --- Радиация ---
  const sigma = 5.67e-8;
  const T_meanK = (T_amb + T_medium) / 2 + 273.15;
  const alphaRad = 4 * epsilon * sigma * Math.pow(T_meanK, 3);

  const h = alphaConv + alphaRad;

  return Math.round(h * 1000) / 1000;
}


