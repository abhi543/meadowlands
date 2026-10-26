/**
 * Project Meadowlands — Gas Bottling & Export Refinery Engine
 *
 * Implements the Heavy Hydraulic Gas Compressor and Direct-Export Commodity Logistics:
 * 1. Pressurized CO₂ Cylinder: 40L Slurry + 10 Chaff => 45 Coins base
 * 2. Refined Oxygen Canister: 30L Water + 5 Green Biomass => 65 Coins base
 * 3. Liquid Nitrogen Dewar: 50L Concentrated Slurry + 1 Thermal Fuel => 110 Coins base
 *
 * Finished canisters are stored in laboratory output racks and loaded into the
 * Estate Shipping Crate / Dock for daily or instant liquidation into Coins.
 */

export type CanisterId = 'co2_cylinder' | 'oxygen_canister' | 'nitrogen_dewar';
export type CanisterTierId = CanisterId;

export interface CanisterRecipeDef {
  id: CanisterId;
  name: string;
  emoji: string;
  description: string;
  slurryRequiredLiters: number;
  chaffRequired: number;
  waterRequiredLiters: number;
  biomassRequired: number; // peas, wheat, soybean, or algae_paste
  fuelRequired: number; // thermal_scutes, thermal_solvent, fired_hardwood, or peat
  baseExportCoins: number;
  processingDurationSec: number; // 60 seconds baseline
  demandSector: string;
}

export const CANISTER_RECIPES: Record<CanisterId, CanisterRecipeDef> = {
  co2_cylinder: {
    id: 'co2_cylinder',
    name: 'Pressurized CO₂ Cylinder',
    emoji: '🫧',
    description: 'Compressed carbon dioxide refined from anaerobic slurry fermentation and dry chaff husks.',
    slurryRequiredLiters: 40,
    chaffRequired: 10,
    waterRequiredLiters: 0,
    biomassRequired: 0,
    fuelRequired: 0,
    baseExportCoins: 45,
    processingDurationSec: 60,
    demandSector: 'Breweries, Soft Drinks & Carbonated Cellars',
  },
  oxygen_canister: {
    id: 'oxygen_canister',
    name: 'Refined Oxygen Canister',
    emoji: '🫁',
    description: 'High-purity breathable medical oxygen refined from freshwater aeration and green biomass.',
    slurryRequiredLiters: 0,
    chaffRequired: 0,
    waterRequiredLiters: 30,
    biomassRequired: 5,
    fuelRequired: 0,
    baseExportCoins: 65,
    processingDurationSec: 60,
    demandSector: 'Sanitariums, High-Altitude Clinics & Diving Guilds',
  },
  nitrogen_dewar: {
    id: 'nitrogen_dewar',
    name: 'Liquid Nitrogen Dewar',
    emoji: '❄️',
    description: 'Cryogenically isolated deep-freeze liquid nitrogen vacuum-jacketed for metallurgical quenching.',
    slurryRequiredLiters: 50,
    chaffRequired: 0,
    waterRequiredLiters: 0,
    biomassRequired: 0,
    fuelRequired: 1,
    baseExportCoins: 110,
    processingDurationSec: 60,
    demandSector: 'Industrial Cryo-Foundries & Perishable Cold Chains',
  },
};

export interface CompressorBatch {
  id: string;
  canisterId: CanisterId;
  name: string;
  emoji: string;
  startedAt: number;
  durationSec: number;
  outputQty: number;
}

export interface GasBottlingRefineryState {
  storedSlurryFeedstock: number; // Liters of raw slurry available in the refinery's bulk intake tank
  maxSlurryCapacity: number;     // e.g. 2000L default
  activeBatch: CompressorBatch | null;
  outputRack: Record<CanisterId, number>; // Canisters ready in laboratory storage
  dailyShippingCrate: Record<CanisterId, number>; // Canisters loaded onto Estate Export Cart
  lastDailyLiquidationTimestamp: number;
  dailyCycleSeconds?: number;
  totalLifetimeExportCoins: number;
  totalCanistersShipped: number;
}

export function createDefaultGasBottlingRefinery(): GasBottlingRefineryState {
  return {
    storedSlurryFeedstock: 120, // Initial feedstock to allow instant experimentation
    maxSlurryCapacity: 2500,
    activeBatch: null,
    outputRack: {
      co2_cylinder: 0,
      oxygen_canister: 0,
      nitrogen_dewar: 0,
    },
    dailyShippingCrate: {
      co2_cylinder: 0,
      oxygen_canister: 0,
      nitrogen_dewar: 0,
    },
    lastDailyLiquidationTimestamp: Date.now(),
    totalLifetimeExportCoins: 0,
    totalCanistersShipped: 0,
  };
}

/**
 * Calculates current coin valuation of all items placed in the daily shipping crate.
 */
export function calculateCrateLiquidationValue(crate: Record<CanisterId, number>): number {
  let sum = 0;
  for (const cid of Object.keys(CANISTER_RECIPES) as CanisterId[]) {
    const count = crate[cid] || 0;
    sum += count * CANISTER_RECIPES[cid].baseExportCoins;
  }
  return sum;
}

/**
 * Calculates total count of canisters currently waiting in shipping crate.
 */
export function getCrateTotalCanisterCount(crate: Record<CanisterId, number>): number {
  return (crate.co2_cylinder || 0) + (crate.oxygen_canister || 0) + (crate.nitrogen_dewar || 0);
}

/**
 * Steps the Heavy Hydraulic Gas Compressor simulation.
 * When the 60-second compression cycle completes, bottles are moved to the output rack.
 */
export function stepGasBottlingSimulation(
  refinery: GasBottlingRefineryState,
  now: number
): {
  updatedRefinery: GasBottlingRefineryState;
  completedBatch: CompressorBatch | null;
} {
  if (!refinery.activeBatch) {
    return { updatedRefinery: refinery, completedBatch: null };
  }

  const batch = refinery.activeBatch;
  const elapsedSec = (now - batch.startedAt) / 1000;

  if (elapsedSec >= batch.durationSec) {
    // Completed!
    const newOutputRack = { ...refinery.outputRack };
    newOutputRack[batch.canisterId] = (newOutputRack[batch.canisterId] || 0) + batch.outputQty;

    return {
      updatedRefinery: {
        ...refinery,
        activeBatch: null,
        outputRack: newOutputRack,
      },
      completedBatch: batch,
    };
  }

  return { updatedRefinery: refinery, completedBatch: null };
}
