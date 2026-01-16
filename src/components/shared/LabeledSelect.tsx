import React from 'react';

type StylesShape = {
  heatLossCalculator__field: string;
  heatLossCalculator__field_label: string;
  heatLossCalculator__field_input: string;
  heatLossCalculator__field_unit?: string;
  helpTextTall?: string;
};

type Option = { value: string | number; label: string };

type LabeledSelectProps = {
  label: string;
  helpText?: string;
  unit?: string;
  value: string | number;
  onChange: (value: string | number) => void;
  options: Option[];
  styles: StylesShape;
  selectProps?: React.SelectHTMLAttributes<HTMLSelectElement>;
};

const LabeledSelect: React.FC<LabeledSelectProps> = ({
  label,
  helpText,
  unit,
  value,
  onChange,
  options,
  styles,
  selectProps,
}) => {
  return (
    <div className={styles.heatLossCalculator__field}>
      <label className={styles.heatLossCalculator__field_label}>{label}</label>
      {helpText ? (
        <span className={styles.helpTextTall}>{helpText}</span>
      ) : null}
      <select
        value={value}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
        className={styles.heatLossCalculator__field_input}
        {...selectProps}
      >
        {options.map((opt) => (
          <option key={`${opt.value}`} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {unit ? <span className={styles.heatLossCalculator__field_unit!}>{unit}</span> : null}
    </div>
  );
};

export default LabeledSelect;


