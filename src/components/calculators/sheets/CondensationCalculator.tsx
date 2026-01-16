import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../HeatLossCalculator.module.scss';
import { SHEET_MATERIALS } from '../../../utils/constants';
import { calculateDewPoint } from '../../../utils/condensation';
import { calculateMinimumSheetThickness, getNominalSheetThicknessRecommendation } from '../../../utils/sheets';
import { computeH } from '../../../hooks/useHeatTransferCoefficient';
import CalculateHModal from './CalculateHModal';
import HelpModal from '../pipes/HelpModal';
import LabeledField from '../../shared/LabeledField';
import LabeledSelect from '../../shared/LabeledSelect';
import CalculatorControls from '../../shared/CalculatorControls';

const SheetsCondensationCalculator: React.FC = () => {
  const navigate = useNavigate();

  const [ambientTemp, setAmbientTemp] = useState<number>(25);
  const [mediumTemp, setMediumTemp] = useState<number>(-5);
  const [material, setMaterial] = useState<string>('ROKAFLEX ST');
  const [h, setH] = useState<number>(9);
  const [relativeHumidity, setRelativeHumidity] = useState<number>(60);

  // Для листов используется специальный алгоритм с коэффициентом конвекции 1.7516
  // и коэффициентом безопасности 0.75
  const [applySafetyFactor] = useState<boolean>(true);
  // Использовать продвинутый алгоритм для листов
  const [useAdvancedSheetsAlgorithm] = useState<boolean>(true);

  const [isHModalOpen, setHModalOpen] = useState<boolean>(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);
  const [modalParams, setModalParams] = useState<{ calculationType: 'inside' | 'outside'; orientation: 'horizontal' | 'vertical'; emissivity: number; sheetHeightM: number; cladding?: string; }>(
    { calculationType: 'inside', orientation: 'horizontal', emissivity: 0.93, sheetHeightM: 1.0, cladding: '' }
  );

  type FieldStyles = {
    heatLossCalculator__field: string;
    heatLossCalculator__field_label: string;
    heatLossCalculator__field_input: string;
    heatLossCalculator__field_unit: string;
    helpTextTall?: string;
  };
  const fieldStyles = styles as unknown as FieldStyles;

  const materialsList = useMemo(() => Object.keys(SHEET_MATERIALS), []);

  type SheetCondResults = { dewpointTemperature: number; minimumThickness: number; nominalThickness: number } | null;
  const [results, setResults] = useState<SheetCondResults>(null);

  const calculateH = () => {
    const computed = computeH({
      ambientTemp,
      mediumTemp,
      tubeDiameter: modalParams.sheetHeightM * 1000,
      orientation: modalParams.orientation,
      emissivity: modalParams.emissivity,
      calculationType: modalParams.calculationType,
      useSimplifiedFormula: false, // Используем продвинутый алгоритм для листов
      applySafetyFactor, // Применять ли коэффициент безопасности 0.75
      useAdvancedSheetsAlgorithm, // Использовать продвинутый алгоритм для листов
    });
    setH(Number(computed.toFixed(3)));
    setHModalOpen(false);
  };

  const handleCalculate = () => {
    try {
      const dew = calculateDewPoint(ambientTemp, relativeHumidity);
      const minT = calculateMinimumSheetThickness(ambientTemp, mediumTemp, dew, material, h);
      const nominal = getNominalSheetThicknessRecommendation(minT);
      setResults({ dewpointTemperature: dew, minimumThickness: minT, nominalThickness: nominal });
    } catch (error) {
      // Показываем ошибку пользователю
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('Произошла ошибка при расчёте. Проверьте входные параметры.');
      }
    }
  };

  const handleBack = () => {
    setAmbientTemp(25);
    setMediumTemp(-5);
    setMaterial('ROKAFLEX ST');
    setH(9);
    setRelativeHumidity(60);
    setResults(null);
    setHModalOpen(false);
    setIsHelpModalOpen(false);
    setModalParams({ calculationType: 'inside', orientation: 'horizontal', emissivity: 0.93, sheetHeightM: 1.0, cladding: '' });
    navigate('/');
  };

  return (
    <div className={styles.heatLossCalculator}>
      <div className={styles.heatLossCalculator__container}>
        <div className={styles.heatLossCalculator__header}>
          <h1 className={styles.heatLossCalculator__header_title}>Condensation Prevention for Sheets</h1>
        </div>

        <div className={styles.heatLossCalculator__content}>
          <div className={styles.heatLossCalculator__section}>
            <h2 className={styles.heatLossCalculator__section_title}>Parameters</h2>

            <div className={styles.heatLossCalculator__fields}>
              <LabeledField label="ambient temperature" helpText="air around insulation" unit="°C" value={ambientTemp} onChange={setAmbientTemp} styles={fieldStyles} />
              <LabeledField label="medium temperature" helpText="surface/medium temperature" unit="°C" value={mediumTemp} onChange={setMediumTemp} styles={fieldStyles} />
              <LabeledSelect label="insulation material" helpText="sets thermal conductivity λ(T)" value={material} onChange={(v) => setMaterial(String(v))} options={materialsList.map(m => ({ value: m, label: m }))} styles={fieldStyles} />

              <div className={styles.heatLossCalculator__field}>
                <label className={styles.heatLossCalculator__field_label}>heat transfer coefficient h</label>
                <span className={styles.helpText} style={{ height: 'auto' }}>convection + surface radiation; can be calculated</span>
                <div className={styles.heatLossCalculator__field_group}>
                  <input type="number" value={h} readOnly className={`${styles.heatLossCalculator__field_input} ${styles['heatLossCalculator__field_input_readonly']}`} step="0.001" />
                  <button onClick={() => setHModalOpen(true)} className={`${styles.heatLossCalculator__button} ${styles['heatLossCalculator__button_success']}`}>calculate h</button>
                </div>
                <span className={styles.heatLossCalculator__field_unit} style={{ height: 'auto' }}>W/m²K</span>
              </div>

              <LabeledField label="relative humidity (30%-95%)" helpText="for dew point calculation, %" unit="%" value={relativeHumidity} onChange={setRelativeHumidity} styles={fieldStyles} inputProps={{ min: 30, max: 95, step: 0.1 }} />
            </div>
          </div>

          {results && (
            <div className={styles.heatLossCalculator__section}>
              <h2 className={styles.heatLossCalculator__section_title}>Results</h2>
              <div className={styles.heatLossCalculator__grid}>
                <div className={styles.heatLossCalculator__field}>
                  <label className={styles.heatLossCalculator__field_label}>dew point</label>
                  <span className={styles.helpText} style={{ height: 'auto' }}>condensation start temperature at current humidity</span>
                  <input type="text" value={results.dewpointTemperature.toFixed(2)} readOnly className={`${styles.heatLossCalculator__fieldInput} ${styles.heatLossCalculator__fieldInput}--readonly`} />
                  <span className={styles.heatLossCalculator__field_unit}>°C</span>
                </div>
                <div className={styles.heatLossCalculator__field}>
                  <label className={styles.heatLossCalculator__field_label}>minimum insulation thickness</label>
                  <span className={styles.helpText} style={{ height: 'auto' }}>thickness to prevent condensation (Tsurf ≥ Tdew)</span>
                  <input type="text" value={results.minimumThickness.toFixed(1)} readOnly className={`${styles.heatLossCalculator__fieldInput} ${styles.heatLossCalculator__fieldInput}--readonly`} />
                  <span className={styles.heatLossCalculator__field_unit}>mm</span>
                </div>
                <div className={styles.heatLossCalculator__field}>
                  <label className={styles.heatLossCalculator__field_label}>nominal thickness</label>
                  <span className={styles.helpText} style={{ height: 'auto' }}>nearest available thickness from series</span>
                  <input type="text" value={`${results.nominalThickness} mm`} readOnly className={`${styles.heatLossCalculator__fieldInput} ${styles.heatLossCalculator__fieldInput}--readonly`} />
                </div>
              </div>
            </div>
          )}

          <CalculatorControls onCalculate={handleCalculate} onHelp={() => setIsHelpModalOpen(true)} onBack={handleBack} styles={styles} calculateLabel="Calculate" />
        </div>
      </div>

      <CalculateHModal
        isOpen={isHModalOpen}
        onClose={() => setHModalOpen(false)}
        ambientTemp={ambientTemp}
        mediumTemp={mediumTemp}
        material={material}
        modalParams={modalParams}
        setModalParams={setModalParams}
        onCalculate={calculateH}
        applySafetyFactor={applySafetyFactor}
        setApplySafetyFactor={undefined}
        useAdvancedAlgorithm={false}
        setUseAdvancedAlgorithm={undefined}
        useAdvancedSheetsAlgorithm={useAdvancedSheetsAlgorithm}
        setUseAdvancedSheetsAlgorithm={undefined}
        relativeHumidity={relativeHumidity}
      />

      <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
    </div>
  );
};

export default SheetsCondensationCalculator;
