import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../HeatLossCalculator.module.scss';
// modal styles are now imported in child modals
import CalculateHModal from './CalculateHModal';
import HelpModal from './HelpModal';
import type { CondensationResults, CondensationModalParams } from '../../../types';
import CalculatorControls from '../../shared/CalculatorControls';
import LabeledField from '../../shared/LabeledField';
import LabeledSelect from '../../shared/LabeledSelect';
import { useCalculatorStore } from '../../../store/calculatorStore';
import { ALL_TUBE_SIZES, MATERIALS, formatTubeName } from '../../../utils/constants';
import { calculateDewPoint, calculateMinimumThickness } from '../../../utils/condensation';
import { computeH } from '../../../hooks/useHeatTransferCoefficient';

const CondensationCalculator: React.FC = () => {
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

  // Local parameter for relative humidity
  const [relativeHumidity, setRelativeHumidity] = useState<number>(60.0);

  // Параметр для отключения коэффициента безопасности 0.75
  const [applySafetyFactor, setApplySafetyFactor] = useState<boolean>(false);
  // Использовать продвинутый алгоритм
  const [useAdvancedAlgorithm, setUseAdvancedAlgorithm] = useState<boolean>(true);

  // Calculation results state
  const [results, setResults] = useState<CondensationResults>({
    dewpointTemperature: 0,
    minimumThickness: 0,
    nominalThickness: '',
  });

  // State to track if at least one calculation was performed
  const [, setHasCalculated] = useState<boolean>(false);

  // Modal window state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalParams, setModalParams] = useState<CondensationModalParams>({
    calculationType: 'inside',
    orientation,
    emissivity,
  });

  // Help modal window state
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);

  // Main condensation calculation function
  const calculateCondensation = (): void => {
    // Input data validation
    if (relativeHumidity <= 0 || relativeHumidity > 100 || h <= 0) {
      return;
    }
    
    try {
      // Dew point calculation
      const dewPoint = calculateDewPoint(ambientTemp, relativeHumidity);
      
      // Minimum insulation thickness calculation
      const minThickness = calculateMinimumThickness(
        tubeDiameter, 
        ambientTemp, 
        mediumTemp, 
        dewPoint, 
        material, 
        h
      );
      
      // Recommended thickness with 20% margin
      const nominalThickness = Math.ceil(minThickness * 1.2);
      
      // Find available thicknesses for selected pipe diameter
      const selectedTube = ALL_TUBE_SIZES.find(tube => tube.mm === tubeDiameter);
      const availableThicknesses = selectedTube && selectedTube.wallThicknesses
        ? Object.keys(selectedTube.wallThicknesses).map(Number).sort((a, b) => a - b)
        : [6, 9, 13, 19, 25, 32];
      
      // Select nearest available thickness that is greater than or equal to nominal
      const recommendedThickness = availableThicknesses.find(t => t >= nominalThickness) || availableThicknesses[availableThicknesses.length - 1];
      
      // Form recommendation with stock information
      let recommendation = '';
      if (selectedTube) {
        recommendation = `${formatTubeName(selectedTube)} - ${recommendedThickness}mm`;
      } else {
        recommendation = `${recommendedThickness}x25mm`;
      }

      setResults({ 
        dewpointTemperature: dewPoint,
        minimumThickness: minThickness,
        nominalThickness: recommendation
      });
      
      setHasCalculated(true);
    } catch (error) {
      // Показываем ошибку пользователю
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('Произошла ошибка при расчёте. Проверьте входные параметры.');
      }
    }
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

  // Heat transfer coefficient calculation function
  const calculateH = (): void => {
    const { calculationType, orientation: modalOrientation, emissivity: modalEmissivity } = modalParams;
    
    // Для расчёта H используем типичную толщину изоляции 9 мм для оценки наружного диаметра
    // Это необходимо, так как H зависит от наружного диаметра изоляции
    const typicalInsulationThickness = 9; // мм
    
    const h_total = computeH({
      ambientTemp,
      mediumTemp,
      tubeDiameter,
      orientation: modalOrientation,
      emissivity: modalEmissivity,
      calculationType,
      insulationThickness: typicalInsulationThickness, // Используем типичную толщину для оценки H
      useSimplifiedFormula: false,
      applySafetyFactor, // Применять ли коэффициент безопасности 0.75
      useAdvancedAlgorithm: false,
      useAdvancedSheetsAlgorithm: false,
      useKFlexAlgorithm: true, // использовать алгоритм, согласованный с K‑FLEX
      forCondensation: true, // специальный режим для конденсации
    });
    
    setH(h_total);
    setOrientation(modalOrientation);
    setEmissivity(modalEmissivity);
    setIsModalOpen(false);
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

    // Reset local parameters and results
    setRelativeHumidity(60.0);
    setResults({ dewpointTemperature: 0, minimumThickness: 0, nominalThickness: '' });
    setHasCalculated(false);
    setIsModalOpen(false);
    setIsHelpModalOpen(false);
    setModalParams({ calculationType: 'inside', orientation: 'horizontal', emissivity: 0.93 });

    navigate('/');
  };

  // Style adapter for common field
  const fieldStyles = {
    heatLossCalculator__field: styles.heatLossCalculator__field,
    heatLossCalculator__field_label: styles.heatLossCalculator__field_label,
    heatLossCalculator__field_input: styles.heatLossCalculator__field_input,
    heatLossCalculator__field_unit: styles.heatLossCalculator__field_unit,
    helpTextTall: styles.helpTextTall,
  };

  return (
    <div className={styles.heatLossCalculator}>
      <div className={styles.heatLossCalculator__container}>
        <div className={styles.heatLossCalculator__header}>
          <h1 className={styles.heatLossCalculator__header_title}>Condensation Prevention for Pipes</h1>
        </div>

        <div className={styles.heatLossCalculator__content}>
          {/* Parameters Section */}
          <div className={styles.heatLossCalculator__section}>
            <h2 className={styles.heatLossCalculator__section_title}>Parameters</h2>
            <div className={styles.heatLossCalculator__grid}>
              
              <LabeledField
                label="ambient temperature"
                helpText="air around insulation, °C"
                unit="°C"
                value={ambientTemp}
                onChange={setAmbientTemp}
                styles={fieldStyles}
              />

              <LabeledField
                label="medium temperature"
                helpText="heat carrier inside pipe, °C"
                unit="°C"
                value={mediumTemp}
                onChange={setMediumTemp}
                styles={fieldStyles}
              />
              <LabeledSelect
                label="pipe diameter"
                helpText="outer diameter, mm (Cu/St equivalents shown)"
                unit="mm"
                value={tubeDiameter}
                onChange={(v) => setTubeDiameter(+v)}
                styles={fieldStyles}
                options={ALL_TUBE_SIZES.map((size) => ({
                  value: size.mm,
                  label: formatTubeName(size),
                }))}
              />
              <LabeledSelect
                label="thermal insulation material"
                helpText="sets thermal conductivity λ(T)"
                value={material}
                onChange={(v) => setMaterial(String(v))}
                styles={fieldStyles}
                options={Object.keys(MATERIALS).map((mat) => ({ value: mat, label: mat }))}
              />
              <div className={styles.heatLossCalculator__field}>
                <label className={styles.heatLossCalculator__field_label}>heat transfer coefficient h</label>
                <span className={styles.helpTextTall}>convection + surface radiation; can be calculated</span>
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
                <span className={styles.heatLossCalculator__field_unit}>W/m²K</span>
              </div>
              <LabeledField
                label="relative humidity (30%-95%)"
                helpText="for dew point calculation, %"
                unit="%"
                value={relativeHumidity}
                onChange={setRelativeHumidity}
                styles={fieldStyles}
                inputProps={{ min: 30, max: 95, step: 0.1 }}
              />
            </div>
          </div>

          {/* Results Section */}
          <div className={styles.heatLossCalculator__section}>
            <h2 className={styles.heatLossCalculator__section_title}>Results</h2>
            <div className={styles.heatLossCalculator__grid}>
              <div className={styles.heatLossCalculator__field}>
                <label className={styles.heatLossCalculator__field_label}>dew point</label>
                <span className={styles.helpTextTall}>temperature at which condensation begins at current humidity</span>
                <input
                  type="text"
                  value={results.dewpointTemperature.toFixed(2)}
                  readOnly
                  className={`${styles.heatLossCalculator__fieldInput} ${styles.heatLossCalculator__fieldInput}--readonly`}
                />
                <span className={styles.heatLossCalculator__field_unit}>°C</span>
              </div>
              <div className={styles.heatLossCalculator__field}>
                <label className={styles.heatLossCalculator__field_label}>minimum insulation thickness</label>
                <span className={styles.helpTextTall}>calculated minimum thickness to prevent condensation</span>
                <input
                  type="text"
                  value={results.minimumThickness.toFixed(3)}
                  readOnly
                  className={`${styles.heatLossCalculator__fieldInput} ${styles.heatLossCalculator__fieldInput}--readonly`}
                />
                <span className={styles.heatLossCalculator__field_unit}>mm</span>
              </div>
            </div>
          </div>

          {/* Control Section */}
          <CalculatorControls 
            onCalculate={calculateCondensation}
            onHelp={handleOpenHelp}
            onBack={handleBack}
            styles={styles}
            calculateLabel="Calculate"
          />
        </div>
      </div>

      <CalculateHModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        ambientTemp={ambientTemp}
        mediumTemp={mediumTemp}
        tubeDiameter={tubeDiameter}
        material={material}
        modalParams={modalParams}
        setModalParams={setModalParams}
        onCalculate={calculateH}
        applySafetyFactor={applySafetyFactor}
        setApplySafetyFactor={setApplySafetyFactor}
        useAdvancedAlgorithm={useAdvancedAlgorithm}
        setUseAdvancedAlgorithm={setUseAdvancedAlgorithm}
      />

      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </div>
  );
};

export default CondensationCalculator;
