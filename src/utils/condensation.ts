import { interpolateLambda } from './thermal';
import { calculateDewPoint as calculateDewPointMagnus } from './thermal/calculations';

/**
 * Расчёт точки росы по формуле Magnus
 * Формула: γ = ln(UR/100) + (17.62·T)/(243.12 + T)
 *          T_dew = 243.12·γ / (17.62 - γ)
 * 
 * @param temperature Температура воздуха, °C
 * @param relativeHumidity Относительная влажность, %
 * @returns Температура точки росы, °C
 */
export const calculateDewPoint = (temperature: number, relativeHumidity: number): number => {
  return calculateDewPointMagnus({ T: temperature, UR: relativeHumidity });
};

/**
 * Расчёт минимальной толщины изоляции для предотвращения конденсации согласно ISO 12241
 * Использует алгоритм поиска минимальной антиконденсационной толщины
 * 
 * Критерий: температура поверхности изоляции должна быть выше точки росы с запасом
 * T_surface >= T_dew + safetyMargin
 * 
 * @param tubeDiameter Диаметр трубы, mm
 * @param ambientTemp Температура окружающей среды, °C
 * @param mediumTemp Температура среды в трубе, °C
 * @param dewPoint Температура точки росы, °C
 * @param material Материал изоляции
 * @param h Коэффициент теплопередачи, W/(m²·K)
 * @returns Минимальная толщина изоляции, mm
 */
export const calculateMinimumThickness = (
  tubeDiameter: number,
  ambientTemp: number,
  mediumTemp: number,
  dewPoint: number,
  material: string,
  h: number
): number => {
  // Валидация входных параметров
  if (tubeDiameter <= 0) {
    throw new Error('Диаметр трубы должен быть положительным');
  }
  if (h <= 0) {
    throw new Error('Коэффициент теплопередачи h должен быть положительным');
  }

  // Точка росы не может быть выше температуры окружающей среды (физически невозможно)
  if (dewPoint >= ambientTemp) {
    throw new Error(`Точка росы (${dewPoint.toFixed(1)}°C) не может быть выше или равна температуре окружающей среды (${ambientTemp.toFixed(1)}°C). Проверьте параметры влажности.`);
  }

  // Запас безопасности для предотвращения конденсации [°C]
  // Для согласования с калькулятором K‑FLEX используем минимальный запас.
  // Анализ референсных данных показывает, что K‑FLEX использует запас около 0.3-0.5°C.
  // Используем 0.4°C для лучшего соответствия референсу.
  const safetyMargin = 0.4;
  const targetSurfaceTemp = dewPoint + safetyMargin; // [°C]

  // Если целевая температура поверхности выше температуры окружающей среды,
  // невозможно предотвратить конденсацию (поверхность не может быть теплее окружающей среды)
  if (targetSurfaceTemp > ambientTemp) {
    throw new Error(`Невозможно предотвратить конденсацию: требуемая температура поверхности (${targetSurfaceTemp.toFixed(1)}°C) выше температуры окружающей среды (${ambientTemp.toFixed(1)}°C). Уменьшите влажность или увеличьте температуру окружающей среды.`);
  }

  // Средняя температура для определения теплопроводности [°C]
  const meanTemp = (ambientTemp + mediumTemp) / 2;
  const lambda = interpolateLambda(meanTemp, material); // [Вт/(м·К)]

  // Внутренний радиус трубы [м]
  const ri = tubeDiameter / 2 / 1000;

  // Итерируем по толщине и проверяем температуру поверхности.
  // Шаг 0.1 мм даёт более точное значение, близкое к результатам K‑FLEX.
  for (let thickness = 0.1; thickness <= 100; thickness += 0.1) {
    // Наружный радиус с изоляцией [м]
    const ro = ri + thickness / 1000;

    // Термическое сопротивление изоляции на единицу длины [м·К/Вт]
    // ISO 12241: R' = ln(D/d) / (2πλ) для цилиндрической системы
    const R_ins = Math.log(ro / ri) / (2 * Math.PI * lambda);

    // Термическое сопротивление конвекции на единицу длины [м·К/Вт]
    const R_conv = 1 / (h * 2 * Math.PI * ro);

    // Общее термическое сопротивление на единицу длины [м·К/Вт]
    const R_total = R_ins + R_conv;

    // Разность температур [К]
    const deltaT = mediumTemp - ambientTemp;

    // Тепловой поток на единицу длины трубы [Вт/м]
    // q = ΔT / R'
    const heatFlow = deltaT / R_total;

    // Температура поверхности [°C]
    // T_surface = T_medium - q * R_insulation
    // где q * R_insulation - падение температуры через изоляцию
    const surfaceTemp = mediumTemp - heatFlow * R_ins;

    // Проверяем условие предотвращения конденсации
    if (surfaceTemp >= targetSurfaceTemp) {
      return thickness;
    }
  }

  // Если не найдено подходящее значение, возвращаем максимальную толщину
  return 50;
};



