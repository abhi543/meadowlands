/**
 * Dynamic Soil Atmospheric Gas Simulation Engine (CO2, O2, Nitrogen)
 * 
 * Implements real-time per-plot gas dynamics coupled with:
 * - Active Estate Weather (Sunny/Heatwave, Gale/Storm, Heavy Rain, Drought)
 * - Soil Hydrological Saturation (Flooding, Optimal Moisture, Parched Ground)
 * - Crop Phenology & Lifecycle (Vegetative Canopy, Heavy Feeders, Restorative Legumes, Root Aeration)
 * - Organic Remediation (Compost/Manure, Tool Tilling/Flushing)
 */

import { type CropId } from '@/game/data';
import { type WeatherProfileId } from '@/game/weatherEngine';

export interface GasModifierEntry {
  label: string;
  value: number; // Percentage modifier (e.g. +15, -25, +40)
}

export interface PlotGasState {
  co2: number;       // 0–100%
  o2: number;        // 0–100%
  nitrogen: number;  // 0–100%

  // Live arrow indicators ('▲', '▲▲', '▼', '▼▼', '●')
  co2Arrow: string;
  o2Arrow: string;
  nitrogenArrow: string;

  // Breakdown descriptions for hover inspection
  co2BreakdownText: string;
  o2BreakdownText: string;
  nitrogenBreakdownText: string;

  // Modifiers breakdown list
  co2Modifiers: GasModifierEntry[];
  o2Modifiers: GasModifierEntry[];
  nitrogenModifiers: GasModifierEntry[];

  // Net gameplay outputs
  growthSpeedMultiplier: number; // CO2 speed boost (above 60%: +1% speed per 2% above 60%)
  isAnoxiaSuffocated: boolean;   // O2 < 20%: Crop timer completely pauses
  isParchedDoubleDrain: boolean; // O2 > 85%: Crop water consumption doubles
  nitrogenYieldMultiplier: 1 | 2 | 3; // 70-100%: 3x yield, 35-69%: 2x yield, 0-34%: 1x yield

  // Penalty zone flags for yellow alert flash
  isPenaltyCo2: boolean;      // CO2 < 20%
  isPenaltyO2: boolean;       // O2 < 20% or O2 > 85%
  isPenaltyNitrogen: boolean; // Nitrogen < 35%
  hasAnyPenalty: boolean;     // Yellow alert flash trigger
}

export interface GasSimulationContext {
  activeWeatherId: WeatherProfileId;
  isRainstormActive: boolean;
  hasAnimalsOrCompost: boolean; // Farm animals deployed in pastures or compost in barn
  deltaSeconds: number;
}

export interface PlotGasInput {
  crop: CropId | null;
  ready: boolean;
  moistureLevel?: number; // 0-100%
  cropProgress?: number;  // 0.0 - 1.0
  currentGases?: Partial<PlotGasState>;
}

// Default baseline gas state for new / uninitialized plots
export function createDefaultPlotGases(): PlotGasState {
  return {
    co2: 65,
    o2: 60,
    nitrogen: 85,
    co2Arrow: '▲',
    o2Arrow: '●',
    nitrogenArrow: '●',
    co2BreakdownText: '+40% Pasture',
    o2BreakdownText: 'Optimal (45%–75%)',
    nitrogenBreakdownText: 'Full 3x Harvest Yield',
    co2Modifiers: [{ label: 'Base Ambient', value: 25 }, { label: 'Nearby Pasture/Compost', value: 40 }],
    o2Modifiers: [{ label: 'Optimal Aeration', value: 60 }],
    nitrogenModifiers: [{ label: 'Fertile Topsoil', value: 85 }],
    growthSpeedMultiplier: 1.025,
    isAnoxiaSuffocated: false,
    isParchedDoubleDrain: false,
    nitrogenYieldMultiplier: 3,
    isPenaltyCo2: false,
    isPenaltyO2: false,
    isPenaltyNitrogen: false,
    hasAnyPenalty: false,
  };
}

/**
 * Evaluates real-time CO2 (0–100%) for a plot
 * - Base Ambient Value: 25%
 * - Nearby Animal Pen / Compost: +40%
 * - Sunny / Heatwave Weather: +15%
 * - High Gale / Storm Weather: -25%
 * - Vegetative Canopy (Mature / Growing Crop): +10%
 * Net output: Above 60%: +1% crop growth speed per 2% above 60%. Below 20%: Standard speed.
 */
export function calculatePlotCo2(
  input: PlotGasInput,
  ctx: GasSimulationContext
): {
  co2: number;
  arrow: string;
  breakdownText: string;
  modifiers: GasModifierEntry[];
  speedMultiplier: number;
  isPenalty: boolean;
} {
  const modifiers: GasModifierEntry[] = [{ label: 'Base Ambient', value: 25 }];
  let total = 25;

  if (ctx.hasAnimalsOrCompost) {
    modifiers.push({ label: 'Nearby Pasture/Compost', value: 40 });
    total += 40;
  }

  // Sunny / Heatwave Weather: +15%
  const isSunnyHeatwave = ['sunny', 'heatwave', 'drought', 'plasma_firestorm'].includes(ctx.activeWeatherId);
  if (isSunnyHeatwave) {
    const weatherName = ctx.activeWeatherId === 'heatwave' ? 'Heatwave' : (ctx.activeWeatherId === 'drought' ? 'Drought' : 'Sunny');
    modifiers.push({ label: `+15% ${weatherName}`, value: 15 });
    total += 15;
  }

  // High Gale / Storm Weather: -30%
  const isGaleStorm = ['gale', 'thunderstorm', 'cyclone', 'hyper_cyclone', 'hailstorm', 'haboob_sandstorm'].includes(ctx.activeWeatherId);
  if (isGaleStorm) {
    const stormName = ctx.activeWeatherId === 'gale' ? 'High Gale' : 'Storm';
    modifiers.push({ label: `-30% ${stormName}`, value: -30 });
    total -= 30;
  }

  // Vegetative Canopy (Plot has mature/advanced crop): +10%
  const hasCanopy = Boolean(input.crop && (input.ready || (input.cropProgress !== undefined && input.cropProgress >= 0.5)));
  if (hasCanopy) {
    modifiers.push({ label: '+10% Canopy', value: 10 });
    total += 10;
  }

  const finalCo2 = Math.max(0, Math.min(100, Math.round(total)));
  const isPenalty = finalCo2 < 20;

  // Arrow calculation
  let arrow = '●';
  if (total >= 70) {
    arrow = '▲▲';
  } else if (total > 35) {
    arrow = '▲';
  } else if (total < 25) {
    arrow = '▼';
  }

  // Speed calculation: Above 60%: "Boosted Velocity" (+1% speed per 2% above 60%, capped at +40% at 100%)
  // Below 20%: Thin air penalty (+20% longer duration, 0.833x speed)
  let speedMultiplier = 1;
  if (finalCo2 > 60) {
    const boostPct = Math.min(40, (finalCo2 - 60) / 2);
    speedMultiplier = 1 + (boostPct / 100);
  } else if (finalCo2 < 20) {
    speedMultiplier = 1 / 1.2; // 0.833x speed (+20% duration)
  }

  // Breakdown text
  let breakdownText = '+15% Heatwave';
  if (isSunnyHeatwave) {
    const weatherLabel = ctx.activeWeatherId === 'heatwave' ? 'Heatwave' : (ctx.activeWeatherId === 'drought' ? 'Drought' : 'Sunny');
    breakdownText = `+15% ${weatherLabel}`;
  } else if (isGaleStorm) {
    const stormLabel = ctx.activeWeatherId === 'gale' ? 'High Gale' : 'Storm';
    breakdownText = `-25% ${stormLabel}`;
  } else if (ctx.hasAnimalsOrCompost) {
    breakdownText = '+40% Pen/Compost';
  } else if (hasCanopy) {
    breakdownText = '+10% Canopy';
  } else {
    breakdownText = 'Ambient 25%';
  }

  return {
    co2: finalCo2,
    arrow,
    breakdownText,
    modifiers,
    speedMultiplier,
    isPenalty,
  };
}

/**
 * Evaluates real-time Oxygen (0–100%) for a plot
 * - Target Optimal Range: 45% – 75%
 * - Over-irrigation / Heavy Rain: -10% every 10 seconds (-1.0%/sec)
 * - Dry Weather / Drought: +15% per cycle (+1.5%/sec)
 * - Below 20%: "Root Anoxia / Suffocation" — Crop timer completely pauses.
 * - Above 85%: "Parched Ground" — Crop water consumption doubles.
 */
export function updatePlotOxygen(
  input: PlotGasInput,
  ctx: GasSimulationContext,
  currentO2: number
): {
  o2: number;
  arrow: string;
  breakdownText: string;
  modifiers: GasModifierEntry[];
  isAnoxia: boolean;
  isParched: boolean;
  isPenalty: boolean;
} {
  const moisture = input.moistureLevel !== undefined ? input.moistureLevel : 60;
  const isHeavyRain = ['rain', 'monsoon', 'supercell_deluge', 'alchemical_monsoon'].includes(ctx.activeWeatherId) || ctx.isRainstormActive;
  const isFlooded = moisture >= 80 || (isHeavyRain && moisture >= 65);
  const isDrought = ['drought', 'heatwave', 'haboob_sandstorm'].includes(ctx.activeWeatherId) || moisture <= 25;

  let newO2 = currentO2;
  const modifiers: GasModifierEntry[] = [];

  if (isFlooded) {
    // Over-irrigation / Heavy Rain: -10% every 10 seconds (-1.0% / s)
    const drain = 1.0 * ctx.deltaSeconds;
    newO2 = Math.max(5, newO2 - drain);
    modifiers.push({ label: '-10%/10s Flooded Soil', value: -10 });
  } else if (isDrought) {
    // Dry Weather / Drought: +15% per cycle (+1.5% / s)
    const gain = 1.5 * ctx.deltaSeconds;
    newO2 = Math.min(95, newO2 + gain);
    modifiers.push({ label: '+15% Drought Aeration', value: 15 });
  } else {
    // Natural stabilization toward optimal 60%
    if (newO2 < 55) {
      newO2 = Math.min(60, newO2 + (0.5 * ctx.deltaSeconds));
    } else if (newO2 > 65) {
      newO2 = Math.max(60, newO2 - (0.5 * ctx.deltaSeconds));
    }
    modifiers.push({ label: 'Optimal Aeration Range', value: Math.round(newO2) });
  }

  const roundedO2 = Math.max(0, Math.min(100, Math.round(newO2 * 10) / 10));
  const isAnoxia = roundedO2 < 20;
  const isParched = roundedO2 > 85;
  const isPenalty = isAnoxia || isParched;

  let arrow = '●';
  let breakdownText = 'Optimal (45%–75%)';
  if (isFlooded) {
    arrow = roundedO2 <= 35 ? '▼▼' : '▼';
    breakdownText = roundedO2 <= 30 ? '-40% Flooded' : '-10%/10s Flooded';
  } else if (isDrought) {
    arrow = roundedO2 >= 75 ? '▲▲' : '▲';
    breakdownText = '+15% Drought Aeration';
  } else if (isAnoxia) {
    arrow = '▼▼';
    breakdownText = '-40% Flooded (Suffocation)';
  } else if (isParched) {
    arrow = '▲▲';
    breakdownText = '+15% Parched Ground';
  }

  return {
    o2: roundedO2,
    arrow,
    breakdownText,
    modifiers,
    isAnoxia,
    isParched,
    isPenalty,
  };
}

/**
 * Evaluates real-time Nitrogen (0–100%) for a plot
 * - Target Optimal Range: 70% – 100%
 * - Uncovered / Fallow Soil in Heavy Rain: Leaches -5% every 30 seconds
 * - 70% – 100%: Full 3x Harvest Yield
 * - 35% – 69%: 2x Harvest Yield
 * - 0% – 34%: 1x Penalty Harvest Yield
 */
export function updatePlotNitrogen(
  input: PlotGasInput,
  ctx: GasSimulationContext,
  currentN: number
): {
  nitrogen: number;
  arrow: string;
  breakdownText: string;
  modifiers: GasModifierEntry[];
  yieldMultiplier: 1 | 2 | 3;
  isPenalty: boolean;
} {
  const isHeavyRain = ['rain', 'monsoon', 'supercell_deluge', 'alchemical_monsoon'].includes(ctx.activeWeatherId) || ctx.isRainstormActive;
  const isFallowUncovered = input.crop === null;

  let newN = currentN;
  const modifiers: GasModifierEntry[] = [];

  // Uncovered / Fallow Soil in Heavy Rain: Leaches -5% every 30 seconds
  if (isFallowUncovered && isHeavyRain) {
    const leachRate = (5 / 30) * ctx.deltaSeconds;
    newN = Math.max(10, newN - leachRate);
    modifiers.push({ label: '-5%/30s Rain Leaching', value: -5 });
  }

  const roundedN = Math.max(0, Math.min(100, Math.round(newN * 10) / 10));
  const isPenalty = roundedN < 35;

  let yieldMultiplier: 1 | 2 | 3 = 1;
  let breakdownText = '-35% Wheat Drain';
  let arrow = '●';

  if (roundedN >= 70) {
    yieldMultiplier = 3;
    breakdownText = '3x Full Yield';
    arrow = '▲';
  } else if (roundedN >= 35) {
    yieldMultiplier = 2;
    breakdownText = '-35% Wheat Drain';
    arrow = '▼';
  } else {
    yieldMultiplier = 1;
    breakdownText = '-35% Low N (1x Yield)';
    arrow = '▼';
  }

  if (isFallowUncovered && isHeavyRain) {
    arrow = '▼▼';
    breakdownText = '-5%/30s Rain Leach';
  }

  return {
    nitrogen: roundedN,
    arrow,
    breakdownText,
    modifiers,
    yieldMultiplier,
    isPenalty,
  };
}

/**
 * Main per-plot simulation cycle update for CO2, O2, and Nitrogen
 */
export function stepPlotGasSimulation(
  input: PlotGasInput,
  ctx: GasSimulationContext
): PlotGasState {
  const prevGases = input.currentGases || {};
  const currentO2 = prevGases.o2 !== undefined ? prevGases.o2 : 60;
  const currentN = prevGases.nitrogen !== undefined ? prevGases.nitrogen : 85;

  const co2Res = calculatePlotCo2(input, ctx);
  const o2Res = updatePlotOxygen(input, ctx, currentO2);
  const nRes = updatePlotNitrogen(input, ctx, currentN);

  const hasAnyPenalty = co2Res.isPenalty || o2Res.isPenalty || nRes.isPenalty;

  return {
    co2: co2Res.co2,
    o2: o2Res.o2,
    nitrogen: nRes.nitrogen,
    co2Arrow: co2Res.arrow,
    o2Arrow: o2Res.arrow,
    nitrogenArrow: nRes.arrow,
    co2BreakdownText: co2Res.breakdownText,
    o2BreakdownText: o2Res.breakdownText,
    nitrogenBreakdownText: nRes.breakdownText,
    co2Modifiers: co2Res.modifiers,
    o2Modifiers: o2Res.modifiers,
    nitrogenModifiers: nRes.modifiers,
    growthSpeedMultiplier: co2Res.speedMultiplier,
    isAnoxiaSuffocated: o2Res.isAnoxia,
    isParchedDoubleDrain: o2Res.isParched,
    nitrogenYieldMultiplier: nRes.yieldMultiplier,
    isPenaltyCo2: co2Res.isPenalty,
    isPenaltyO2: o2Res.isPenalty,
    isPenaltyNitrogen: nRes.isPenalty,
    hasAnyPenalty,
  };
}

/**
 * Handles Crop Harvest Gas Impacts:
 * - Heavy Feeder Growing (Wheat/Cotton): Depletes Nitrogen by -35% at harvest.
 * - Restorative Legume Growing (Peas/Soybeans): Increases Nitrogen by +50% at harvest (capped at 100%).
 * - Harvesting Root Crops (Carrots): +20% aeration bonus to Oxygen (capped at 100%).
 */
export function applyHarvestGasModifiers(
  crop: CropId,
  currentGases: PlotGasState | undefined
): { newO2: number; newNitrogen: number; notificationMsg?: string } {
  const gases = currentGases || createDefaultPlotGases();
  let newO2 = gases.o2;
  let newN = gases.nitrogen;
  const notes: string[] = [];

  // Heavy Feeders (Wheat/Corn/Cotton)
  if (crop === 'wheat' || crop === 'corn' || crop === 'cotton') {
    newN = Math.max(5, Math.round(newN - 35));
    notes.push(`🌾 Heavy Feeder (${crop}): Depleted -35% Nitrogen (Now ${newN}%)`);
  }

  // Restorative Legumes (Peas/Soybeans)
  if (crop === 'peas' || crop === 'soybean') {
    newN = Math.min(100, Math.round(newN + 50));
    notes.push(`🫛 Restorative Legume (${crop}): Fixed +50% Nitrogen (Now ${newN}%)`);
  }

  // Root Crops (Carrot)
  if (crop === 'carrot') {
    newO2 = Math.min(100, Math.round(newO2 + 20));
    notes.push(`🥕 Root Crop Aeration: +20% Oxygen (Now ${newO2}%)`);
  }

  return {
    newO2,
    newNitrogen: newN,
    notificationMsg: notes.join(' · '),
  };
}

/**
 * Tool / Remediation Gas Impact:
 * - Tilling / Flush Bed action: Instantly restores Oxygen to 60%.
 */
export function applyTillingOxygenReset(currentO2: number): number {
  return 60;
}

/**
 * Organic Manure / Compost Applied:
 * - Instantly sets Nitrogen to 100%.
 */
export function applyCompostNitrogenReset(currentN: number): number {
  return 100;
}
