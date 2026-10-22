/**
 * Soil Energy & Visual Color Hints Engine (Module 1: Agronomy)
 * 
 * Implements intuitive, color-based "Soil Battery" dynamics:
 * - 🟢 Green Light: Leaf / Stem energy (Wheat, Corn)
 * - 🟡 Yellow Light: Root energy (Carrot)
 * - 🔴 Red Light: Fruit / Flower energy (Tomato, Strawberry, Cotton, Pumpkin)
 * - 🫛 Restorative Legumes: Recharges 🟢 Green Light (Peas, Soybean)
 * 
 * ZERO academic jargon: NO "Nitrogen", "Phosphorus", "Potassium", "NPK", or "Pathogens".
 * Only visual terms: "Full Energy", "Tired Soil", "Recharge", and matching color symbols.
 */

import { type CropId } from './data';

export type SoilBatteryColor = 'green' | 'yellow' | 'red';

export interface PlotSoilBattery {
  green: boolean;   // 🟢 Leaf / Stem energy
  yellow: boolean;  // 🟡 Root energy
  red: boolean;     // 🔴 Fruit / Flower energy
}

export const DEFAULT_SOIL_BATTERY: PlotSoilBattery = {
  green: true,
  yellow: true,
  red: true,
};

export interface CropNutrientProfile {
  fuelType: SoilBatteryColor | 'restorative';
  badgeColor: string;
  badgeDot: string;
  fuelLabel: string;
  isRestorative: boolean;
  restoresColor?: SoilBatteryColor;
}

export const CROP_NUTRIENT_PROFILES: Record<CropId, CropNutrientProfile> = {
  wheat: {
    fuelType: 'green',
    badgeColor: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-950/80 border-emerald-400',
    badgeDot: '🟢',
    fuelLabel: 'Leaf & Stem Energy',
    isRestorative: false,
  },
  corn: {
    fuelType: 'green',
    badgeColor: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-950/80 border-emerald-400',
    badgeDot: '🟢',
    fuelLabel: 'Leaf & Stem Energy',
    isRestorative: false,
  },
  carrot: {
    fuelType: 'yellow',
    badgeColor: 'text-amber-500 bg-amber-100 dark:bg-amber-950/80 border-amber-400',
    badgeDot: '🟡',
    fuelLabel: 'Root Energy',
    isRestorative: false,
  },
  strawberry: {
    fuelType: 'red',
    badgeColor: 'text-rose-500 bg-rose-100 dark:bg-rose-950/80 border-rose-400',
    badgeDot: '🔴',
    fuelLabel: 'Fruit & Flower Energy',
    isRestorative: false,
  },
  cotton: {
    fuelType: 'red',
    badgeColor: 'text-rose-500 bg-rose-100 dark:bg-rose-950/80 border-rose-400',
    badgeDot: '🔴',
    fuelLabel: 'Flower & Fiber Energy',
    isRestorative: false,
  },
  pumpkin: {
    fuelType: 'red',
    badgeColor: 'text-rose-500 bg-rose-100 dark:bg-rose-950/80 border-rose-400',
    badgeDot: '🔴',
    fuelLabel: 'Fruit & Vine Energy',
    isRestorative: false,
  },
  soybean: {
    fuelType: 'restorative',
    badgeColor: 'text-teal-600 bg-teal-100 dark:bg-teal-950/80 border-teal-400',
    badgeDot: '🫛',
    fuelLabel: 'Restorative Legume (Recharges 🟢)',
    isRestorative: true,
    restoresColor: 'green',
  },
  peas: {
    fuelType: 'restorative',
    badgeColor: 'text-teal-600 bg-teal-100 dark:bg-teal-950/80 border-teal-400',
    badgeDot: '🫛',
    fuelLabel: 'Restorative Legume (Recharges 🟢)',
    isRestorative: true,
    restoresColor: 'green',
  },
  wild_berries: {
    fuelType: 'red',
    badgeColor: 'text-purple-500 bg-purple-100 dark:bg-purple-950/80 border-purple-400',
    badgeDot: '🔴',
    fuelLabel: 'Fruit & Berry Energy',
    isRestorative: false,
  },
};

/**
 * Checks if the plot's soil battery has sufficient energy for the given crop.
 */
export function isBatteryChargedForCrop(battery: PlotSoilBattery | undefined, cropId: CropId): boolean {
  const current = battery || DEFAULT_SOIL_BATTERY;
  const profile = CROP_NUTRIENT_PROFILES[cropId];
  if (!profile || profile.isRestorative) {
    return true; // Restorative crops don't require fuel; they recharge the soil!
  }

  if (profile.fuelType === 'green') return current.green;
  if (profile.fuelType === 'yellow') return current.yellow;
  if (profile.fuelType === 'red') return current.red;
  return true;
}

/**
 * Returns whether all 3 energy lights on a plot are full.
 */
export function isSoilBatteryFull(battery: PlotSoilBattery | undefined): boolean {
  const b = battery || DEFAULT_SOIL_BATTERY;
  return Boolean(b.green && b.yellow && b.red);
}

/**
 * Returns whether any light is depleted on the plot.
 */
export function isSoilTired(battery: PlotSoilBattery | undefined): boolean {
  return !isSoilBatteryFull(battery);
}

/**
 * Consumes the matching fuel color upon crop harvest, or recharges 🟢 if restorative.
 */
export function consumeOrRestoreSoilBattery(
  battery: PlotSoilBattery | undefined,
  cropId: CropId
): { newBattery: PlotSoilBattery; action: 'consumed' | 'restored' | 'none'; colorAffected?: SoilBatteryColor } {
  const current = { ...(battery || DEFAULT_SOIL_BATTERY) };
  const profile = CROP_NUTRIENT_PROFILES[cropId];

  if (!profile) {
    return { newBattery: current, action: 'none' };
  }

  if (profile.isRestorative) {
    current.green = true; // Recharges 🟢 Green Light to full upon harvest!
    return { newBattery: current, action: 'restored', colorAffected: 'green' };
  }

  if (profile.fuelType === 'green') {
    current.green = false;
    return { newBattery: current, action: 'consumed', colorAffected: 'green' };
  }
  if (profile.fuelType === 'yellow') {
    current.yellow = false;
    return { newBattery: current, action: 'consumed', colorAffected: 'yellow' };
  }
  if (profile.fuelType === 'red') {
    current.red = false;
    return { newBattery: current, action: 'consumed', colorAffected: 'red' };
  }

  return { newBattery: current, action: 'none' };
}

/**
 * Instantly recharges the plot's soil battery to solid 100% full using organic compost/manure.
 */
export function rechargeSoilBatteryFull(): PlotSoilBattery {
  return { green: true, yellow: true, red: true };
}
