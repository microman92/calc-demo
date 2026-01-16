import type { AirProperties } from '../types';
import { MATERIALS } from './constants';

export const interpolateLambda = (temp: number, material: string): number => {
  const materialData = MATERIALS[material as keyof typeof MATERIALS] as any;
  if (!materialData) return 0.036;
  const lambdaData = materialData.lambda as Record<string, number>;
  const temps = Object.keys(lambdaData).map(Number).sort((a, b) => a - b);
  let lambda = 0.036;
  for (let i = 0; i < temps.length - 1; i++) {
    if (temp >= temps[i] && temp <= temps[i + 1]) {
      const t0 = temps[i], t1 = temps[i + 1];
      const l0 = lambdaData[String(t0)];
      const l1 = lambdaData[String(t1)];
      lambda = l0 + (l1 - l0) * (temp - t0) / (t1 - t0);
      break;
    }
  }
  return lambda;
};

export const getAirProperties = (tempCelsius: number): AirProperties => {
  const T = tempCelsius + 273.15;
  const kinematicViscosity = (1.34e-5) * Math.pow(T / 273.15, 1.5);
  const thermalConductivity = 0.0242 + 0.0000726 * tempCelsius;
  const prandtlNumber = 0.71;
  const thermalExpansion = 1 / T;
  return { kinematicViscosity, thermalConductivity, prandtlNumber, thermalExpansion };
};

export const calculateGrashofNumber = (
  beta: number,
  deltaT: number,
  characteristicLength: number,
  kinematicViscosity: number
): number => {
  const g = 9.81;
  return (g * beta * Math.abs(deltaT) * Math.pow(characteristicLength, 3)) / Math.pow(kinematicViscosity, 2);
};

export const calculateRayleighNumber = (grashofNumber: number, prandtlNumber: number): number => {
  return grashofNumber * prandtlNumber;
};

export const calculateNusseltHorizontal = (rayleighNumber: number): number => {
  const Ra = rayleighNumber;
  if (Ra < 1e-5) return 0.4;
  const term1 = 0.6;
  const term2 = (0.387 * Math.pow(Ra, 1 / 6)) / Math.pow(1 + Math.pow(0.559 / 0.71, 9 / 16), 8 / 27);
  return Math.pow(term1 + term2, 2);
};

export const calculateNusseltVertical = (rayleighNumber: number): number => {
  const Ra = rayleighNumber;
  if (Ra < 1e4) {
    return 0.59 * Math.pow(Ra, 0.25);
  } else {
    return 0.1 * Math.pow(Ra, 0.333);
  }
};

export const calculateConvectiveHeatTransfer = (
  nusseltNumber: number,
  thermalConductivity: number,
  diameter: number
): number => {
  return (nusseltNumber * thermalConductivity) / diameter;
};

export const calculateRadiativeHeatTransfer = (
  emissivity: number,
  T_surface: number,
  T_ambient: number
): number => {
  const sigma = 5.67e-8; // постоянная Стефана-Больцмана, Вт/(м²·К⁴)
  // Точная формула Стефана-Больцмана: h_rad = ε * σ * (T_s⁴ - T_amb⁴) / (T_s - T_amb)
  // Используем точную формулу вместо линейной аппроксимации для соответствия референсу
  const T_s4 = Math.pow(T_surface, 4);
  const T_amb4 = Math.pow(T_ambient, 4);
  const deltaT = T_surface - T_ambient;
  // Избегаем деления на ноль
  if (Math.abs(deltaT) < 0.01) {
    const T_mean = (T_surface + T_ambient) / 2;
    return 4 * emissivity * sigma * Math.pow(T_mean, 3);
  }
  return (emissivity * sigma * (T_s4 - T_amb4)) / deltaT;
};



