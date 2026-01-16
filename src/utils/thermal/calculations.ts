/**
 * Модуль с чистыми функциями для расчётов теплопотерь, конденсации и связанных параметров
 * Все функции типизированы и содержат JSDoc с описанием параметров и единиц измерения
 */

/**
 * Параметры для расчёта теплопотерь трубы
 */
export interface HeatLossPipeParams {
  /** Внутренняя температура, °C */
  Ti: number;
  /** Внешняя температура, °C */
  Te: number;
  /** Внутренний диаметр трубы, м */
  d: number;
  /** Внешний диаметр изолированной трубы, м */
  D: number;
  /** Длина трубы, м */
  L: number;
  /** Теплопроводность изоляции, W/m·K */
  lambda: number;
  /** Поверхностный коэффициент теплопередачи, W/m²·K */
  h: number;
  /** Внутренний коэффициент теплопередачи, W/m²·K (опционально) */
  alpha?: number;
}

/**
 * Параметры для расчёта теплопотерь плоской поверхности
 */
export interface HeatLossSheetParams {
  /** Внутренняя температура, °C */
  Ti: number;
  /** Внешняя температура, °C */
  Te: number;
  /** Площадь поверхности, м² */
  A: number;
  /** Толщина изоляции, м */
  s: number;
  /** Теплопроводность изоляции, W/m·K */
  lambda: number;
  /** Поверхностный коэффициент теплопередачи, W/m²·K */
  h: number;
  /** Внутренний коэффициент теплопередачи, W/m²·K (опционально) */
  alpha?: number;
}

/**
 * Параметры для расчёта коэффициента h
 */
export interface HCoefficientParams {
  /** Температура поверхности, °C */
  T_sup: number;
  /** Температура окружающей среды, °C */
  T_amb: number;
  /** Коэффициент излучения (эмиссивность), безразмерный */
  epsilon: number;
  /** Скорость ветра, m/s (опционально, для наружной поверхности) */
  windSpeed?: number;
  /** Ориентация поверхности: 'horizontal' | 'vertical' (опционально, для внутренней поверхности) */
  orientation?: 'horizontal' | 'vertical';
  /** Тип расчёта: 'inside' | 'outside' */
  calculationType?: 'inside' | 'outside';
  /** Применять ли эмпирический коэффициент безопасности 0.75 (по умолчанию true) */
  applySafetyFactor?: boolean;
}

/**
 * Параметры для расчёта точки росы
 */
export interface DewPointParams {
  /** Температура воздуха, °C */
  T: number;
  /** Относительная влажность, % */
  UR: number;
}

/**
 * Параметры для расчёта температуры поверхности
 */
export interface SurfaceTemperatureParams {
  /** Температура окружающей среды, °C */
  T_amb: number;
  /** Тепловой поток, W (для трубы) или W/m² (для листа) */
  Q: number;
  /** Коэффициент теплопередачи, W/m²·K */
  h: number;
  /** Площадь поверхности, м² (для листа) или null (для трубы) */
  A?: number;
  /** Диаметр трубы, м (для трубы) или null (для листа) */
  D?: number;
  /** Длина трубы, м (для трубы) или null (для листа) */
  L?: number;
}

/**
 * Параметры для расчёта изменения температуры текущей жидкости
 */
export interface FlowingFluidTemperatureParams {
  /** Начальная температура жидкости, °C */
  Ti: number;
  /** Температура окружающей среды, °C */
  Te: number;
  /** Коэффициент теплопередачи K, W/(m·K) для трубы или W/(m²·K) для листа */
  k: number;
  /** Длина трубы, м */
  L: number;
  /** Удельная теплоёмкость жидкости, J/(kg·K) */
  Cp: number;
  /** Плотность жидкости, kg/m³ */
  rho: number;
  /** Скорость потока, m/s (для текущей жидкости) */
  v?: number;
  /** Диаметр трубы, м (для текущей жидкости) */
  d?: number;
}

/**
 * Параметры для расчёта изменения температуры статической жидкости
 */
export interface StaticFluidTemperatureParams {
  /** Начальная температура жидкости, °C */
  Ti: number;
  /** Температура окружающей среды, °C */
  Te: number;
  /** Коэффициент теплопередачи K, W/(m·K) для трубы или W/(m²·K) для листа */
  k: number;
  /** Длина трубы, м */
  L: number;
  /** Время, с */
  t: number;
  /** Удельная теплоёмкость жидкости, J/(kg·K) */
  Cp: number;
  /** Масса жидкости, kg */
  m: number;
}

/**
 * Параметры для расчёта времени замерзания
 */
export interface FreezingTimeParams {
  /** Начальная температура жидкости, °C */
  Ti: number;
  /** Температура окружающей среды, °C */
  Te: number;
  /** Температура замерзания, °C */
  T_cong: number;
  /** Коэффициент теплопередачи K, W/(m·K) для трубы */
  k: number;
  /** Длина трубы, м */
  L: number;
  /** Масса жидкости, kg */
  m: number;
  /** Удельная теплоёмкость жидкости, J/(kg·K) */
  Cp: number;
  /** Тепловой поток, W */
  Q: number;
  /** Массовая доля замерзающей части (0-1) */
  x: number;
  /** Удельная теплота плавления, J/kg */
  deltaH_fus: number;
}

/**
 * Параметры для поиска минимальной антиконденсационной толщины
 */
export interface AntiCondensationParams {
  /** Температура внутри трубы, °C */
  Ti: number;
  /** Температура окружающей среды, °C */
  Te: number;
  /** Температура воздуха, °C */
  T_amb: number;
  /** Относительная влажность, % */
  UR: number;
  /** Внутренний диаметр трубы, м */
  d: number;
  /** Теплопроводность изоляции, W/m·K */
  lambda: number;
  /** Коэффициент теплопередачи, W/m²·K */
  h: number;
  /** Стартовая толщина для поиска, м (по умолчанию 0.001) */
  minThickness?: number;
  /** Максимальная толщина для поиска, м (по умолчанию 0.1) */
  maxThickness?: number;
  /** Шаг по толщине, м (по умолчанию 0.001) */
  step?: number;
  /** Внутренний коэффициент теплопередачи, W/m²·K (опционально) */
  alpha?: number;
}

/**
 * Результат поиска минимальной антиконденсационной толщины
 */
export interface AntiCondensationResult {
  /** Подобранная толщина изоляции, м */
  thickness: number;
  /** Внешний диаметр трубы с изоляцией, м */
  D: number;
  /** Температура поверхности, °C */
  T_sup: number;
  /** Температура точки росы, °C */
  T_dew: number;
}

/**
 * Расчёт теплопотерь для трубы согласно ISO 12241
 * Формула: Q = (Ti - Te) / R_total [Вт]
 * где R_total = R_alpha + R_ins + R_conv - общее термическое сопротивление [К/Вт]
 * 
 * Термические сопротивления:
 * - R_alpha = 1/(α·π·d·L) [К/Вт] - внутренняя конвекция (если указано)
 * - R_ins = ln(D/d) / (2π·λ·L) [К/Вт] - изоляция (цилиндрическая система)
 * - R_conv = 1/(h·π·D·L) [К/Вт] - внешняя конвекция
 * 
 * @param params Параметры расчёта
 * @returns Тепловой поток, W
 */
export function calculateHeatLossPipe(params: HeatLossPipeParams): number {
  const { Ti, Te, d, D, L, lambda, h, alpha } = params;

  // Валидация входных параметров
  if (D <= d) {
    throw new Error('Наружный диаметр D должен быть больше внутреннего диаметра d');
  }
  if (L <= 0) {
    throw new Error('Длина трубы L должна быть положительной');
  }
  if (lambda <= 0) {
    throw new Error('Теплопроводность lambda должна быть положительной');
  }
  if (h <= 0) {
    throw new Error('Коэффициент теплопередачи h должен быть положительным');
  }
  if (alpha !== undefined && alpha <= 0) {
    throw new Error('Внутренний коэффициент теплопередачи alpha должен быть положительным');
  }

  const deltaT = Ti - Te; // [K]

  // Термическое сопротивление внутренней конвекции (если указано) [К/Вт]
  const R_alpha = alpha ? 1 / (alpha * Math.PI * d * L) : 0;

  // Термическое сопротивление изоляции [К/Вт]
  // ISO 12241: R = ln(D/d) / (2π·λ·L) для цилиндрической системы
  const R_ins = Math.log(D / d) / (2 * Math.PI * lambda * L);

  // Термическое сопротивление внешней конвекции [К/Вт]
  const R_conv = 1 / (h * Math.PI * D * L);

  // Общее термическое сопротивление [К/Вт]
  const R_total = R_alpha + R_ins + R_conv;

  // Тепловой поток [Вт]
  const Q = deltaT / R_total;

  return Q;
}

/**
 * Расчёт теплопотерь для плоской поверхности согласно ISO 12241
 * Формула: Q = (Ti - Te) / R_total [Вт]
 * где R_total = R_alpha + R_ins + R_conv - общее термическое сопротивление [К/Вт]
 * 
 * Термические сопротивления:
 * - R_alpha = 1/(α·A) [К/Вт] - внутренняя конвекция (если указано)
 * - R_ins = s/(λ·A) [К/Вт] - изоляция (плоская система)
 * - R_conv = 1/(h·A) [К/Вт] - внешняя конвекция
 * 
 * @param params Параметры расчёта
 * @returns Тепловой поток, W
 */
export function calculateHeatLossSheet(params: HeatLossSheetParams): number {
  const { Ti, Te, A, s, lambda, h, alpha } = params;

  // Валидация входных параметров
  if (A <= 0) {
    throw new Error('Площадь поверхности A должна быть положительной');
  }
  if (s <= 0) {
    throw new Error('Толщина изоляции s должна быть положительной');
  }
  if (lambda <= 0) {
    throw new Error('Теплопроводность lambda должна быть положительной');
  }
  if (h <= 0) {
    throw new Error('Коэффициент теплопередачи h должен быть положительным');
  }
  if (alpha !== undefined && alpha <= 0) {
    throw new Error('Внутренний коэффициент теплопередачи alpha должен быть положительным');
  }

  const deltaT = Ti - Te; // [K]

  // Термическое сопротивление внутренней конвекции (если указано) [К/Вт]
  const R_alpha = alpha ? 1 / (alpha * A) : 0;

  // Термическое сопротивление изоляции [К/Вт]
  // ISO 12241: R = s/(λ·A) для плоской системы
  const R_ins = s / (lambda * A);

  // Термическое сопротивление внешней конвекции [К/Вт]
  const R_conv = 1 / (h * A);

  // Общее термическое сопротивление [К/Вт]
  const R_total = R_alpha + R_ins + R_conv;

  // Тепловой поток [Вт]
  const Q = deltaT / R_total;

  return Q;
}

/**
 * Расчёт коэффициента теплопередачи h по алгоритму ISOcalc (упрощённый метод)
 * 
 * Алгоритм ISOcalc:
 * 1. ΔT = max(|T_sup – T_amb|, 1) [K]
 * 2. α_conv_raw = 1.32 * ΔT^0.33 [W/(m²·K)]
 * 3. α_conv = max(α_conv_raw, 1/0.13) = max(α_conv_raw, 7.6923) [W/(m²·K)]
 * 4. α_rad - расчёт по точной формуле Стефана-Больцмана:
 *    h_rad = ε * σ * (T_sup⁴ - T_amb⁴) / (T_sup - T_amb) [W/(m²·K)]
 *    где температуры в Kelvin, σ = 5.67e-8 [W/(m²·K⁴)]
 * 5. α_rad = min(α_rad, 6.5) [W/(m²·K)] - ограничение для стабильности
 * 6. h_raw = α_conv + α_rad [W/(m²·K)]
 * 7. h_final = h_raw * safetyFactor [W/(m²·K)]
 *    где safetyFactor = 0.75 (по умолчанию) - эмпирический коэффициент безопасности
 *    или safetyFactor = 1.0 (если applySafetyFactor = false)
 * 8. округлить до 3 знаков
 * 
 * Примечание: 
 * - Коэффициент 0.75 является эмпирическим
 * - Для более точных расчётов рекомендуется использовать функции через числа Нуссельта, Рэлея и Грасгофа
 * 
 * @param params Параметры расчёта
 * @returns Коэффициент теплопередачи, W/m²·K (округлён до 3 знаков)
 */
export function calculateHCoefficient(params: HCoefficientParams & { T_medium?: number }): number {
  const { T_sup, T_amb, epsilon, applySafetyFactor = true, T_medium } = params;

  // Валидация входных параметров
  if (epsilon < 0 || epsilon > 1) {
    throw new Error('Коэффициент излучения epsilon должен быть в диапазоне [0, 1]');
  }
  if (Math.abs(T_sup - T_amb) > 500) {
    console.warn(`Большая разница температур: ${Math.abs(T_sup - T_amb)}°C. Проверьте корректность входных данных.`);
  }

  // Переводим температуры в Kelvin для радиации
  const T_sup_K = T_sup + 273.15;
  const T_amb_K = T_amb + 273.15;

  // Шаг 1: ΔT для конвекции
  // Если передан T_medium, используем |T_medium - T_amb|
  // Иначе используем |T_sup - T_amb| (стандартный ISO)
  const deltaT = T_medium !== undefined
    ? Math.max(Math.abs(T_medium - T_amb), 1)
    : Math.max(Math.abs(T_sup - T_amb), 1);

  // Шаг 2: α_conv_raw = 1.32 * ΔT^0.33
  const alpha_conv_raw = 1.32 * Math.pow(deltaT, 0.33);

  // Шаг 3: α_conv = max(α_conv_raw, 1/0.13) = max(α_conv_raw, 7.6923)
  const alpha_conv = Math.max(alpha_conv_raw, 1 / 0.13);

  // Шаг 4: α_rad - точная формула Стефана-Больцмана согласно ISO 12241
  // h_rad = ε * σ * (T_sup⁴ - T_amb⁴) / (T_sup - T_amb) [W/(m²·K)]
  const sigma = 5.67e-8; // постоянная Стефана-Больцмана, W/(m²·K⁴)
  const T_sup4 = Math.pow(T_sup_K, 4);
  const T_amb4 = Math.pow(T_amb_K, 4);
  const deltaT_K = T_sup_K - T_amb_K;

  // Избегаем деления на ноль при малых разницах температур
  let alpha_rad: number;
  if (Math.abs(deltaT_K) < 0.01) {
    // Линеаризация для малых разниц: h_rad ≈ 4 * ε * σ * T_mean³
    const T_mean = (T_sup_K + T_amb_K) / 2;
    alpha_rad = 4 * epsilon * sigma * Math.pow(T_mean, 3);
  } else {
    // Точная формула Стефана-Больцмана
    alpha_rad = (epsilon * sigma * (T_sup4 - T_amb4)) / deltaT_K;
  }

  // Шаг 5: α_rad = min(α_rad, 6.5) [W/(m²·K)] - ограничение для стабильности
  alpha_rad = Math.min(alpha_rad, 6.5);

  // Шаг 6: h_raw = α_conv + α_rad [W/(m²·K)]
  const h_raw = alpha_conv + alpha_rad;

  // Шаг 7: h_final = h_raw * safetyFactor [W/(m²·K)]
  // Коэффициент 0.75 - эмпирический коэффициент безопасности
  // Можно отключить коэффициент безопасности (applySafetyFactor = false)
  const safetyFactor = applySafetyFactor ? 0.75 : 1.0;
  const h_final = h_raw * safetyFactor;

  // Шаг 8: округлить до 3 знаков
  return Math.round(h_final * 1000) / 1000;
}

/**
 * Расчёт точки росы по формуле Magnus
 * Формула: γ = ln(UR/100) + (17.62·T)/(243.12 + T)
 *          T_dew = 243.12·γ / (17.62 - γ)
 * 
 * @param params Параметры расчёта
 * @returns Температура точки росы, °C
 */
export function calculateDewPoint(params: DewPointParams): number {
  const { T, UR } = params;

  const gamma = Math.log(UR / 100) + (17.62 * T) / (243.12 + T);
  const T_dew = (243.12 * gamma) / (17.62 - gamma);

  return T_dew;
}

/**
 * Расчёт температуры поверхности
 * Формула: T_sup = T_amb + Q/(h·A)
 * 
 * Для трубы: T_sup = T_amb + Q/(h·π·D·L)
 * 
 * @param params Параметры расчёта
 * @returns Температура поверхности, °C
 */
export function calculateSurfaceTemperature(params: SurfaceTemperatureParams): number {
  const { T_amb, Q, h, A, D, L } = params;

  let surfaceArea: number;

  if (D !== undefined && L !== undefined) {
    // Для трубы
    surfaceArea = Math.PI * D * L;
  } else if (A !== undefined) {
    // Для листа
    surfaceArea = A;
  } else {
    throw new Error('Необходимо указать либо (D, L) для трубы, либо A для листа');
  }

  const T_sup = T_amb + Q / (h * surfaceArea);

  return T_sup;
}

/**
 * Расчёт коэффициента теплопередачи K (Thermal Transmittance) для трубы
 * Формула: K = Q / (L·(Ti - Te))
 * 
 * @param Q Тепловой поток, W
 * @param L Длина трубы, м
 * @param Ti Внутренняя температура, °C
 * @param Te Внешняя температура, °C
 * @returns Коэффициент теплопередачи, W/(m·K)
 */
export function calculateThermalTransmittancePipe(
  Q: number,
  L: number,
  Ti: number,
  Te: number
): number {
  const deltaT = Ti - Te;
  if (Math.abs(deltaT) < 1e-10 || L <= 0) {
    return 0;
  }
  return Q / (L * deltaT);
}

/**
 * Расчёт коэффициента теплопередачи K (Thermal Transmittance) для листа
 * Формула: K = Q / (A·(Ti - Te))
 * 
 * @param Q Тепловой поток, W
 * @param A Площадь поверхности, м²
 * @param Ti Внутренняя температура, °C
 * @param Te Внешняя температура, °C
 * @returns Коэффициент теплопередачи, W/(m²·K)
 */
export function calculateThermalTransmittanceSheet(
  Q: number,
  A: number,
  Ti: number,
  Te: number
): number {
  const deltaT = Ti - Te;
  if (Math.abs(deltaT) < 1e-10 || A <= 0) {
    return 0;
  }
  return Q / (A * deltaT);
}

/**
 * Расчёт средней температуры
 * Формула: T_m = (T_int + T_ext) / 2
 * 
 * @param T_int Внутренняя температура, °C
 * @param T_ext Внешняя температура, °C
 * @returns Средняя температура, °C
 */
export function calculateMeanTemperature(T_int: number, T_ext: number): number {
  return (T_int + T_ext) / 2;
}

/**
 * Расчёт изменения температуры текущей жидкости
 * Формула: T_f = Te + (Ti - Te)·exp(-k·L / (Cp·ρ·v·π·d²/4))
 * 
 * Упрощённая версия: T_f = Te + (Ti - Te)·exp(-k·L / (Cp·δ))
 * где δ = ρ·v·π·d²/4 - массовый расход на единицу площади
 * 
 * @param params Параметры расчёта
 * @returns Температура жидкости после прохождения длины L, °C
 */
export function calculateFlowingFluidTemperature(params: FlowingFluidTemperatureParams): number {
  const { Ti, Te, k, L, Cp, rho, v, d } = params;

  if (v === undefined || d === undefined) {
    throw new Error('Для расчёта текущей жидкости необходимо указать скорость v и диаметр d');
  }

  // Массовый расход на единицу площади
  const massFlowRate = rho * v * Math.PI * Math.pow(d, 2) / 4;

  // Экспоненциальный коэффициент
  const exponent = -k * L / (Cp * massFlowRate);

  const T_f = Te + (Ti - Te) * Math.exp(exponent);

  return T_f;
}

/**
 * Расчёт изменения температуры статической жидкости
 * Формула: T_f = Te + (Ti - Te)·exp(-k·L·t / (Cp·m))
 * 
 * @param params Параметры расчёта
 * @returns Температура жидкости после времени t, °C
 */
export function calculateStaticFluidTemperature(params: StaticFluidTemperatureParams): number {
  const { Ti, Te, k, L, t, Cp, m } = params;

  // Экспоненциальный коэффициент
  const exponent = -k * L * t / (Cp * m);

  const T_f = Te + (Ti - Te) * Math.exp(exponent);

  return T_f;
}

/**
 * Расчёт времени замерзания
 * Формула: t_freezing = (m·Cp·(Ti - T_cong) / (k·L·(T_cong - Te))) + (x·m·ΔH_fus / Q) / 3600
 * 
 * @param params Параметры расчёта
 * @returns Время замерзания, ч
 */
export function calculateFreezingTime(params: FreezingTimeParams): number {
  const { Ti, Te, T_cong, k, L, m, Cp, Q, x, deltaH_fus } = params;

  // Время охлаждения до температуры замерзания
  const t_cooling = (m * Cp * (Ti - T_cong)) / (k * L * (T_cong - Te));

  // Время замерзания (фазовый переход)
  const t_freezing_phase = (x * m * deltaH_fus) / Q;

  // Общее время в секундах, переводим в часы
  const t_total_seconds = t_cooling + t_freezing_phase;
  const t_total_hours = t_total_seconds / 3600;

  return t_total_hours;
}

/**
 * Поиск минимальной антиконденсационной толщины изоляции
 * 
 * Алгоритм:
 * 1. Рассчитываем точку росы по UR и T_amb
 * 2. Итерируем по толщине s от min до max с шагом step
 * 3. Для каждого s:
 *    - вычисляем D = d + 2*s
 *    - рассчитываем Q через формулу теплопотерь
 *    - рассчитываем T_sup
 *    - если T_sup > T_dew → возвращаем результат
 * 
 * @param params Параметры поиска
 * @returns Результат поиска или null, если не найдено подходящее значение
 */
export function findMinimalAntiCondensationThickness(
  params: AntiCondensationParams
): AntiCondensationResult | null {
  const {
    Ti,
    Te,
    T_amb,
    UR,
    d,
    lambda,
    h,
    minThickness = 0.001,
    maxThickness = 0.1,
    step = 0.001,
    alpha,
  } = params;

  // Рассчитываем точку росы
  const T_dew = calculateDewPoint({ T: T_amb, UR });

  // Итерируем по толщине
  for (let s = minThickness; s <= maxThickness; s += step) {
    // Внешний диаметр с изоляцией
    const D = d + 2 * s;

    // Рассчитываем теплопотери
    const Q = calculateHeatLossPipe({
      Ti,
      Te,
      d,
      D,
      L: 1, // Используем единичную длину для расчёта на метр
      lambda,
      h,
      alpha,
    });

    // Рассчитываем температуру поверхности
    const T_sup = calculateSurfaceTemperature({
      T_amb,
      Q,
      h,
      D,
      L: 1,
    });

    // Проверяем условие: температура поверхности должна быть выше точки росы
    if (T_sup > T_dew) {
      return {
        thickness: s,
        D,
        T_sup,
        T_dew,
      };
    }
  }

  // Не найдено подходящее значение
  return null;
}

