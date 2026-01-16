import { create } from 'zustand';

type Orientation = 'horizontal' | 'vertical';

interface SharedCalculatorState {
  ambientTemp: number;
  mediumTemp: number;
  tubeDiameter: number;
  material: string;
  h: number;
  orientation: Orientation;
  emissivity: number;
  setAmbientTemp: (v: number) => void;
  setMediumTemp: (v: number) => void;
  setTubeDiameter: (v: number) => void;
  setMaterial: (v: string) => void;
  setH: (v: number) => void;
  setOrientation: (v: Orientation) => void;
  setEmissivity: (v: number) => void;
  setMany: (payload: Partial<Omit<SharedCalculatorState,
    | 'setAmbientTemp'
    | 'setMediumTemp'
    | 'setTubeDiameter'
    | 'setMaterial'
    | 'setH'
    | 'setOrientation'
    | 'setEmissivity'
    | 'setMany'>>) => void;
}

export const useCalculatorStore = create<SharedCalculatorState>((set: (partial: Partial<SharedCalculatorState> | ((state: SharedCalculatorState) => Partial<SharedCalculatorState>)) => void) => ({
  ambientTemp: 25.0,
  mediumTemp: -5.0,
  tubeDiameter: 25,
  material: 'ROKAFLEX ST',
  h: 9.0,
  orientation: 'horizontal',
  emissivity: 0.93,
  setAmbientTemp: (v: number) => set({ ambientTemp: v }),
  setMediumTemp: (v: number) => set({ mediumTemp: v }),
  setTubeDiameter: (v: number) => set({ tubeDiameter: v }),
  setMaterial: (v: string) => set({ material: v }),
  setH: (v: number) => set({ h: v }),
  setOrientation: (v: Orientation) => set({ orientation: v }),
  setEmissivity: (v: number) => set({ emissivity: v }),
  setMany: (payload: Partial<Omit<SharedCalculatorState,
    | 'setAmbientTemp'
    | 'setMediumTemp'
    | 'setTubeDiameter'
    | 'setMaterial'
    | 'setH'
    | 'setOrientation'
    | 'setEmissivity'
    | 'setMany'>>) => set(payload),
}));


