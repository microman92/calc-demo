import React from 'react';
import modalStyles from '../../Modal.module.scss';

type HelpModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className={modalStyles.modal}>
      <div className={modalStyles.modal__container}>
        <div className={modalStyles.modal__header}>
          <h1 className={modalStyles.modal__header_title}>Help</h1>
        </div>

        <div className={modalStyles.modal__content}>
          <div className={modalStyles.modal__section}>
            <p style={{ marginBottom: '16px', lineHeight: '1.6' }}>
              The calculator calculates the minimum insulation thickness to prevent condensation on the surface.
            </p>
            <p style={{ marginBottom: '16px', lineHeight: '1.6' }}>
              Enter the ambient parameters, medium temperature, and relative humidity of the air.
            </p>
            <p style={{ marginBottom: '16px', lineHeight: '1.6' }}>
              The heat transfer coefficient h is calculated automatically taking into account convective and radiative heat transfer. All calculations are performed according to ISO 12241 standard for thermal insulation.
            </p>
            <p style={{ lineHeight: '1.6' }}>
              The result will show the dew point and the recommended insulation thickness from stock.
            </p>
            <div style={{ marginTop: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Field Explanations</h3>
              <ul style={{ paddingLeft: '18px', lineHeight: 1.6, margin: 0 }}>
                <li><strong>Ambient temperature</strong> — air outside the insulation, °C.</li>
                <li><strong>Medium temperature</strong> — heat carrier temperature inside the pipe (for pipes) or surface/medium temperature (for sheets), °C.</li>
                <li><strong>Pipe diameter</strong> — outer diameter, mm. The list shows equivalents: Cu — copper, St — steel. (For sheets, this parameter is not used.)</li>
                <li><strong>Thermal insulation material</strong> — sets thermal conductivity λ(T) for calculation.</li>
                <li><strong>Heat transfer coefficient h</strong> — takes into account convection and radiation from the surface; can be calculated using the "calculate h" button. Calculations are performed according to ISO 12241 standard.</li>
                <li><strong>Relative humidity (30%-95%)</strong> — used to calculate the dew point using the Magnus formula, %.</li>
                <li><strong>Calculation Type</strong> — select "inside" to calculate heat released outward, or "outside" to calculate heat released inward.</li>
                <li><strong>Orientation</strong> — pipe/sheet orientation: "vertical" for vertical orientation, "horizontal" for horizontal orientation. Affects convective heat transfer.</li>
                <li><strong>Emissivity coefficient</strong> — surface emissivity (0…1), typically 0.93 for most insulation materials. Affects radiative heat transfer.</li>
                <li><strong>Sheet height</strong> — (for sheets only) characteristic dimension for heat transfer calculation, m.</li>
                <li><strong>Type of cladding</strong> — (for sheets only) optional cladding type that affects surface properties.</li>
              </ul>
              <p style={{ marginTop: '12px', lineHeight: 1.6 }}>
                <strong>Results:</strong> dew point (°C) — condensation start temperature; minimum insulation thickness (mm) — calculated value to prevent condensation;
                and also <strong>recommended thickness</strong> — recommended insulation thickness from stock (with 20% margin for pipes).
              </p>
              <p style={{ marginTop: '8px', lineHeight: 1.6 }}>
                <strong>Units:</strong> mm — millimeters, °C — degrees Celsius, W/m²K — watts per m²·K, % — percent.
              </p>
            </div>
          </div>

          <div className={modalStyles.modal__controls}>
            <button 
              onClick={onClose}
              className={`${modalStyles.modal__button} ${modalStyles['modal__button_primary']}`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;


