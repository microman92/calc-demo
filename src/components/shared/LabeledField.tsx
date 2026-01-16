import React from 'react';

type StylesShape = {
  heatLossCalculator__field: string;
  heatLossCalculator__field_label: string;
  heatLossCalculator__field_input: string;
  heatLossCalculator__field_unit: string;
  helpTextTall?: string;
};

type LabeledFieldProps = {
  label: string;
  helpText?: string;
  unit?: string;
  value: string | number;
  onChange?: (value: number) => void;
  type?: React.HTMLInputTypeAttribute;
  styles: StylesShape;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
};

const LabeledField: React.FC<LabeledFieldProps> = ({
  label,
  helpText,
  unit,
  value,
  onChange,
  type = 'number',
  styles,
  inputProps,
}) => {
  return (
    <div className={styles.heatLossCalculator__field}>
      <label className={styles.heatLossCalculator__field_label}>{label}</label>
      {helpText ? (
        <span className={styles.helpTextTall}>{helpText}</span>
      ) : null}
      <input
        type={type}
        value={value}
        onChange={onChange ? (e: React.ChangeEvent<HTMLInputElement>) => onChange(+e.target.value) : undefined}
        className={styles.heatLossCalculator__field_input}
        {...inputProps}
      />
      {unit ? <span className={styles.heatLossCalculator__field_unit}>{unit}</span> : null}
    </div>
  );
};

export default LabeledField;


