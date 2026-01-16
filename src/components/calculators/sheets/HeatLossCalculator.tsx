import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../HeatLossCalculator.module.scss';
import modalStyles from '../../Modal.module.scss';
import { SHEET_MATERIALS } from '../../../utils/constants';
import { computeSheetHeatLoss } from '../../../utils/sheets';
import { computeH } from '../../../hooks/useHeatTransferCoefficient';
import CalculateHModal from './CalculateHModal';
import LabeledField from '../../shared/LabeledField';
import LabeledSelect from '../../shared/LabeledSelect';
import CalculatorControls from '../../shared/CalculatorControls';

const SheetsHeatLossCalculator: React.FC = () => {
  const navigate = useNavigate();

  const [ambientTemp, setAmbientTemp] = useState<number>(25);
  const [mediumTemp, setMediumTemp] = useState<number>(-5);
  const [thickness, setThickness] = useState<number>(10);
  const [area, setArea] = useState<number>(1);
  const [material, setMaterial] = useState<string>('ROKAFLEX ST');
  const [h, setH] = useState<number>(9);
  const [cost, setCost] = useState<number>(0.5);

  // Параметр для отключения коэффициента безопасности 0.75
  const [applySafetyFactor] = useState<boolean>(false);
  // Использовать продвинутый алгоритм
  const [useAdvancedAlgorithm] = useState<boolean>(true);

  const [isHModalOpen, setHModalOpen] = useState<boolean>(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);
  const [modalParams, setModalParams] = useState<{ calculationType: 'inside' | 'outside'; orientation: 'horizontal' | 'vertical'; emissivity: number; sheetHeightM: number; cladding?: string; }>({
    calculationType: 'inside' as 'inside' | 'outside',
    orientation: 'horizontal' as 'horizontal' | 'vertical',
    emissivity: 0.93,
    sheetHeightM: 1.0,
    cladding: '',
  });

  const materialsList = useMemo(() => Object.keys(SHEET_MATERIALS), []);

  type SheetResults = {
    meanLambda: number;
    U: number;
    Q: number;
    decrease: number;
    costPerHour: number;
  };

  const [results, setResults] = useState<SheetResults | null>(null);

  type FieldStyles = {
    heatLossCalculator__field: string;
    heatLossCalculator__field_label: string;
    heatLossCalculator__field_input: string;
    heatLossCalculator__field_unit: string;
    helpTextTall?: string;
  };
  const fieldStyles = styles as unknown as FieldStyles;

  const calculateH = () => {
    const computed = computeH({
      ambientTemp,
      mediumTemp,
      tubeDiameter: modalParams.sheetHeightM * 1000, // using height as characteristic dimension
      orientation: modalParams.orientation,
      emissivity: modalParams.emissivity,
      calculationType: modalParams.calculationType,
      useSimplifiedFormula: false, // Не используем упрощённую формулу, используем продвинутый алгоритм для листов
      applySafetyFactor, // Применять ли коэффициент безопасности 0.75
      useAdvancedAlgorithm: false, // Не используем продвинутый алгоритм для труб
      useAdvancedSheetsAlgorithm: true, // Используем продвинутый алгоритм для листов с упрощённой формулой радиации
    });
    setH(Number(computed.toFixed(3)));
    setHModalOpen(false);
  };

  const handleCalculate = () => {
    const r = computeSheetHeatLoss(
      ambientTemp,
      mediumTemp,
      thickness,
      area,
      material,
      h,
      cost
    );
    setResults(r);
  };

  const handleBack = () => {
    // Reset all input parameters
    setAmbientTemp(25);
    setMediumTemp(-5);
    setThickness(10);
    setArea(1);
    setMaterial('ROKAFLEX ST');
    setH(9);
    setCost(0.5);

    // Reset results
    setResults(null);

    // Reset modal states
    setHModalOpen(false);
    setIsHelpModalOpen(false);
    setModalParams({
      calculationType: 'inside',
      orientation: 'horizontal',
      emissivity: 0.93,
      sheetHeightM: 1.0,
      cladding: '',
    });

    navigate('/');
  };

  return (
    <div className={styles.heatLossCalculator}>
      <div className={styles.heatLossCalculator__container}>
        <div className={styles.heatLossCalculator__header}>
          <h1 className={styles.heatLossCalculator__header_title}>Heat Loss Calculation for Sheets</h1>
        </div>

        <div className={styles.heatLossCalculator__content}>
          <div className={styles.heatLossCalculator__section}>
              <h2 className={styles.heatLossCalculator__section_title}>Parameters</h2>

              <div className={styles.heatLossCalculator__fields}>
                <LabeledField label="ambient temperature" helpText="air around insulation" unit="°C" value={ambientTemp} onChange={setAmbientTemp} styles={fieldStyles} />
                <LabeledField label="medium temperature" helpText="surface/medium temperature" unit="°C" value={mediumTemp} onChange={setMediumTemp} styles={fieldStyles} />
                <LabeledField label="insulation thickness" helpText="thermal insulation layer thickness" unit="mm" value={thickness} onChange={setThickness} styles={fieldStyles} inputProps={{ min: 1, step: 1 }} />
                <LabeledField label="surface area" helpText="calculated heat exchange area" unit="m²" value={area} onChange={setArea} styles={fieldStyles} inputProps={{ min: 0.01, step: 0.01 }} />
                <LabeledSelect label="insulation material" helpText="sets thermal conductivity λ(T)" value={material} onChange={(v) => setMaterial(String(v))} options={materialsList.map(m => ({ value: m, label: m }))} styles={fieldStyles} />
                <div className={styles.heatLossCalculator__field}>
                  <label className={styles.heatLossCalculator__field_label}>heat transfer coefficient h</label>
                  <span className={styles.helpText} style={{ height: 'auto' }}>convection + surface radiation; can be calculated</span>
                  <div className={styles.heatLossCalculator__field_group}>
                    <input
                      type="number"
                      value={h}
                      readOnly
                      className={`${styles.heatLossCalculator__field_input} ${styles['heatLossCalculator__field_input_readonly']}`}
                      step="0.001"
                    />
                    <button 
                      onClick={() => setHModalOpen(true)} 
                      className={`${styles.heatLossCalculator__button} ${styles['heatLossCalculator__button_success']}`}
                    >
                      calculate h
                    </button>
                  </div>
                  <span className={styles.heatLossCalculator__field_unit} style={{ height: 'auto' }}>W/m²K</span>
                </div>
                <LabeledField label="cost per kWh" helpText="tariff, J" unit="J" value={cost} onChange={setCost} styles={fieldStyles} inputProps={{ min: 0, step: 0.01 }} />
              </div>
              
          </div>

          {results && (
              <div className={styles.heatLossCalculator__section}>
                <h2 className={styles.heatLossCalculator__section_title}>Calculation Results</h2>
                <div className={styles.heatLossCalculator__grid}>
                  <div className={styles.heatLossCalculator__field}>
                    <label className={styles.heatLossCalculator__field_label}>mean thermal conductivity λ</label>
                    <span className={styles.helpText} style={{ height: 'auto' }}>thermal conductivity of insulation material at mean temperature</span>
                    <input
                      type="text"
                      value={results.meanLambda.toFixed(4)}
                      readOnly
                      className={`${styles.heatLossCalculator__fieldInput} ${styles.heatLossCalculator__fieldInput}--readonly`}
                    />
                    <span className={styles.heatLossCalculator__field_unit} style={{ height: 'auto' }}>W/m·K</span>
                  </div>
                  <div className={styles.heatLossCalculator__field}>
                    <label className={styles.heatLossCalculator__field_label}>insulation thermal transmittance</label>
                    <span className={styles.helpText} style={{ height: 'auto' }}>overall heat transfer coefficient through insulation</span>
                    <input
                      type="text"
                      value={results.U.toFixed(4)}
                      readOnly
                      className={`${styles.heatLossCalculator__fieldInput} ${styles.heatLossCalculator__fieldInput}--readonly`}
                    />
                    <span className={styles.heatLossCalculator__field_unit} style={{ height: 'auto' }}>W/m²K</span>
                  </div>
                  <div className={styles.heatLossCalculator__field}>
                    <label className={styles.heatLossCalculator__field_label}>heat loss</label>
                    <span className={styles.helpText} style={{ height: 'auto' }}>heat loss through sheet surface</span>
                    <input
                      type="text"
                      value={results.Q.toFixed(2)}
                      readOnly
                      className={`${styles.heatLossCalculator__fieldInput} ${styles.heatLossCalculator__fieldInput}--readonly`}
                    />
                    <span className={styles.heatLossCalculator__field_unit} style={{ height: 'auto' }}>W</span>
                  </div>
                  <div className={styles.heatLossCalculator__field}>
                    <label className={styles.heatLossCalculator__field_label}>heat loss reduction</label>
                    <span className={styles.helpText} style={{ height: 'auto' }}>efficiency relative to uninsulated surface</span>
                    <input
                      type="text"
                      value={results.decrease.toFixed(1)}
                      readOnly
                      className={`${styles.heatLossCalculator__fieldInput} ${styles.heatLossCalculator__fieldInput}--readonly`}
                    />
                    <span className={styles.heatLossCalculator__field_unit} style={{ height: 'auto' }}>%</span>
                  </div>
                  <div className={styles.heatLossCalculator__field}>
                    <label className={styles.heatLossCalculator__field_label}>cost per hour</label>
                    <span className={styles.helpText} style={{ height: 'auto' }}>costs to compensate for losses at given tariff</span>
                    <input
                      type="text"
                      value={results.costPerHour.toFixed(3)}
                      readOnly
                      className={`${styles.heatLossCalculator__fieldInput} ${styles.heatLossCalculator__fieldInput}--readonly`}
                    />
                    <span className={styles.heatLossCalculator__field_unit} style={{ height: 'auto' }}>J</span>
                  </div>
                </div>
              </div>
            )}

          <CalculatorControls
            onCalculate={handleCalculate}
            onHelp={() => setIsHelpModalOpen(true)}
            onBack={handleBack}
            styles={styles}
            calculateLabel="Calculate"
          />
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
        useAdvancedAlgorithm={useAdvancedAlgorithm}
        setUseAdvancedAlgorithm={undefined}
      />

      {isHelpModalOpen && (
        <div className={modalStyles.modal}>
          <div className={modalStyles.modal__container}>
            <div className={modalStyles.modal__header}>
              <h1 className={modalStyles.modal__header_title}>Help</h1>
            </div>
            
            <div className={modalStyles.modal__content}>
              <div className={modalStyles.modal__section}>
                <p style={{ marginBottom: '16px', lineHeight: '1.6' }}>
                  The calculator calculates heat losses of insulated sheets based on physical laws of heat transfer.
                </p>
                <p style={{ marginBottom: '16px', lineHeight: '1.6' }}>
                  Enter system parameters: temperatures, sheet dimensions, insulation thickness and material.
                </p>
                <p style={{ marginBottom: '16px', lineHeight: '1.6' }}>
                  The heat transfer coefficient h is calculated automatically taking into account convective and radiative heat transfer. All calculations are performed according to ISO 12241 standard for thermal insulation.
                </p>
                <p style={{ lineHeight: '1.6' }}>
                  The result shows heat losses, their reduction compared to an uninsulated surface, and economic effect.
                </p>
                  <div style={{ marginTop: '20px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Field Explanations</h3>
                    <ul style={{ paddingLeft: '18px', lineHeight: 1.6, margin: 0 }}>
                      <li><strong>Ambient temperature</strong> — air outside the insulation, °C.</li>
                      <li><strong>Medium temperature</strong> — surface/medium temperature, °C.</li>
                      <li><strong>Insulation thickness</strong> — selected thermal insulation layer thickness, mm; calculation is performed with this value.</li>
                      <li><strong>Surface area</strong> — calculated heat exchange area, m².</li>
                      <li><strong>Thermal insulation material</strong> — sets thermal conductivity λ(T) for calculation.</li>
                      <li><strong>Heat transfer coefficient h</strong> — takes into account convection and radiation from the surface; can be calculated using the "calculate h" button. Calculations are performed according to ISO 12241 standard.</li>
                      <li><strong>Energy cost</strong> — tariff, J/kWh, for cost estimation.</li>
                      <li><strong>Calculation Type</strong> — select "inside" to calculate heat released outward, or "outside" to calculate heat released inward.</li>
                      <li><strong>Orientation</strong> — sheet orientation: "vertical" for vertical sheets, "horizontal" for horizontal sheets. Affects convective heat transfer.</li>
                      <li><strong>Emissivity coefficient</strong> — surface emissivity (0…1), typically 0.93 for most insulation materials. Affects radiative heat transfer.</li>
                      <li><strong>Sheet height</strong> — characteristic dimension for heat transfer calculation, m.</li>
                      <li><strong>Type of cladding</strong> — optional cladding type that affects surface properties.</li>
                    </ul>
                    <p style={{ marginTop: '12px', lineHeight: 1.6 }}>
                      <strong>Results:</strong> heat losses (W), reduction (%), cost per hour (J), insulation thermal transmittance (W/(m²·K)),
                    </p>
                    <p style={{ marginTop: '8px', lineHeight: 1.6 }}>
                      <strong>Units:</strong> mm — millimeters, m — meters, m² — square meters, W — watts, W/(m²·K) — watts per m²·K, J — joules.
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

export default SheetsHeatLossCalculator;
