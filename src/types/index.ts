// Interface for air properties at different temperatures
export interface AirProperties {
    kinematicViscosity: number; // Kinematic viscosity, m²/s
    thermalConductivity: number; // Thermal conductivity, W/(m·K)
    prandtlNumber: number; // Prandtl number
    thermalExpansion: number; // Thermal expansion coefficient, 1/K
}

// Interface for heat loss calculation parameters (SOLID - Interface Segregation)
export interface CalculationParams {
    ambientTemp: number; // Ambient temperature, °C
    mediumTemp: number; // Medium temperature in pipe, °C
    tubeDiameter: number; // Pipe diameter, mm
    insulationThickness: number; // Insulation thickness, mm
    pipeWallThickness?: number; // Pipe wall thickness, mm
    pipeLength: number; // Pipe length, m
    material: string; // Insulation material
    h: number; // Heat transfer coefficient, W/m²K
    costPerKWh: number; // Energy cost, ₽/kWh
    // Optional: thickness selection by target heat losses
    recommendByHeatLoss?: boolean; // Enable thickness selection
    targetHeatLossWPerM?: number; // Target heat losses, W/m
}

// Interface for heat loss calculation results
export interface CalculationResults {
    meanLambda: number; // Mean thermal conductivity, W/m·K
    thermalTransmittance: number; // Insulation thermal transmittance, W/m²K
    heatLoss: number; // Heat losses, W
    decrease: number; // Heat loss reduction, %
    costPerHour: number; // Cost per hour, ₽/h
    rokaflexDimension: number; // ROKAFLEX dimension, mm
    // Optional: recommended thickness when selecting
    recommendedThicknessMm?: number; // mm
}

// Interface for condensation calculation parameters
export interface CondensationParams {
    ambientTemp: number; // Ambient temperature, °C
    mediumTemp: number; // Medium temperature in pipe, °C
    tubeDiameter: number; // Pipe diameter, mm
    material: string; // Insulation material
    h: number; // Heat transfer coefficient, W/m²K
    relativeHumidity: number; // Relative humidity, %
}

// Interface for condensation calculation results
export interface CondensationResults {
    dewpointTemperature: number; // Dew point, °C
    minimumThickness: number; // Minimum insulation thickness, mm
    nominalThickness: string; // Recommended pipe from stock
}

// Interface for modal window parameters
export interface ModalParams {
    calculationType?: 'inside' | 'outside'; // Calculation type
    orientation: 'horizontal' | 'vertical'; // Pipe orientation
    emissivity: number; // Emissivity coefficient (0-1)
}

// Interface for modal window parameters for h calculation in condensation
export interface CondensationModalParams {
    calculationType: 'inside' | 'outside'; // Calculation type
    orientation: 'horizontal' | 'vertical'; // Pipe orientation
    emissivity: number; // Emissivity coefficient (0-1)
}