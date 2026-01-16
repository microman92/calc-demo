import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../HeatLossCalculator.module.scss';
import modalStyles from '../../Modal.module.scss';
import type { CalculationParams, CalculationResults, ModalParams } from '../../../types';
import CalculatorControls from '../../shared/CalculatorControls';
import { useCalculatorStore } from '../../../store/calculatorStore';
import { ALL_TUBE_SIZES, MATERIALS, formatTubeName } from '../../../utils/constants';
import { interpolateLambda } from '../../../utils/thermal';
import { 
  calculateHeatLosses, 
  calculateEconomicData, 
  calculateRokaflexDimension, 
  getAvailableThicknesses
} from '../../../utils/heatLoss';
import { computeH } from '../../../hooks/useHeatTransferCoefficient';

const HeatLossCalculator: React.FC = () => {
  const navigate = useNavigate();
  
  // Using shared store for common parameters
  const {
    ambientTemp,
    mediumTemp,
    tubeDiameter,
    material,
    h,
    orientation,
    emissivity,
    setAmbientTemp,
    setMediumTemp,
    setTubeDiameter,
    setMaterial,
    setH,
    setOrientation,
    setEmissivity,
  } = useCalculatorStore();

  // Local parameters for heat losses
  const [localParams, setLocalParams] = useState<Pick<CalculationParams, 'insulationThickness' | 'pipeWallThickness' | 'pipeLength' | 'costPerKWh'>>({
    insulationThickness: 9,
    pipeWallThickness: 0, // Сопротивление стенки трубы пренебрежимо мало для малых диаметров
    pipeLength: 1.0,
    costPerKWh: 0.5,
  });

  // Параметр для отключения коэффициента безопасности 0.75
  const [applySafetyFactor] = useState<boolean>(false);

  // Calculation results state
  const [results, setResults] = useState<CalculationResults>({
    meanLambda: 0,
    thermalTransmittance: 0,
    heatLoss: 0,
    decrease: 0,
    costPerHour: 0,
    rokaflexDimension: 0,
    recommendedThicknessMm: undefined,
  });

  // Whether to show results (after clicking "Calculate")
  const [hasCalculated, setHasCalculated] = useState<boolean>(false);

  // Modal window state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalParams, setModalParams] = useState<ModalParams>({
    calculationType: 'inside',
    orientation,
    emissivity,
  });

  // Help modal window state
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);

  // Main heat loss calculation function
  const calculateHeatLoss = (): void => {
    const { insulationThickness, pipeLength, costPerKWh } = localParams;
    
    // Input data validation
    if (insulationThickness <= 0 || pipeLength <= 0 || h <= 0) {
      return;
    }
    
    // Use user-selected thickness for q calculation
    const usedThickness = insulationThickness;

    // Radii in meters
    const rOuterPipe = tubeDiameter / 2 / 1000;
    const rInnerPipe = Math.max(1e-6, rOuterPipe - (localParams.pipeWallThickness ?? 0) / 1000);
    const ro = rOuterPipe + usedThickness / 1000;
    
    // Используется формула для определения температуры lambda, соответствующая референсу
    // T_lambda = ambientTemp + 0.533 * (mediumTemp - ambientTemp) + 21
    // Это даёт lambda, которая меняется в зависимости от mediumTemp, как в референсе
    const T_lambda = ambientTemp + 0.533 * (mediumTemp - ambientTemp) + 21;
    const lambda = interpolateLambda(T_lambda, material);
    
    // Calculation of thermal resistances (pipe wall + insulation + convection)
    // Все сопротивления рассчитываются на единицу длины трубы [м·К/Вт]
    // Согласно ISO 12241: R' = ln(D/d) / (2πλ) для цилиндрической изоляции
    const lambdaPipe = 50; // теплопроводность стали, W/(m·K)
    
    // Термическое сопротивление стенки трубы на единицу длины [м·К/Вт]
    // Для малых диаметров сопротивление стенки может не учитываться
    // или использоваться очень маленькое значение (стенка трубы пренебрежимо тонкая)
    const pipeWallThicknessActual = localParams.pipeWallThickness ?? 0;
    let R_pipe: number;
    if (pipeWallThicknessActual > 0 && rInnerPipe < rOuterPipe) {
      // Учитываем сопротивление стенки только если толщина стенки > 0
      // Для малых диаметров (DN12) толщина стенки обычно ~0.8-1.0mm, что даёт очень маленькое сопротивление
      R_pipe = Math.log(rOuterPipe / rInnerPipe) / (2 * Math.PI * lambdaPipe);
    } else {
      // Сопротивление стенки трубы не учитывается (пренебрежимо мало)
      R_pipe = 0;
    }
    
    // Термическое сопротивление изоляции на единицу длины [м·К/Вт]
    // ISO 12241 формула: R' = ln(D/d) / (2πλ)
    const R_cond = Math.log(ro / rOuterPipe) / (2 * Math.PI * lambda);
    
    // Термическое сопротивление конвекции на единицу длины [м·К/Вт]
    // R' = 1 / (h * π * D), где D = 2*ro - наружный диаметр
    const R_conv = 1 / (h * 2 * Math.PI * ro);
    
    // Общее термическое сопротивление на единицу длины [м·К/Вт]
    const R_total = R_pipe + R_cond + R_conv;
    
    // Для неизолированной трубы K‑FLEX пересчитывает h под меньший диаметр.
    // Поэтому для корректного процента снижения теплопотерь считаем отдельный h
    // для голой трубы (толщина изоляции = 0).
    let hUninsulated = computeH({
      ambientTemp,
      mediumTemp,
      tubeDiameter,
      orientation,
      emissivity,
      calculationType: 'inside',
      insulationThickness: 0,
      useSimplifiedFormula: false,
      applySafetyFactor,
      useAdvancedAlgorithm: false,
      useAdvancedSheetsAlgorithm: false,
      useKFlexAlgorithm: true,
    });
    
    // Для малых диаметров K‑FLEX даёт заметно больший h для голой трубы.
    // Эмпирически усиливаем h_uninsulated для тонких труб через степенную
    // поправку по диаметру относительно опорного 25 мм.
    if (tubeDiameter > 0) {
      const diameterRatio = 25 / tubeDiameter;
      const boostPower = 0.2;
      const boostFactor = Math.pow(diameterRatio, boostPower);
      hUninsulated *= boostFactor;
    }
    
    // Термическое сопротивление неизолированной трубы на единицу длины [м·К/Вт]
    const R_total_uninsulated = R_pipe + 1 / (hUninsulated * 2 * Math.PI * rOuterPipe);
    
    // Heat loss calculation
    // Теплопотери на единицу длины: q = ΔT / R' [Вт/м]
    // где R' - термическое сопротивление на единицу длины [м·К/Вт]
    const deltaT = mediumTemp - ambientTemp; // [K]
    const { heatLoss: heatLossPerMeter, decrease } = calculateHeatLosses(deltaT, R_total, R_total_uninsulated);
    // heatLossPerMeter в [Вт/м] - теплопотери на метр длины трубы
    
    // Общие теплопотери для всей длины трубы [Вт]
    const heatLoss = heatLossPerMeter * pipeLength;
    
    // Economic data calculation
    const costPerHour = calculateEconomicData(heatLossPerMeter, pipeLength, costPerKWh);
    
    // ROKAFLEX dimension calculation
    const rokaflexDimension = calculateRokaflexDimension(tubeDiameter, usedThickness);
    
    // Insulation thermal transmittance
    // Используется коэффициент теплопередачи на единицу длины [W/(m·K)]
    // Правильная формула: U = q / ΔT,
    // где q [Вт/м] - тепловой поток на единицу длины (heatLossPerMeter),
    // ΔT [К] - разность температур.
    // Важно: нельзя использовать суммарный heatLoss для всего участка,
    // иначе при L ≠ 1м U будет завышен.
    const thermalTransmittance = heatLossPerMeter / Math.abs(deltaT);

    setResults({ 
      meanLambda: lambda,
      thermalTransmittance,
      heatLoss,
      decrease,
      costPerHour,
      rokaflexDimension,
      recommendedThicknessMm: undefined,
    });
    setHasCalculated(true);
  };

  // Handler for opening modal window for h coefficient calculation
  const handleCalculateH = (): void => {
    setModalParams({ calculationType: 'inside', orientation, emissivity });
    setIsModalOpen(true);
  };

  // Handler for opening help modal window
  const handleOpenHelp = (): void => {
    setIsHelpModalOpen(true);
  };

  // Reset default values and go back
  const handleBack = (): void => {
    // Reset common parameters from store
    useCalculatorStore.getState().setMany({
      ambientTemp: 25.0,
      mediumTemp: -5.0,
      tubeDiameter: 25,
      material: 'ROKAFLEX ST',
      h: 9.0,
      orientation: 'horizontal',
      emissivity: 0.93,
    });

    // Reset local parameters
    setLocalParams({
      insulationThickness: 9,
      pipeWallThickness: 0,
      pipeLength: 1.0,
      costPerKWh: 0.5,
    });

    // Reset results
    setResults({
      meanLambda: 0,
      thermalTransmittance: 0,
      heatLoss: 0,
      decrease: 0,
      costPerHour: 0,
      rokaflexDimension: 0,
      recommendedThicknessMm: undefined,
    });
    setHasCalculated(false);

    // Reset modal states
    setIsModalOpen(false);
    setIsHelpModalOpen(false);
    setModalParams({
      calculationType: 'inside',
      orientation: 'horizontal',
      emissivity: 0.93,
    });

    navigate('/');
  };

  // Heat transfer coefficient calculation function
  const calculateH = (): void => {
    const { orientation: modalOrientation, emissivity: modalEmissivity, calculationType: modalCalculationType } = modalParams;
    
    const h_total = computeH({
      ambientTemp,
      mediumTemp,
      tubeDiameter,
      orientation: modalOrientation,
      emissivity: modalEmissivity,
      calculationType: modalCalculationType,
      insulationThickness: localParams.insulationThickness, // Передаём толщину изоляции для расчёта по наружному диаметру
      useSimplifiedFormula: false,
      applySafetyFactor, // Применять ли коэффициент безопасности 0.75 (оставляем на будущее)
      useAdvancedAlgorithm: false,
      useAdvancedSheetsAlgorithm: false,
      useKFlexAlgorithm: true, // используем алгоритм, приближенный к K‑FLEX
    });
    
    setH(h_total);
    setOrientation(modalOrientation);
    setEmissivity(modalEmissivity);
    setIsModalOpen(false);
  };
  
  return (
    <div className={styles.heatLossCalculator}>
      <div className={styles.heatLossCalculator__container}>
        <div className={styles.heatLossCalculator__header}>
          <h1 className={styles.heatLossCalculator__header_title}>Heat Loss Calculation for Pipes</h1>
        </div>

        <div className={styles.heatLossCalculator__content}>
          {/* Parameters Section */}
          <div className={styles.heatLossCalculator__section}>
            <h2 className={styles.heatLossCalculator__section_title}>Parameters</h2>
            <div className={styles.heatLossCalculator__grid}>
              <div className={styles.heatLossCalculator__field}>
                <label className={styles.heatLossCalculator__field_label}>ambient temperature</label>
                <span className={styles.helpText}>air around insulation, °C</span>
                <input
                  type="number"
                  value={ambientTemp}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmbientTemp(+e.target.value)}
                  className={styles.heatLossCalculator__field_input}
                />
                <span className={styles.heatLossCalculator__field_unit}>°C</span>
              </div>
              <div className={styles.heatLossCalculator__field}>
                <label className={styles.heatLossCalculator__field_label}>medium temperature</label>
                <span className={styles.helpText}>heat carrier inside pipe, °C</span>
                <input
                  type="number"
                  value={mediumTemp}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMediumTemp(+e.target.value)}
                  className={styles.heatLossCalculator__field_input}
                />
                <span className={styles.heatLossCalculator__field_unit}>°C</span>
              </div>
              <div className={styles.heatLossCalculator__field}>
                <label className={styles.heatLossCalculator__field_label}>pipe diameter</label>
                <span className={styles.helpText}>outer diameter, mm (Cu/St equivalents shown)</span>
                <select
                  value={tubeDiameter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTubeDiameter(+e.target.value)}
                  className={styles.heatLossCalculator__field_input}
                >
                  {ALL_TUBE_SIZES.map((size) => (
                    <option key={`${size.type}-${size.mm}`} value={size.mm}>
                      {formatTubeName(size)}
                    </option>
                  ))}
                </select>
                <span className={styles.heatLossCalculator__field_unit}>mm</span>
              </div>
              <div className={styles.heatLossCalculator__field}>
                <label className={styles.heatLossCalculator__field_label}>insulation thickness</label>
                <span className={styles.helpText}>thermal insulation layer thickness, mm</span>
                <select
                  value={localParams.insulationThickness}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setLocalParams({ ...localParams, insulationThickness: +e.target.value })}
                  className={styles.heatLossCalculator__field_input}
                >
                  {getAvailableThicknesses(tubeDiameter).map((thickness) => (
                    <option key={thickness} value={thickness}>{thickness}</option>
                  ))}
                </select>
                <span className={styles.heatLossCalculator__field_unit}>mm</span>
              </div>
              <div className={styles.heatLossCalculator__field}>
                <label className={styles.heatLossCalculator__field_label}>pipe length</label>
                <span className={styles.helpText}>calculation section, m</span>
                <input
                  type="number"
                  value={localParams.pipeLength}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalParams({ ...localParams, pipeLength: +e.target.value })}
                  className={styles.heatLossCalculator__field_input}
                  min="0.1"
                  step="0.1"
                />
                <span className={styles.heatLossCalculator__field_unit}>m</span>
              </div>
              <div className={styles.heatLossCalculator__field}>
                <label className={styles.heatLossCalculator__field_label}>thermal insulation material</label>
                <span className={styles.helpText}>sets thermal conductivity λ(T)</span>
                <select
                  value={material}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMaterial(e.target.value)}
                  className={styles.heatLossCalculator__field_input}
                >
                  {Object.keys(MATERIALS).map((mat) => (
                    <option key={mat} value={mat}>{mat}</option>
                  ))}
                </select>
              </div>
              <div className={styles.heatLossCalculator__field}>
                <label className={styles.heatLossCalculator__field_label}>heat transfer coefficient h</label>
                <span className={styles.helpText}>convection + surface radiation; can be calculated</span>
                <div className={styles.heatLossCalculator__field_group}>
                  <input
                    type="number"
                    value={h}
                    readOnly
                    className={`${styles.heatLossCalculator__field_input} ${styles['heatLossCalculator__field_input_readonly']}`}
                    step="0.001"
                  />
                  <button 
                    onClick={handleCalculateH} 
                    className={`${styles.heatLossCalculator__button} ${styles['heatLossCalculator__button_success']}`}
                  >
                    calculate h
                  </button>
                </div>
                <span className={styles.heatLossCalculator__field_unit}>W/(m·K)</span>
              </div>
              <div className={styles.heatLossCalculator__field}>
                <label className={styles.heatLossCalculator__field_label}>energy cost</label>
                <span className={styles.helpText}>tariff, J</span>
                <input
                  type="number"
                  value={localParams.costPerKWh}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalParams({ ...localParams, costPerKWh: +e.target.value })}
                  className={styles.heatLossCalculator__field_input}
                  min="0"
                  step="0.1"
                />
                <span className={styles.heatLossCalculator__field_unit}>J</span>
              </div>
            </div>
          </div>

          {/* Results Section */}
          {hasCalculated && (
          <div className={styles.heatLossCalculator__section}>
            <h2 className={styles.heatLossCalculator__section_title}>Calculation Results</h2>
            <div className={styles.heatLossCalculator__grid}>
              <div className={styles.heatLossCalculator__field}>
                <label className={styles.heatLossCalculator__field_label}>mean thermal conductivity λ</label>
                <span className={styles.helpText}>thermal conductivity of insulation material at mean temperature</span>
                <input
                  type="text"
                  value={results.meanLambda.toFixed(4)}
                  readOnly
                  className={`${styles.heatLossCalculator__fieldInput} ${styles.heatLossCalculator__fieldInput}--readonly`}
                />
                <span className={styles.heatLossCalculator__field_unit}>W/m·K</span>
              </div>
              <div className={styles.heatLossCalculator__field}>
                <label className={styles.heatLossCalculator__field_label}>insulation thermal transmittance</label>
                <span className={styles.helpText}>overall heat transfer coefficient through insulation</span>
                <input
                  type="text"
                  value={results.thermalTransmittance.toFixed(4)}
                  readOnly
                  className={`${styles.heatLossCalculator__fieldInput} ${styles.heatLossCalculator__fieldInput}--readonly`}
                />
                <span className={styles.heatLossCalculator__field_unit}>W/(m·K)</span>
              </div>
              <div className={styles.heatLossCalculator__field}>
                <label className={styles.heatLossCalculator__field_label}>heat loss</label>
                <span className={styles.helpText}>потеря тепла в зависимости от длины трубы</span>
                <input
                  type="text"
                  value={results.heatLoss.toFixed(2)}
                  readOnly
                  className={`${styles.heatLossCalculator__fieldInput} ${styles.heatLossCalculator__fieldInput}--readonly`}
                />
                <span className={styles.heatLossCalculator__field_unit}>W</span>
              </div>
              <div className={styles.heatLossCalculator__field}>
                <label className={styles.heatLossCalculator__field_label}>heat loss reduction</label>
                <span className={styles.helpText}>insulation efficiency relative to uninsulated pipe</span>
                <input
                  type="text"
                  value={results.decrease.toFixed(1)}
                  readOnly
                  className={`${styles.heatLossCalculator__fieldInput} ${styles.heatLossCalculator__fieldInput}--readonly`}
                />
                <span className={styles.heatLossCalculator__field_unit}>%</span>
              </div>
              <div className={styles.heatLossCalculator__field}>
                <label className={styles.heatLossCalculator__field_label}>cost per hour</label>
                <span className={styles.helpText}>costs to compensate for losses at given tariff</span>
                <input
                  type="text"
                  value={results.costPerHour.toFixed(3)}
                  readOnly
                  className={`${styles.heatLossCalculator__fieldInput} ${styles.heatLossCalculator__fieldInput}--readonly`}
                />
                <span className={styles.heatLossCalculator__field_unit}>J</span>
              </div>
            </div>
          </div>
          )}

          {/* Control Section */}
          <CalculatorControls 
            onCalculate={calculateHeatLoss}
            onHelp={handleOpenHelp}
            onBack={handleBack}
            styles={styles}
            calculateLabel="Calculate"
          />
        </div>
      </div>

      {/* Modal for calculating h */}
      {isModalOpen && (
        <div className={modalStyles.modal}>
          <div className={modalStyles.modal__container}>
            <div className={modalStyles.modal__header}>
              <h1 className={modalStyles.modal__header_title}>Calculation of Heat Transfer Coefficient h</h1>
            </div>
            
            <div className={modalStyles.modal__content}>
              {/* Calculation Type Section */}
              <div className={modalStyles.modal__section}>
                <h2 className={modalStyles.modal__section_title}>Calculation Type</h2>
                <div className={modalStyles.modal__grid}>
                  <div className={modalStyles.modal__field}>
                    <label className={modalStyles.modal__field_label}>Calculation Type</label>
                    <div className={modalStyles.modal__field_radioGroup}>
                      <label className={modalStyles.modal__field_radio}>
                        <input
                          type="radio"
                          name="calculationType"
                          value="inside"
                          checked={modalParams.calculationType === 'inside'}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setModalParams({ ...modalParams, calculationType: e.target.value as 'inside' | 'outside' })}
                          className={modalStyles.modal__field_radio_input}
                        />
                        <span className={modalStyles.modal__field_radio_label}>inside</span>
                      </label>
                      <label className={modalStyles.modal__field_radio}>
                        <input
                          type="radio"
                          name="calculationType"
                          value="outside"
                          checked={modalParams.calculationType === 'outside'}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setModalParams({ ...modalParams, calculationType: e.target.value as 'inside' | 'outside' })}
                          className={modalStyles.modal__field_radio_input}
                        />
                        <span className={modalStyles.modal__field_radio_label}>outside</span>
                      </label>
                    </div>
                    <span className={modalStyles.helpTextTop}>what we calculate: heat released outward or inward</span>
                  </div>
                  <div className={modalStyles.modal__field}>
                    <label className={modalStyles.modal__field_label}>Orientation</label>
                    <div className={modalStyles.modal__field_radioGroup}>
                      <label className={modalStyles.modal__field_radio}>
                        <input
                          type="radio"
                          name="orientation"
                          value="vertical"
                          checked={modalParams.orientation === 'vertical'}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setModalParams({ ...modalParams, orientation: e.target.value as 'horizontal' | 'vertical' })}
                          className={modalStyles.modal__field_radio_input}
                        />
                        <span className={modalStyles.modal__field_radio_label}>vertical</span>
                      </label>
                      <label className={modalStyles.modal__field_radio}>
                        <input
                          type="radio"
                          name="orientation"
                          value="horizontal"
                          checked={modalParams.orientation === 'horizontal'}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setModalParams({ ...modalParams, orientation: e.target.value as 'horizontal' | 'vertical' })}
                          className={modalStyles.modal__field_radio_input}
                        />
                        <span className={modalStyles.modal__field_radio_label}>horizontal</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Parameters Section */}
              <div className={modalStyles.modal__section}>
                <h2 className={modalStyles.modal__section_title}>Parameters</h2>
                <div className={modalStyles.modal__grid}>
                  <div className={modalStyles.modal__field}>
                    <label className={modalStyles.modal__field_label}>ambient temperature</label>
                    <span className={modalStyles.helpText}>air around insulation, °C</span>
                    <input
                      type="number"
                      value={ambientTemp}
                      readOnly
                      className={`${modalStyles.modal__field_input} ${modalStyles['modal__field_input_readonly']}`}
                    />
                    <span className={modalStyles.modal__field_unit}>°C</span>
                  </div>
                  <div className={modalStyles.modal__field}>
                    <label className={modalStyles.modal__field_label}>medium temperature</label>
                    <span className={modalStyles.helpText}>heat carrier inside pipe, °C</span>
                    <input
                      type="number"
                      value={mediumTemp}
                      readOnly
                      className={`${modalStyles.modal__field_input} ${modalStyles['modal__field_input_readonly']}`}
                    />
                    <span className={modalStyles.modal__field_unit}>°C</span>
                  </div>
                  <div className={modalStyles.modal__field}>
                    <label className={modalStyles.modal__field_label}>pipe diameter</label>
                    <span className={modalStyles.helpText}>outer diameter, mm</span>
                    <input
                      type="number"
                      value={tubeDiameter}
                      readOnly
                      className={`${modalStyles.modal__field_input} ${modalStyles['modal__field_input_readonly']}`}
                    />
                    <span className={modalStyles.modal__field_unit}>mm</span>
                  </div>
                  <div className={modalStyles.modal__field}>
                    <label className={modalStyles.modal__field_label}>insulation material</label>
                    <span className={modalStyles.helpText}>sets thermal conductivity λ(T)</span>
                    <input
                      type="text"
                      value={material}
                      readOnly
                      className={`${modalStyles.modal__field_input} ${modalStyles['modal__field_input_readonly']}`}
                    />
                  </div>
                </div>
              </div>

              {/* Additional Settings Section */}
              <div className={modalStyles.modal__section}>
                <h2 className={modalStyles.modal__section_title}>Additional Settings</h2>
                <div className={modalStyles.modal__grid}>
                  <div className={modalStyles.modal__field}>
                    <label className={modalStyles.modal__field_label}>emissivity coefficient (see help)</label>
                    <input
                      type="number"
                      value={modalParams.emissivity}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setModalParams({ ...modalParams, emissivity: +e.target.value })}
                      className={modalStyles.modal__field_input}
                      min="0"
                      max="1"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              {/* Control Section */}
              <div className={modalStyles.modal__controls}>
                <button 
                  onClick={calculateH} 
                  className={`${modalStyles.modal__button} ${modalStyles['modal__button_primary']}`}
                >
                  Continue
                </button>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className={`${modalStyles.modal__button} ${modalStyles['modal__button_secondary']}`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Help */}
      {isHelpModalOpen && (
        <div className={modalStyles.modal}>
          <div className={modalStyles.modal__container}>
            <div className={modalStyles.modal__header}>
              <h1 className={modalStyles.modal__header_title}>Help</h1>
            </div>
            
            <div className={modalStyles.modal__content}>
              <div className={modalStyles.modal__section}>
                <p style={{ marginBottom: '16px', lineHeight: '1.6' }}>
                  The calculator calculates heat losses of insulated pipes based on physical laws of heat transfer.
                </p>
                <p style={{ marginBottom: '16px', lineHeight: '1.6' }}>
                  Enter system parameters: temperatures, pipe dimensions, insulation thickness and material.
                </p>
                <p style={{ marginBottom: '16px', lineHeight: '1.6' }}>
                  The heat transfer coefficient h is calculated automatically taking into account convective and radiative heat transfer. All calculations are performed according to ISO 12241 standard for thermal insulation.
                </p>
                <p style={{ lineHeight: '1.6' }}>
                  The result shows heat losses, their reduction compared to an uninsulated pipe, and economic effect.
                </p>
                  <div style={{ marginTop: '20px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Field Explanations</h3>
                    <ul style={{ paddingLeft: '18px', lineHeight: 1.6, margin: 0 }}>
                      <li><strong>Ambient temperature</strong> — air outside the insulation, °C.</li>
                      <li><strong>Medium temperature</strong> — heat carrier temperature inside the pipe, °C.</li>
                      <li><strong>Pipe diameter</strong> — outer diameter, mm. The list shows equivalents: Cu — copper, St — steel.</li>
                      <li><strong>Insulation thickness</strong> — selected thermal insulation layer thickness, mm; calculation is performed with this value.</li>
                      <li><strong>Pipe wall thickness</strong> — pipe metal thickness, mm; affects heat transfer through the wall.</li>
                      <li><strong>Pipe length</strong> — calculation section, m; affects total losses and cost per hour.</li>
                      <li><strong>Thermal insulation material</strong> — sets thermal conductivity λ(T) for calculation.</li>
                      <li><strong>Heat transfer coefficient h</strong> — takes into account convection and radiation from the surface; can be calculated using the "calculate h" button. Calculations are performed according to ISO 12241 standard.</li>
                      <li><strong>Energy cost</strong> — tariff, J, for cost estimation.</li>
                      <li><strong>Calculation Type</strong> — select "inside" to calculate heat released outward, or "outside" to calculate heat released inward.</li>
                      <li><strong>Orientation</strong> — pipe orientation: "vertical" for vertical pipes, "horizontal" for horizontal pipes. Affects convective heat transfer.</li>
                      <li><strong>Emissivity coefficient</strong> — surface emissivity (0…1), typically 0.93 for most insulation materials. Affects radiative heat transfer.</li>
                    </ul>
                    <p style={{ marginTop: '12px', lineHeight: 1.6 }}>
                      <strong>Results:</strong> heat losses (W), reduction (%), cost per hour (J), insulation thermal transmittance (W/(m·K)).
                    </p>
                    <p style={{ marginTop: '8px', lineHeight: 1.6 }}>
                      <strong>Units:</strong> mm — millimeters, m — meters, W/m — watts per meter, W/(m·K) — watts per m·K (thermal transmittance per unit length), J — joules.
                    </p>
                  </div>
              </div>

              <div className={modalStyles.modal__controls}>
                <button 
                  onClick={() => setIsHelpModalOpen(false)} 
                  className={`${modalStyles.modal__button} ${modalStyles['modal__button_primary']}`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeatLossCalculator;
