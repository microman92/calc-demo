import React from 'react';

interface Props {
  onCalculate: () => void;
  onHelp: () => void;
  onBack: () => void;
  styles: any;
  calculateLabel?: string;
}

const CalculatorControls: React.FC<Props> = ({ onCalculate, onHelp, onBack, styles, calculateLabel = 'Calculate' }) => {
  return (
    <div className={styles.heatLossCalculator__controls}>
      <button 
        onClick={onCalculate} 
        className={`${styles.heatLossCalculator__button} ${styles['heatLossCalculator__button_primary']}`}
      >
        {calculateLabel}
      </button>
      <button 
        onClick={onHelp}
        className={`${styles.heatLossCalculator__button} ${styles['heatLossCalculator__button_secondary']}`}
      >
        Help
      </button>
      <button 
        onClick={onBack}
        className={`${styles.heatLossCalculator__button} ${styles['heatLossCalculator__button_secondary']}`}
      >
        ← Back to Calculators
      </button>
    </div>
  );
};

export default CalculatorControls;



