import { interpolateLambda } from './thermal';
import { ALL_TUBE_SIZES } from './constants';

/**
 * Расчёт теплопотерь для изолированной и неизолированной трубы согласно ISO 12241
 * 
 * Формула: q = |ΔT| / R' [Вт/м]
 * где:
 *   q - тепловой поток на единицу длины [Вт/м]
 *   ΔT - разность температур [К]
 *   R' - термическое сопротивление на единицу длины [м·К/Вт]
 * 
 * @param deltaT Разность температур, K
 * @param R_total Термическое сопротивление изолированной трубы на единицу длины, m·K/W
 * @param R_total_uninsulated Термическое сопротивление неизолированной трубы на единицу длины, m·K/W
 * @returns Результаты расчёта: теплопотери и снижение потерь
 */
export const calculateHeatLosses = (
  deltaT: number,
  R_total: number,
  R_total_uninsulated: number
): { heatLoss: number; heatLossUninsulated: number; decrease: number } => {
  // Валидация входных параметров
  if (R_total <= 0) {
    throw new Error('Термическое сопротивление изолированной трубы должно быть положительным');
  }
  if (R_total_uninsulated <= 0) {
    throw new Error('Термическое сопротивление неизолированной трубы должно быть положительным');
  }

  // Предупреждение: обычно изоляция увеличивает термическое сопротивление
  // (R_total > R_total_uninsulated), что снижает теплопотери
  // Однако при очень тонкой изоляции или малых диаметрах может наблюдаться
  // эффект "критического диаметра", когда изоляция неэффективна
  if (R_total <= R_total_uninsulated) {
    console.warn(
      `Внимание: Термическое сопротивление изолированной трубы (${R_total.toFixed(4)} м·К/Вт) ` +
      `не больше неизолированной (${R_total_uninsulated.toFixed(4)} м·К/Вт). ` +
      `Возможно, изоляция слишком тонкая или неэффективна для данного диаметра трубы.`
    );
  }

  // Тепловой поток на единицу длины для изолированной трубы [Вт/м]
  const heatLoss = Math.abs(deltaT) / R_total;

  // Тепловой поток на единицу длины для неизолированной трубы [Вт/м]
  const heatLossUninsulated = Math.abs(deltaT) / R_total_uninsulated;

  // Снижение теплопотерь [%]
  const decrease = ((heatLossUninsulated - heatLoss) / heatLossUninsulated) * 100;

  return { heatLoss, heatLossUninsulated, decrease };
};

export const calculateEconomicData = (
  heatLoss: number,
  pipeLength: number,
  costPerKWh: number
): number => {
  const totalHeatLoss = heatLoss * pipeLength;
  const costPerHour = (totalHeatLoss / 1000) * costPerKWh;
  return costPerHour;
};

export const calculateRokaflexDimension = (tubeDiameter: number, insulationThickness: number): number => {
  const conversionTable: { [key: string]: number } = {
    '6/6': 6, '6/9': 6, '6/13': 6,
    '8/6': 8, '8/9': 8, '8/13': 8,
    '10/6': 10, '10/9': 10, '10/13': 10,
    '12/6': 12, '12/9': 12, '12/13': 12,
    '15/6': 15, '15/9': 15, '15/13': 15,
    '18/6': 18, '18/9': 18, '18/13': 18, '18/19': 18, '18/25': 18,
    '22/6': 22, '22/9': 22, '22/13': 22, '22/19': 22, '22/25': 22, '22/32': 22,
    '25/6': 25, '25/9': 25, '25/13': 25, '25/19': 25, '25/25': 25, '25/32': 25,
    '28/6': 28, '28/9': 28, '28/13': 28, '28/19': 28, '28/25': 28, '28/32': 28,
    '35/6': 35, '35/9': 35, '35/13': 35, '35/19': 35, '35/25': 35, '35/32': 35,
    '42/6': 42, '42/9': 42, '42/13': 42, '42/19': 42, '42/25': 42, '42/32': 42,
    '48/9': 48, '48/13': 48, '48/19': 48, '48/25': 48, '48/32': 48,
    '54/9': 54, '54/13': 54, '54/19': 54, '54/25': 54, '54/32': 54,
    '60/9': 60, '60/13': 60, '60/19': 60, '60/25': 60, '60/32': 60,
    '76/9': 76, '76/13': 76, '76/19': 76, '76/25': 76, '76/32': 76,
    '89/9': 89, '89/13': 89, '89/19': 89, '89/25': 89, '89/32': 89,
    '114/9': 114, '114/13': 114, '114/19': 114, '114/25': 114, '114/32': 114,
  };
  const key = `${tubeDiameter}/${insulationThickness}`;
  return conversionTable[key] || tubeDiameter;
};

export const getAvailableThicknesses = (diameter: number): number[] => {
  const tubeSize = ALL_TUBE_SIZES.find(size => size.mm === diameter);
  if (!tubeSize || !tubeSize.wallThicknesses || Object.keys(tubeSize.wallThicknesses).length === 0) {
    return [6, 9, 13, 19, 25, 32];
  }
  return Object.keys(tubeSize.wallThicknesses).map(Number).sort((a, b) => a - b);
};

/**
 * Расчёт рекомендуемой толщины изоляции согласно ISO 12241
 * 
 * Подбирает минимальную толщину из доступных размеров, при которой
 * теплопотери не превышают 15 Вт/м (целевое значение)
 * 
 * @param ambientTemp Температура окружающей среды, °C
 * @param mediumTemp Температура среды в трубе, °C
 * @param tubeDiameter Диаметр трубы, mm
 * @param pipeWallThickness Толщина стенки трубы, mm
 * @param material Материал изоляции
 * @param h Коэффициент теплопередачи, W/(m²·K)
 * @returns Рекомендуемая толщина изоляции, mm
 */
export const getRecommendedThickness = (
  ambientTemp: number,
  mediumTemp: number,
  tubeDiameter: number,
  pipeWallThickness: number | undefined,
  material: string,
  h: number
): number => {
  const candidates = getAvailableThicknesses(tubeDiameter);

  // Радиусы трубы [м]
  const rOuterPipe = tubeDiameter / 2 / 1000;
  const rInnerPipe = Math.max(1e-6, rOuterPipe - (pipeWallThickness ?? 0) / 1000);

  // Используется температура окружающей среды для определения lambda
  // Используем T_amb вместо T_mean
  const lambdaInsul = interpolateLambda(ambientTemp, material); // [Вт/(м·К)]
  const lambdaPipe = 50; // теплопроводность стали, W/(m·K)

  // Разность температур [К]
  const deltaT = mediumTemp - ambientTemp;

  // Целевое значение теплопотерь [Вт/м]
  const targetHeatLoss = 15;

  // Проверяем каждую доступную толщину
  for (const t of candidates) {
    // Наружный радиус с изоляцией [м]
    const ro = rOuterPipe + t / 1000;

    // Термические сопротивления на единицу длины [м·К/Вт]
    const R_pipe = Math.log(rOuterPipe / rInnerPipe) / (2 * Math.PI * lambdaPipe);
    const R_insul = Math.log(ro / rOuterPipe) / (2 * Math.PI * lambdaInsul);
    const R_conv = 1 / (h * 2 * Math.PI * ro);
    const R_total = R_pipe + R_insul + R_conv;

    // Термическое сопротивление неизолированной трубы [м·К/Вт]
    const R_unins = R_pipe + 1 / (h * 2 * Math.PI * rOuterPipe);

    // Расчёт теплопотерь [Вт/м]
    const { heatLoss } = calculateHeatLosses(deltaT, R_total, R_unins);

    // Если теплопотери не превышают целевое значение, возвращаем эту толщину
    if (heatLoss <= targetHeatLoss) return t;
  }

  // Если ни одна толщина не подходит, возвращаем максимальную
  return candidates[candidates.length - 1];
};



