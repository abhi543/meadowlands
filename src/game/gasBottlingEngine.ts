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

export type CanisterId =
  | 'co2_cylinder'
  | 'oxygen_canister'
  | 'nitrogen_dewar'
  | 'ethylene_cylinder'
  | 'ozone_canister'
  | 'sulfur_dioxide_flask'
  | 'phosphine_bomb';
export type CanisterTierId = CanisterId;

export interface CanisterRecipeDef {
  id: CanisterId;
  name: string;
  emoji: string;
  chemicalFormula: string;
  tier: 'primary' | 'advanced';
  description: string;
  slurryRequiredLiters: number;
  chaffRequired: number;
  waterRequiredLiters: number;
  biomassRequired: number; // peas, wheat, soybean, or algae_paste
  fuelRequired: number; // thermal_scutes, thermal_solvent, fired_hardwood, or peat
  cullBiomassRequired?: number;
  dynamoPowerRequired?: number;
  sulfurDustRequired?: number;
  boneMealRequired?: number;
  oxygenCanisterRequired?: number;
  baseExportCoins: number;
  processingDurationSec: number;
  demandSector: string;
}

export const CANISTER_RECIPES: Record<CanisterId, CanisterRecipeDef> = {
  co2_cylinder: {
    id: 'co2_cylinder',
    name: 'Pressurized CO₂ Cylinder',
    emoji: '🫧',
    chemicalFormula: 'CO₂',
    tier: 'primary',
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
    chemicalFormula: 'O₂',
    tier: 'primary',
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
    chemicalFormula: 'N₂',
    tier: 'primary',
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
  ethylene_cylinder: {
    id: 'ethylene_cylinder',
    name: 'Ethylene Cylinder',
    emoji: '🍇',
    chemicalFormula: 'C₂H₄',
    tier: 'advanced',
    description: 'Catalytically cracked plant ripening hormone derived from fermented slurry and cull fruit.',
    slurryRequiredLiters: 30,
    cullBiomassRequired: 15,
    chaffRequired: 0,
    waterRequiredLiters: 0,
    biomassRequired: 0,
    fuelRequired: 0,
    baseExportCoins: 80,
    processingDurationSec: 45,
    demandSector: 'Greenhouse Ripening Chambers & Commercial Orchards',
  },
  ozone_canister: {
    id: 'ozone_canister',
    name: 'Ozone Canister',
    emoji: '⚡',
    chemicalFormula: 'O₃',
    tier: 'advanced',
    description: 'Cold-plasma synthesized oxidizer for post-harvest sterilization and cleanroom hygiene.',
    slurryRequiredLiters: 0,
    chaffRequired: 0,
    waterRequiredLiters: 0,
    biomassRequired: 0,
    fuelRequired: 0,
    oxygenCanisterRequired: 1,
    dynamoPowerRequired: 40,
    baseExportCoins: 125,
    processingDurationSec: 30,
    demandSector: 'Post-Harvest Sterilization & Cleanroom Hygiene',
  },
  sulfur_dioxide_flask: {
    id: 'sulfur_dioxide_flask',
    name: 'Sulfur Dioxide Flask',
    emoji: '🌋',
    chemicalFormula: 'SO₂',
    tier: 'advanced',
    description: 'Fume-scrubbed anti-fungal preservative critical for vineyard preservation and export transit.',
    slurryRequiredLiters: 0,
    chaffRequired: 0,
    waterRequiredLiters: 20,
    biomassRequired: 0,
    fuelRequired: 0,
    sulfurDustRequired: 15,
    baseExportCoins: 160,
    processingDurationSec: 60,
    demandSector: 'Vineyard Preservation & Long-Haul Export Transit',
  },
  phosphine_bomb: {
    id: 'phosphine_bomb',
    name: 'Phosphine Heavy Bomb',
    emoji: '☣️',
    chemicalFormula: 'PH₃',
    tier: 'advanced',
    description: 'Deep-penetrating fumigant synthesis for commercial grain silo and bulk cargo hold sterilization.',
    slurryRequiredLiters: 25,
    chaffRequired: 0,
    waterRequiredLiters: 0,
    biomassRequired: 0,
    fuelRequired: 0,
    boneMealRequired: 10,
    baseExportCoins: 220,
    processingDurationSec: 75,
    demandSector: 'Commercial Grain Silos & Bulk Cargo Hold Sterilization',
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
  maxSlurryCapacity: number;     // e.g. 2500L default
  cullBiomassStock?: number;     // 🍇 Overripe Fruit / Cull Biomass
  dynamoPowerKWh?: number;       // ⚡ Lab Dynamo Power (HV Grid)
  maxDynamoPowerKWh?: number;    // 500 kWh default
  rawSulfurDust?: number;        // 🌋 Raw Sulfur / Brimstone Dust
  boneMealBags?: number;         // 🦴 Bone Meal / Mineral Phosphorus
  activeBatch?: CompressorBatch | null; // Kept for backwards compatibility
  activeBatches?: Record<CanisterId, CompressorBatch | null>; // Parallel compression across all chambers
  automatedGases?: Record<CanisterId, boolean>; // Assigned automated refinery workers per chamber
  isWorkerSlurryActive?: boolean; // Hysteresis state: starts working above 2000L, stops below 500L
  workerStartThresholdLiters?: number; // 2000L default
  workerStopThresholdLiters?: number;  // 500L default
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
    cullBiomassStock: 30,
    dynamoPowerKWh: 120,
    maxDynamoPowerKWh: 500,
    rawSulfurDust: 30,
    boneMealBags: 20,
    activeBatch: null,
    activeBatches: {
      co2_cylinder: null,
      oxygen_canister: null,
      nitrogen_dewar: null,
      ethylene_cylinder: null,
      ozone_canister: null,
      sulfur_dioxide_flask: null,
      phosphine_bomb: null,
    },
    automatedGases: {
      co2_cylinder: true,     // Automated Worker (CO₂ Technician)
      oxygen_canister: false, // Manual Operation (Player Controlled)
      nitrogen_dewar: true,   // Automated Worker (Cryo-Distiller Operator)
      ethylene_cylinder: false,
      ozone_canister: false,
      sulfur_dioxide_flask: false,
      phosphine_bomb: false,
    },
    isWorkerSlurryActive: false,
    workerStartThresholdLiters: 2000,
    workerStopThresholdLiters: 500,
    outputRack: {
      co2_cylinder: 0,
      oxygen_canister: 0,
      nitrogen_dewar: 0,
      ethylene_cylinder: 0,
      ozone_canister: 0,
      sulfur_dioxide_flask: 0,
      phosphine_bomb: 0,
    },
    dailyShippingCrate: {
      co2_cylinder: 0,
      oxygen_canister: 0,
      nitrogen_dewar: 0,
      ethylene_cylinder: 0,
      ozone_canister: 0,
      sulfur_dioxide_flask: 0,
      phosphine_bomb: 0,
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
    sum += count * (CANISTER_RECIPES[cid]?.baseExportCoins || 0);
  }
  return sum;
}

/**
 * Calculates total count of canisters currently waiting in shipping crate.
 */
export function getCrateTotalCanisterCount(crate: Record<CanisterId, number>): number {
  return (
    (crate.co2_cylinder || 0) +
    (crate.oxygen_canister || 0) +
    (crate.nitrogen_dewar || 0) +
    (crate.ethylene_cylinder || 0) +
    (crate.ozone_canister || 0) +
    (crate.sulfur_dioxide_flask || 0) +
    (crate.phosphine_bomb || 0)
  );
}

/**
 * Steps the Heavy Hydraulic Gas Compressor simulation.
 * Multi-chamber parallel simulation: when each compression cycle completes, bottles are moved to the output rack.
 */
export function stepGasBottlingSimulation(
  refinery: GasBottlingRefineryState,
  now: number
): {
  updatedRefinery: GasBottlingRefineryState;
  completedBatch: CompressorBatch | null;
  completedBatches: CompressorBatch[];
} {
  const allCids = Object.keys(CANISTER_RECIPES) as CanisterId[];
  const activeBatches: Record<CanisterId, CompressorBatch | null> = {
    co2_cylinder: refinery.activeBatches?.co2_cylinder || (refinery.activeBatch?.canisterId === 'co2_cylinder' ? refinery.activeBatch : null),
    oxygen_canister: refinery.activeBatches?.oxygen_canister || (refinery.activeBatch?.canisterId === 'oxygen_canister' ? refinery.activeBatch : null),
    nitrogen_dewar: refinery.activeBatches?.nitrogen_dewar || (refinery.activeBatch?.canisterId === 'nitrogen_dewar' ? refinery.activeBatch : null),
    ethylene_cylinder: refinery.activeBatches?.ethylene_cylinder || (refinery.activeBatch?.canisterId === 'ethylene_cylinder' ? refinery.activeBatch : null),
    ozone_canister: refinery.activeBatches?.ozone_canister || (refinery.activeBatch?.canisterId === 'ozone_canister' ? refinery.activeBatch : null),
    sulfur_dioxide_flask: refinery.activeBatches?.sulfur_dioxide_flask || (refinery.activeBatch?.canisterId === 'sulfur_dioxide_flask' ? refinery.activeBatch : null),
    phosphine_bomb: refinery.activeBatches?.phosphine_bomb || (refinery.activeBatch?.canisterId === 'phosphine_bomb' ? refinery.activeBatch : null),
  };

  const hasAnyActive = allCids.some((cid) => Boolean(activeBatches[cid]));
  if (!hasAnyActive) {
    return { updatedRefinery: refinery, completedBatch: null, completedBatches: [] };
  }

  const completedBatches: CompressorBatch[] = [];
  const newOutputRack: Record<CanisterId, number> = {
    co2_cylinder: 0,
    oxygen_canister: 0,
    nitrogen_dewar: 0,
    ethylene_cylinder: 0,
    ozone_canister: 0,
    sulfur_dioxide_flask: 0,
    phosphine_bomb: 0,
    ...(refinery.outputRack || {}),
  };

  for (const cid of allCids) {
    const batch = activeBatches[cid];
    if (batch) {
      const elapsedSec = (now - batch.startedAt) / 1000;
      if (elapsedSec >= batch.durationSec) {
        newOutputRack[cid] = (newOutputRack[cid] || 0) + batch.outputQty;
        activeBatches[cid] = null;
        completedBatches.push(batch);
      }
    }
  }

  const remainingActiveBatch = Object.values(activeBatches).find((b) => b !== null) || null;

  return {
    updatedRefinery: {
      ...refinery,
      activeBatch: remainingActiveBatch,
      activeBatches,
      outputRack: newOutputRack,
    },
    completedBatch: completedBatches[0] || null,
    completedBatches,
  };
}
