import { getAirProperties, calculateGrashofNumber, calculateRayleighNumber, calculateNusseltHorizontal, calculateNusseltVertical, calculateConvectiveHeatTransfer, calculateRadiativeHeatTransfer } from '../utils/thermal';
import { calculateHCoefficient } from '../utils/thermal/calculations';
import { calculateAdvancedH, calculateAdvancedH_Sheets } from '../utils/thermal/advanced-algorithm';
import { calculateKFlexH } from '../utils/thermal/kflex-algorithm';

type Orientation = 'horizontal' | 'vertical';

export interface ComputeHArgs {
  ambientTemp: number;
  mediumTemp: number;
  tubeDiameter: number; // mm
  orientation: Orientation;
  emissivity: number;
  calculationType?: 'inside' | 'outside';
  insulationThickness?: number; // mm - если указано, используется наружный диаметр изоляции для расчёта конвекции
  windSpeed?: number; // m/s - скорость ветра для расчёта наружной конвекции
  useSimplifiedFormula?: boolean; // использовать упрощённые формулы из задачи
  applySafetyFactor?: boolean; // применять ли коэффициент безопасности 0.75 (по умолчанию true)
  useAdvancedAlgorithm?: boolean; // использовать продвинутый алгоритм (по умолчанию false)
  useAdvancedSheetsAlgorithm?: boolean; // использовать продвинутый алгоритм для листов (по умолчанию false)
  useKFlexAlgorithm?: boolean; // использовать алгоритм, приближенный к K-FLEX
  forCondensation?: boolean; // специальный режим для конденсации (по умолчанию false)
}

/**
 * Расчёт коэффициента теплопередачи h согласно ISO 12241
 * 
 * По умолчанию использует упрощённые формулы (useSimplifiedFormula = true):
 * - Внутри (горизонтальная): α_conv = 1.32·(ΔT)^0.33
 * - Внутри (вертикальная): α_conv = 1.42·(ΔT)^0.25
 * - Снаружи (ветер): α_conv = 5.7 + 3.8·v
 * 
 * Для более точных расчётов рекомендуется использовать формулы через числа Нуссельта
 * (useSimplifiedFormula = false), которые учитывают:
 * - Число Грасгофа (Gr) - свободная конвекция
 * - Число Рэлея (Ra = Gr * Pr) - комбинация свободной конвекции и вязкости
 * - Число Нуссельта (Nu) - безразмерный коэффициент теплоотдачи
 * 
 * Радиационный теплообмен рассчитывается по формуле Стефана-Больцмана
 */
export const computeH = ({
  ambientTemp,
  mediumTemp,
  tubeDiameter,
  orientation,
  emissivity,
  calculationType = 'inside',
  insulationThickness,
  windSpeed,
  // In most engineering UIs, simplified formulas are the default.
  // Set false explicitly if you want the Nusselt-based path.
  useSimplifiedFormula = true,
  applySafetyFactor = true,
  useAdvancedAlgorithm = false,
  useAdvancedSheetsAlgorithm = false,
  useKFlexAlgorithm = false,
  forCondensation = false,
}: ComputeHArgs): number => {
  // Если явно указан алгоритм K‑FLEX, используем его в приоритете
  if (useKFlexAlgorithm) {
    return calculateKFlexH({
      T_amb: ambientTemp,
      T_medium: mediumTemp,
      epsilon: emissivity,
      orientation,
      tubeDiameter,
      insulationThickness,
      forCondensation,
    });
  }

  // Если указан продвинутый алгоритм для листов, используем его
  if (useAdvancedSheetsAlgorithm) {
    return calculateAdvancedH_Sheets({
      T_amb: ambientTemp,
      T_medium: mediumTemp,
      epsilon: emissivity,
      orientation,
      tubeDiameter,
      insulationThickness,
    });
  }

  // Если указан продвинутый алгоритм для труб, используем его
  if (useAdvancedAlgorithm) {
    return calculateAdvancedH({
      T_amb: ambientTemp,
      T_medium: mediumTemp,
      epsilon: emissivity,
      orientation,
      tubeDiameter,
      insulationThickness,
    });
  }

  const T_ambient = ambientTemp + 273.15;

  // Используем наружный диаметр изоляции, если указана толщина (как в референсе)
  // Иначе используем диаметр трубы
  const effectiveDiameter = insulationThickness
    ? (tubeDiameter + 2 * insulationThickness) / 1000
    : tubeDiameter / 1000;

  const meanTemp = (ambientTemp + mediumTemp) / 2;
  const deltaT_estimate = Math.abs(mediumTemp - ambientTemp);

  // Улучшенная оценка температуры поверхности для более точного расчёта излучения
  // Для изолированной трубы температура поверхности ближе к температуре окружающей среды
  // Используем взвешенную оценку: T_surface ≈ T_amb + 0.3 * (T_med - T_amb)
  // Это даёт более консервативную оценку, соответствующую референсу
  const T_surface_estimate = T_ambient + 0.3 * (mediumTemp - ambientTemp);

  // Simplified formulas (default)
  if (useSimplifiedFormula) {
    // Используем упрощённые формулы из референса
    // T_medium передаём для правильного расчёта deltaT в конвекционных формулах
    return calculateHCoefficient({
      T_sup: ambientTemp + 0.3 * (mediumTemp - ambientTemp),
      T_amb: ambientTemp,
      T_medium: mediumTemp, // Передаём температуру среды для расчёта deltaT в конвекции
      epsilon: emissivity,
      windSpeed,
      orientation,
      calculationType,
      applySafetyFactor, // Передаём параметр для применения коэффициента безопасности
    });
  }

  // Иначе используем более точные формулы через числа Нуссельта (для совместимости)
  const airProps = getAirProperties(meanTemp);
  const grashofNumber = calculateGrashofNumber(
    airProps.thermalExpansion,
    deltaT_estimate,
    effectiveDiameter,
    airProps.kinematicViscosity
  );
  const rayleighNumber = calculateRayleighNumber(grashofNumber, airProps.prandtlNumber);
  const nusseltNumber = orientation === 'horizontal'
    ? calculateNusseltHorizontal(rayleighNumber)
    : calculateNusseltVertical(rayleighNumber);
  const h_conv = calculateConvectiveHeatTransfer(nusseltNumber, airProps.thermalConductivity, effectiveDiameter);
  const h_rad = calculateRadiativeHeatTransfer(emissivity, T_surface_estimate, T_ambient);
  return h_conv + h_rad;
};



