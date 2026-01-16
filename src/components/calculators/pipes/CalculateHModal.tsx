import React from 'react';
import modalStyles from '../../Modal.module.scss';

type ModalParams = {
  calculationType: 'inside' | 'outside';
  orientation: 'horizontal' | 'vertical';
  emissivity: number;
};

type CalculateHModalProps = {
  isOpen: boolean;
  onClose: () => void;
  ambientTemp: number;
  mediumTemp: number;
  tubeDiameter: number;
  material: string;
  modalParams: ModalParams;
  setModalParams: (params: ModalParams) => void;
  onCalculate: () => void;
  applySafetyFactor?: boolean;
  setApplySafetyFactor?: (value: boolean) => void;
  useAdvancedAlgorithm?: boolean;
  setUseAdvancedAlgorithm?: (value: boolean) => void;
};

const CalculateHModal: React.FC<CalculateHModalProps> = ({
  isOpen,
  onClose,
  ambientTemp,
  mediumTemp,
  tubeDiameter,
  material,
  modalParams,
  setModalParams,
  onCalculate,
}) => {
  if (!isOpen) return null;

  return (
    <div className={modalStyles.modal}>
      <div className={modalStyles.modal__container}>
        <div className={modalStyles.modal__header}>
          <h1 className={modalStyles.modal__header_title}>Calculation of Heat Transfer Coefficient h</h1>
        </div>

        <div className={modalStyles.modal__content}>
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
              <div className={modalStyles.modal__field}>
                <label className={modalStyles.modal__field_label}>emissivity coefficient (see help)</label>
                <span className={modalStyles.helpText}>surface emissivity (0…1)</span>
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

          <div className={modalStyles.modal__controls}>
            <button 
              onClick={onCalculate}
              className={`${modalStyles.modal__button} ${modalStyles['modal__button_primary']}`}
            >
              Continue
            </button>
            <button 
              onClick={onClose}
              className={`${modalStyles.modal__button} ${modalStyles['modal__button_secondary']}`}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalculateHModal;


